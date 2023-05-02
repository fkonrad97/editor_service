const express = require('express');
const router = express.Router();

const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 
const { DeployedStory } = require('../models/deployedStory');

const { getUnreachableNodes, getDependentBranch } = require('../services/nodeService');

const { getCachedData } = require('../middleware/cacheMiddleware');
const { cache, getCache, delCache, getCacheWPattern, setStoryCache } = require('../services/cacheService');
const { mergeStories } = require('../services/storyService');
const { redisClient } = require('../startup/caching');

/**
 * To select and cache the current story.
 */
router.get('/loadStory', async (req, res) => {
    const _storyId = req.body.storyId;

    const tmpStory = await Story.findOne({ id: _storyId });
    const tmpNodes = await Node.find({ story: _storyId });
    const tmpLinks = await Link.find({ story: _storyId });
    const { stories, nodes, links } = await mergeStories(tmpStory, tmpNodes, tmpLinks);

    const mergedArray = nodes.concat(links); // ???

    await setStoryCache(stories, nodes, links);

    await cache('SelectedStory', _storyId);
    
    res.status(200).send(mergedArray);
});

/**
 * Get all Story documents from DB.
 */
router.get('/', async (req, res) => {
    const stories = await Story.find({});
    res.status(200).send(stories);
});

/**
 * To create a new story.
 */
router.post('/createStory', async (req, res) => {
    const story = new Story({
        title: req.body.title
    });

    await story.save();

    await cache(`story_${story.id}`, story);

    res.status(200).send(story);
});

/**
 * To create a new node.
 * 'Node.save' has post middleware.
 */
router.post('/addNode', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const node = new Node({
        startingNode: req.body.startingNode,
        story: selectedStoryId,
        nodeStory: req.body.nodeStory
    });

    await node.save();

    await cache(`node_${node.id}`, node);

    res.status(200).send(node);
});

/**
 * To create a new link.
 */
router.post('/addLink', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const fromNode = await getCache(`node_${req.body.from}`);
    const toNode = await getCache(`node_${req.body.to}`);

    const link = new Link({
        decisionText: req.body.decisionText,
        story: selectedStoryId,
        from: fromNode._id,
        to: toNode._id
    });

    await link.save();

    await cache(`link_${link.id}`, link);

    res.status(200).send(link);
});

/**
 * Add parent stories to the current story.
 *  MORE WORK ON THAT
 */
 router.put('/addParentStory', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.body.storyId
    });

    const updateResult = await Story.findOneAndUpdate({
        _id: CacheStoryService.story._id
    }, {
        $push: {
            parentCIDs: story.cid
        }
    });

    // Update cache

    res.status(200).send(updateResult);
});

/**
 * To update the selected link's 'to' property.
 */
router.put('/updateLinkToNode', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        to: req.body.toNodeId
    });

    await cache(`link_${req.body.linkId}`);

    res.status(200).send(updateResult);
});

/**
 * To update the selected link's 'from' property.
 */
router.put('/updateLinkFromNode', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        from: req.body.fromNodeId
    });

    await cache(`link_${req.body.linkId}`);

    res.status(200).send(updateResult);
});

/**
 * To update the selected node's text.
 */
router.put('/updateNodeStory', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Node.updateOne({
        _id: req.body.nodeId
    }, {
        nodeStory: req.body.text
    });

    await cache(`node_${req.body.nodeId}`);

    res.status(200).send(updateResult);
});

/**
 * ??????
 * Delete parent stories to the current story.
 */
 router.put('/deleteParentStory', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.body.storyId
    });

    const deletion = await Story.updateOne({
        _id: CacheStoryService.story._id 
    }, {
        $pull: {
            parentCIDs: story.cid
        }
    });

    // Update cache
    
    res.status(200).send(deletion);
});

/**
 * To delete selected Story.
 * 'Story.findOneAndDelete' uses post middlewares.
 */
// CACHE LOGIC HERE QUESTIONABLE
router.delete('/deleteStory', async (req, res) => {
    const deletedInstance = await Story.findOneAndDelete(
        { _id: req.body.storyId }
    );

    res.status(200).send(deletedInstance);
});

/**
 * To delete selected node.
 * 'Node.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteNode', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const deletedInstance = await Node.findOneAndDelete(
        { _id: req.body.nodeId }
    );

    await delCache(`node_${req.body.nodeId}`);

    res.status(200).send(deletedInstance);
});

/**
 * To delete selected link.
 * 'Link.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteLink', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const deletedInstance = await Link.findOneAndDelete(
        { _id: req.body.linkId }
    );

    await delCache(`link_${req.body.linkId}`);

    res.status(200).send(deletedInstance);
});

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const nodes = await getCacheWPattern('node_*');
    const links = await getCacheWPattern('link_*');
    const startNode = nodes.find(node => node.startingNode === true);

    if (typeof startNode !== 'undefined') {
        const isolatedNodesIds = getUnreachableNodes(nodes, startNode, links).map(element => element.id);

        const deletedInstances = await Node.deleteMany({
            _id: {
                $in: isolatedNodesIds
            }
        });

        isolatedNodesIds.forEach(deletedNodeId => delCache(`node_${deletedNodeId}`));

        res.status(200).send(deletedInstances);
    } else {
        res.status(404).send("StartNode not defined!");
    }
});

/**
 * To delete all nodes and links which are depend on the 'startNode' argument.
 * 'findOneAndDelete' is justified, because of the post-hook which deletes the related links
 */
router.delete('/deleteDependencyTree', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const nodes = await getCacheWPattern('node_*');
    const links = await getCacheWPattern('link_*');
    const startNode = nodes.find(node => node._id === req.body.startNodeId);

    const dependentNodes = getDependentBranch(nodes, links, startNode);

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(await Node.findOneAndDelete( 
            { _id: element.id }
        ));
    }

    // Update cache
    deletedInstances.map(instance => instance.id).forEach(id => delCache(`node_${id}`));

    res.status(200).send(deletedInstances);
});

module.exports = router; 