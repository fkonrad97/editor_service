const winston = require('winston');
const express = require('express');
const router = express.Router();

const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 
const { DeployedStory } = require('../models/deployedStory');

const { getIsolatedNodes, getDependentBranch } = require('../services/nodeService');
const { cacheStory } = require('../cache/cacheStoryService');

/** Cached object (temporary solution) */
let activeStory = null;

/**
 * To select and cache the current story.
 */
router.get('/selectStory', async (req, res, next) => {
    activeStory = null;
    
    const story = await Story.findOne({
        title: req.body.title
    })
    
    const storyNodes = await Node.find({
        story: story.id
    })
    
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
    res.send(stories);
});

/**
 * To create a new story.
 */
router.post('/createStory/:title', async (req, res) => {
    const story = new Story({
        title: req.params.title
    })

    await story.save();

    res.send(`Story: ${story.id} saved successfully!`);
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

    res.send(`Node: ${node.id} saved successfully!`);
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

    res.send(`Link: ${link.id} saved successfully!`);
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
    const tmpNodes = activeStory.nodes;
    const tmpLinks = activeStory.links;
    activeStory = await cacheStory(resultStory, tmpNodes, tmpLinks);
    
    res.send(`Parent story deleted successfully!`);
});

/**
 * To update the selected link's 'to' property.
 */
router.put('/updateLinkToNode/:linkId', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    await Link.updateOne({
        _id: req.params.linkId  
    }, {
        to: req.body.toNodeId
    });

    // Update cache 'activeStory'
    activeStory.links.find(link => link._id == req.params.linkId).to = req.body.toNodeId;

    res.send("Update was succesful!");
});

/**
 * To update the selected link's 'from' property.
 */
router.put('/updateLinkFromNode/:linkId', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    await Link.updateOne({
        _id: req.params.linkId
    }, {
        from: req.body.fromNodeId
    });

    // Update cache 'activeStory'
    activeStory.links.find(link => link._id == req.params.linkId).from = req.body.fromNodeId;

    res.send("Update was succesful!");
});

/**
 * To update the selected node's text.
 */
router.put('/updateNodeStory/:nodeId', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    await Node.updateOne({
        _id: req.params.nodeId
    }, {
        nodeStory: req.body.text
    });

    // Update cache 'activeStory'
    activeStory.nodes.find(node => node._id == req.params.nodeId).nodeStory = req.body.text;

    res.send("NodeStory update was succesful!");
});

/**
 * To delete selected Story.
 * 'Story.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteStory/:storyId', async (req, res) => {
    const deletedInstance = await Story.findOneAndDelete(
        { _id: req.params.storyId }
    );

    res.send(`Story: ${deletedInstance.id} deleted successfully!`);
});

/**
 * To delete selected link.
 * 'Link.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteLink/:linkId', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    await Link.findOneAndDelete(
        { _id: req.params.linkId }
    );

    // Update cache 'activeStory'
    activeStory.links.splice(activeStory.links.find(link => link._id == req.params.linkId), 1);

    res.send(`Link: ${deletedInstance.id} deleted successfully!`);
});

/**
 * To delete selected node.
 * 'Node.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteNode/:nodeId', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');   

    await Node.findOneAndDelete(
        { _id: req.params.nodeId }
    );

    // Update cache 'activeStory'
    activeStory.nodes.splice(activeStory.nodes.find(node => node._id == req.params.nodeId), 1);

    res.send(`Node: ${deletedInstance.id} deleted successfully!`);
});

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');     

    const nodes = await Node.find({        
        story: activeStory.story._id 
    });

    const startNode = nodes.find(node => node.startingNode == true);

    if (typeof startNode !== 'undefined') {
        let deletedInstances = [];
        for (const element of getIsolatedNodes(nodes, startNode)) {
            const deletedNode = await Node.findOneAndDelete(
                { _id: element._id }
            );
            deletedInstances.push(deletedNode);
        }

        // Update cache 'activeStory'
        const tmpNodes = activeStory.nodes;
        const tmpLinks = activeStory.links;
        activeStory = await cacheStory(resultStory, tmpNodes, tmpLinks);

        res.send(deletedInstances);
    } else {
        res.status(404).send('Starting point not defined!');
    }
});

/**
 * To delete all nodes and links which are depend on the 'startNode' argument.
 */
router.delete('/deleteDependencyTree/:startNode', async (req, res) => {
    if (activeStory === null) return res.status(404).send('Story has not been selected!');

    const startNode = await Node.findById(req.params.startNode);

    const nodes = await Node.find({                                     
        story: activeStory.story._id
    });

    const links = await Link.find({                                   
        story: activeStory.story._id
    });

    const dependentNodes = getDependentBranch(nodes, links, startNode);

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(await Node.findOneAndDelete(
            { _id: element.id }
        ));
    }

    // Update cache 'activeStory'
    const tmpNodes = activeStory.nodes;
    const tmpLinks = activeStory.links;
    activeStory = await cacheStory(resultStory, tmpNodes, tmpLinks);

    res.send(deletedInstances);
});

module.exports = router; 