const winston = require('winston');
const express = require('express');
const router = express.Router();

const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 
const { DeployedStory } = require('../models/deployedStory');

const { getIsolatedNodes, getDependentBranch } = require('../services/nodeService');
const { cacheStory, CachedStory } = require('../cache/cacheStoryService');

/** Cached object (temporary solution) */
let activeStory = null;

router.get('/test/:storyId', async (req, res) => {
    const cache = new CachedStory();
    await cache.construct(req.params.storyId);

    res.send(cache.nodes);
});

/**
 * To select and cache the current story.
 */
router.get('/selectStory', async (req, res) => {
    activeStory = null;
    
    const story = await Story.findOne({
        title: req.body.title
    });
    
    const storyNodes = await Node.find({
        story: story.id
    });
    
    const storyLinks = await Link.find({
        story: story.id
    });

    activeStory = await cacheStory(story, storyNodes, storyLinks);
    
    res.send(`${req.body.title} has been selected!`);
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
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const node = new Node({
        startingNode: req.body.startingNode,
        story: activeStory.story._id ,
        nodeStory: req.body.nodeStory
    });

    await node.save();

    // Update cache 'activeStory'
    activeStory.nodes.push(this);

    res.status(200).send(node);
});

/**
 * To create a new link.
 */
router.post('/addLink', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const fromNode = activeStory.nodes.find(node => node._id == req.body.from);
    const toNode = activeStory.nodes.find(node => node._id == req.body.to);

    const link = new Link({
        decisionText: req.body.decisionText,
        story: activeStory.story._id,
        from: fromNode,
        to: toNode
    });

    await link.save();

    // Update cache 'activeStory'
    activeStory.links.push(this);

    res.status(200).send(link);
});

/**
 * Add parent stories to the current story.
 */
 router.put('/addParentStory/:storyId', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.params.storyId
    });

    await Story.findOneAndUpdate({
        _id: activeStory.story._id
    }, {
        $push: {
            parentCIDs: story.cid
        }
    });

    // Update cache 'activeStory'
    const tmpNodes = activeStory.nodes;
    const tmpLinks = activeStory.links;
    activeStory = await cacheStory(resultStory, tmpNodes, tmpLinks);

    res.send(`Parent story added successfully!`);
});

/**
 * To update the selected link's 'to' property.
 */
router.put('/updateLinkToNode', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        to: req.body.toNodeId
    });

    // Update cache 'activeStory'
    activeStory.links.find(link => link._id == req.body.linkId).to = req.body.toNodeId;

    res.status(200).send(updateResult);
});

/**
 * To update the selected link's 'from' property.
 */
router.put('/updateLinkFromNode', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        from: req.body.fromNodeId
    });

    // Update cache 'activeStory'
    activeStory.links.find(link => link._id == req.body.linkId).from = req.body.fromNodeId;

    res.status(200).send(updateResult);
});

/**
 * To update the selected node's text.
 */
router.put('/updateNodeStory', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const updateResult = await Node.updateOne({
        _id: req.body.nodeId
    }, {
        nodeStory: req.body.text
    });

    // Update cache 'activeStory'
    activeStory.nodes.find(node => node._id == req.body.nodeId).nodeStory = req.body.text;

    res.status(200).send(updateResult);
});

/**
 * Delete parent stories to the current story.
 */
 router.put('/deleteParentStory/:storyId', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.params.storyId
    });

    await Story.updateOne({
        _id: activeStory.story._id 
    }, {
        $pull: {
            parentCIDs: story.cid
        }
    });

    // Update cache 'activeStory'
    // WRONG
    const tmpNodes = activeStory.nodes;
    const tmpLinks = activeStory.links;
    activeStory = await cacheStory(resultStory, tmpNodes, tmpLinks);
    
    res.send(`Parent story deleted successfully!`);
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
 * To delete selected link.
 * 'Link.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteLink', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const deletedInstance = await Link.findOneAndDelete(
        { _id: req.body.linkId }
    );

    // Update cache 'activeStory'
    activeStory.links.splice(activeStory.links.find(link => link._id == req.body.linkId), 1);

    res.status(200).send(deletedInstance);
});

/**
 * To delete selected node.
 * 'Node.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteNode', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');   

    const deletedInstance = await Node.findOneAndDelete(
        { _id: req.body.nodeId }
    );

    // Update cache 'activeStory'
    // WRONG - links should be updated too
    activeStory.nodes.splice(activeStory.nodes.find(node => node._id == req.body.nodeId), 1);

    res.status(200).send(deletedInstance);
});

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!'); 

    const startNode = activeStory.nodes.find(node => node.startingNode == true);

    if (typeof startNode !== 'undefined') {
        let deletedInstances = [];
        for (const element of getIsolatedNodes(activeStory.nodes, startNode, activeStory.links)) {
            const deletedNode = await Node.findOneAndDelete(
                { _id: element._id }
            );
            deletedInstances.push(deletedNode);
        }

        // Update cache 'activeStory'
        // Create a helper remove function for the cache
        // WRONG - links should be updated too
        deletedInstances.forEach(deletedInstance => {
            activeStory.nodes.splice(activeStory.nodes.indexOf(activeStory.nodes.find(node => node._id == deletedInstance._id)), 1);
        })

        res.status(200).send(deletedInstances);
    } else {
        res.status(404);
    }
});

/**
 * To delete all nodes and links which are depend on the 'startNode' argument.
 */
router.delete('/deleteDependencyTree', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const startNode = activeStory.nodes.find(node => node._id == req.body.startNodeId);

    const dependentNodes = getDependentBranch(activeStory.nodes, activeStory.links, startNode);

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(await Node.findOneAndDelete(
            { _id: element.id }
        ));
    }

    // Update cache 'activeStory'
    // Create a helper remove function for the cache
    deletedInstances.forEach(deletedInstance => {
        activeStory.nodes.splice(activeStory.nodes.indexOf(activeStory.nodes.find(node => node._id == deletedInstance._id)), 1);
    })

    res.status(200).send(deletedInstances);
});

module.exports = router; 