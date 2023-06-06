const express = require('express');
const router = express.Router();

const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 

const { getUnreachableNodes, getDependentBranch } = require('../services/nodeService');

const { cache, getCache, delCache, getCacheWPattern, setStoryCache } = require('../services/cacheService');
const { loadStory } = require('../services/storyService');

/**
 * To select and cache the current story.
 */
router.get('/loadStory', async (req, res) => {
    const _storyId = req.body.storyId;

    const { stories, nodes, links } = await loadStory(_storyId);

    const mergedArray = stories.concat(links, nodes);

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
 * To create a new event.
 */
router.post('/addEvent', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Story.findOneAndUpdate({
        _id: selectedStoryId
    }, {
        $push: {
            eventContainer: { eventName: req.body.eventName, magnitude: req.body.magnitude, ownerId: req.body.ownerId }
        }
    });

    await cache(`story_${selectedStoryId}`, await Story.findById({_id: selectedStoryId}));

    res.status(200).send(updateResult);
});

/**
 * Add parent stories to the current story.
 */
 router.put('/addParentStory', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Story.findOneAndUpdate({
        _id: selectedStoryId
    }, {
        $push: {
            parentStories: req.body.parentStoryId
        }
    });

    // Full refresh cache
    const { stories, nodes, links } = await loadStory(selectedStoryId);
    await setStoryCache(stories, nodes, links);

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

    await cache(`link_${req.body.linkId}`, await Link.findById({_id: req.body.linkId}));

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

    await cache(`link_${req.body.linkId}`, await Link.findById({_id: req.body.linkId}));

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

    await cache(`node_${req.body.nodeId}`, await Link.findById({_id: req.body.nodeId}));

    res.status(200).send(updateResult);
});

/**
 * Delete parent stories to the current story.
 */
 router.put('/deleteParentStory', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const deletedInstance = await Story.updateOne({
        _id: selectedStoryId
    }, {
        $pull: {
            parentStories: req.body.parentStoryId
        }
    });

    // Full refresh cache
    const { stories, nodes, links } = await loadStory(selectedStoryId);
    await setStoryCache(stories, nodes, links);
    
    res.status(200).send(deletedInstance);
});

/**
 * To delete selected Story.
 * 'Story.findOneAndDelete' uses post middlewares.
 */
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
 * To delete an event.
 */
router.delete('/deleteEvent', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Story.updateOne({
        _id: selectedStoryId
    }, {
        $pull: {
            eventContainer: { _id: req.body.eventId }
        }
    });

    await cache(`story_${selectedStoryId}`, await Story.findById({_id: selectedStoryId}));

    res.status(200).send(updateResult);
});

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    const selectedStoryId = await getCache('SelectedStory');
    if (selectedStoryId == null) return res.status(404).send('Story has not been selected!');

    const nodes = (await getCacheWPattern('node_*')).filter(node => node.storyId === selectedStoryId);
    const links = (await getCacheWPattern('link_*')).filter(link => link.storyId === selectedStoryId);
    const startNode = nodes.find(node => node.startingNode === true);

    if (typeof startNode !== 'undefined') {
        const isolatedNodesIds = getUnreachableNodes(nodes, startNode, links).map(element => element._id);

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

    const nodes = (await getCacheWPattern('node_*')).filter(node => node.storyId === selectedStoryId);
    const links = (await getCacheWPattern('link_*')).filter(link => link.storyId === selectedStoryId);
    const startNode = nodes.find(node => node._id === req.body.startNodeId);

    // Test startNode if the find gave back anything above

    const dependentNodes = getDependentBranch(nodes, links, startNode);

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(await Node.findOneAndDelete( 
            { _id: element._id }
        ));
    }

    // Update cache
    deletedInstances.map(instance => instance.id).forEach(id => delCache(`node_${id}`));

    res.status(200).send(deletedInstances);
});

module.exports = router; 