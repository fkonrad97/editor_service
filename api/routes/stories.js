const express = require('express');
const router = express.Router();

const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 
const { DeployedStory } = require('../models/deployedStory');

const { getIsolatedNodes, getDependentBranch } = require('../services/nodeService');
const StoryCache = require('../caching/cacheStoryService');

/**
 * To select and cache the current story.
 */
router.get('/selectStory', async (req, res) => {
    if (!StoryCache.isEmpty()) StoryCache.clear();

    await StoryCache.setStory(req.body.storyId);
    
    res.status(200).send(StoryCache);
});

/**
 * Get all Story documents from DB.
 */
router.get('/', async (req, res) => {
    const stories = await Story.find();
    res.status(200).send(stories);
});

/**
 * To create a new story.
 */
router.post('/createStory', async (req, res) => {
    const story = new Story({
        title: req.body.title
    })

    await story.save();

    res.status(200).send(story);
});

/**
 * To create a new node.
 * 'Node.save' has post middleware.
 */
router.post('/addNode', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const node = new Node({
        startingNode: req.body.startingNode,
        story: StoryCache.story._id ,
        nodeStory: req.body.nodeStory
    });

    await node.save();

    // Update cache 'StoryCache'
    StoryCache.addNode(node);

    res.status(200).send(node);
});

/**
 * To create a new link.
 */
router.post('/addLink', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const fromNode = StoryCache.nodes.find(node => node._id == req.body.from);
    const toNode = StoryCache.nodes.find(node => node._id == req.body.to);

    const link = new Link({
        decisionText: req.body.decisionText,
        story: StoryCache.story._id,
        from: fromNode,
        to: toNode
    });

    await link.save();

    // Update cache 'StoryCache'
    StoryCache.addLink(link);

    res.status(200).send(link);
});

/**
 * Add parent stories to the current story.
 */
 router.put('/addParentStory/:storyId', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.params.storyId
    });

    await Story.findOneAndUpdate({
        _id: StoryCache.story._id
    }, {
        $push: {
            parentCIDs: story.cid
        }
    });

    // Update cache 'StoryCache'
    StoryCache.refresh();

    res.send(`Parent story added successfully!`);
});

/**
 * To update the selected link's 'to' property.
 */
router.put('/updateLinkToNode', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        to: req.body.toNodeId
    });

    // Update cache 'StoryCache'
    StoryCache.links.find(link => link._id == req.body.linkId).to = req.body.toNodeId;

    res.status(200).send(updateResult);
});

/**
 * To update the selected link's 'from' property.
 */
router.put('/updateLinkFromNode', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        from: req.body.fromNodeId
    });

    // Update cache 'StoryCache'
    StoryCache.links.find(link => link._id == req.body.linkId).from = req.body.fromNodeId;

    res.status(200).send(updateResult);
});

/**
 * To update the selected node's text.
 */
router.put('/updateNodeStory', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const updateResult = await Node.updateOne({
        _id: req.body.nodeId
    }, {
        nodeStory: req.body.text
    });

    // Update cache 'StoryCache'
    StoryCache.nodes.find(node => node._id == req.body.nodeId).nodeStory = req.body.text;

    res.status(200).send(updateResult);
});

/**
 * Delete parent stories to the current story.
 */
 router.put('/deleteParentStory/:storyId', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.params.storyId
    });

    const deletion = await Story.updateOne({
        _id: StoryCache.story._id 
    }, {
        $pull: {
            parentCIDs: story.cid
        }
    });

    // Update cache 'StoryCache'
    StoryCache.refresh();
    
    res.status(200).send(deletion);
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
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');   

    const deletedInstance = await Node.findOneAndDelete(
        { _id: req.body.nodeId }
    );

    // Update cache 'StoryCache'
    StoryCache.removeNode(req.body.nodeId);

    res.status(200).send(deletedInstance);
});

/**
 * To delete selected link.
 * 'Link.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteLink', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!');

    const deletedInstance = await Link.findOneAndDelete(
        { _id: req.body.linkId }
    );

    // Update cache 'StoryCache'
    StoryCache.removeLink(req.body.linkId);

    res.status(200).send(deletedInstance);
});

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    if (StoryCache.isEmpty()) return res.status(404).send('Story has not been selected!'); 

    const startNode = StoryCache.nodes.find(node => node.startingNode == true);

    if (typeof startNode !== 'undefined') {
        let deletedInstances = [];
        for (const element of getIsolatedNodes(StoryCache.nodes, startNode, StoryCache.links)) {
            const deletedNode = await Node.findOneAndDelete(
                { _id: element._id }
            );
            deletedInstances.push(deletedNode);
        }

        // Update cache 'StoryCache'
        // Create a helper remove function for the cache
        deletedInstances.forEach(deletedInstance => {
            StoryCache.removeNode(deletedInstance._id);
        });

        res.status(200).send(deletedInstances);
    } else {
        res.status(404).send("StartNode not defined!");
    }
});

/**
 * To delete all nodes and links which are depend on the 'startNode' argument.
 */
router.delete('/deleteDependencyTree', async (req, res) => {
    if (StoryCache === null) return res.status(404).send('Story has not been selected!');

    const startNode = StoryCache.nodes.find(node => node._id == req.body.startNodeId);

    const dependentNodes = getDependentBranch(StoryCache.nodes, StoryCache.links, startNode);

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(await Node.findOneAndDelete(
            { _id: element.id }
        ));
    }

    // Update cache 'StoryCache'
    // Create a helper remove function for the cache
    deletedInstances.forEach(deletedInstance => {
        StoryCache.removeNode(deletedInstance._id);
    })

    res.status(200).send(deletedInstances);
});

module.exports = router; 