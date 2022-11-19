const mongoose = require('mongoose');
const winston = require('winston');
const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 
const express = require('express');
const { getIsolatedNodes, getDependentBranch, loadStory, mergeStories } = require('../services/nodeService');
const { DeployedStory } = require('../models/deployedStory');
const router = express.Router();

/**
 * Temporary solution for selecting a current story.
 */
let currentStory = null;    // figure it out how to do it

/**
 * To select a current story.
 */
router.get('/selectStory', async (req, res) => {
    currentStory = null;

    const story = await Story.findOne({
        title: req.body.title
    });

    const storyNodes = await Node.find({
        story: story.id
    });

    const storyLinks = await Link.find({
        story: story.id
    });

    currentStory = await loadStory(story, storyNodes, storyLinks);

    //currentStory = mergeStories(currentStory);

    res.send(currentStory);
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

    story.save(function(err,result){
        if (err){
            winston.info(`Story: {${story.id}} caugth error during saving: ${err}`);
            res.status(400).send(`Unable to save to database: ${err}`);
        }
        else {
            winston.info(`Story: {${result.id}} saved to the database.`);
            res.send("Story saved to database!");
        }
    });
});

/**
 * To create a new node.
 * 'Node.save' has post middleware.
 */
router.post('/addNode', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    console.log(currentStory.storyId);

    const node = new Node({
        startingNode: req.body.startingNode,
        story: currentStory.storyId,
        nodeStory: req.body.nodeStory
    });

    node.save(function (err) {
        if (err) {
            winston.info(`Node: {${node.id}} caugth error during saving: ${err}`);
            res.status(400).send(`Unable to save to database: ${err}`);
        }
    });

    res.send(node);
});

/**
 * To create a new link.
 * 'Link.save' has post middlewares.
 */
router.post('/addLink', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const fromNode = await Node.findById(req.body.from);
    const toNode = await Node.findById(req.body.to);

    if (fromNode.story.equals(toNode.story)) {
        const link = new Link({
            decisionText: req.body.decisionText,
            story: currentStory.storyId,
            from: fromNode,
            to: toNode
        })
        await link.save();

        res.send(link);
    } else {
        res.send('They are not in the same Story.');
    }
});

/**
 * Add parent stories to the current story.
 */
 router.put('/addParentStory/:storyId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.params.storyId
    });

    await Story.updateOne({
        _id: currentStory.storyId
    }, {
        $push: {
            parentCIDs: story.cid
        }
    })
    .then(() => {
        winston.info("Parent story added! ", res);
    })
    .catch(err => winston.info(`Error has been caught during the update: ${err}`));

    res.send(story.cid);
});

/**
 * Delete parent stories to the current story.
 */
 router.put('/deleteParentStory/:storyId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.params.storyId
    });

    await Story.updateOne({
        _id: currentStory.storyId
    }, {
        $pull: {
            parentCIDs: story.cid
        }
    })
    .then(() => {
        winston.info("Parent story deleted! ", res);
    })
    .catch(err => winston.info(`Error has been caught during the update: ${err}`));

    res.send(story.cid);
});

/**
 * To update the selected link's 'to' property.
 */
router.put('/updateLinkToNode/:linkId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    await Link.updateOne({
        _id: req.params.linkId
    }, {
        to: req.body.toNodeId
    })
    .then(() => {
        winston.info('Update was succesful!');
    })
    .catch(err => winston.info(`Error has been caught during updating the Link's 'to' property: ${err}`));

    res.send("Update was succesful!");
});

/**
 * To update the selected link's 'from' property.
 */
router.put('/updateLinkFromNode/:linkId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    await Link.updateOne({
        _id: req.params.linkId
    }, {
        from: req.body.fromNodeId
    })
    .then(() => {
        winston.info('Update was succesful!');
    })
    .catch(err => winston.info(`Error has been caught during updating the Link's 'from' property: ${err}`));

    res.send("Update was succesful!");
});

/**
 * To update the selected node's text.
 */
router.put('/updateNodeStory/:nodeId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    await Node.updateOne({
        _id: req.params.nodeId
    }, {
        nodeStory: req.body.text
    })
    .then(() => {
        winston.info('NodeStory update was succesful!');
    })
    .catch(err => winston.info(`Error has been caught during updating the node's text: ${err}`));

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

    res.send(deletedInstance);
});

/**
 * To delete selected link.
 * 'Link.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteLink/:linkId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const deletedInstance = await Link.findOneAndDelete(
        { _id: req.params.linkId }
    );

    res.send(deletedInstance);
});

/**
 * To delete selected node.
 * 'Node.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteNode/:nodeId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    await Node.findOneAndDelete(
        { _id: req.params.nodeId }
    )
    .then(deletedNode => {
        winston.info(`Deletion was successful for: ${deletedNode}`);
        res.send('Deletion was successful!');
    })
    .catch(err => {
        winston.info(`Deletion was unsuccessful for: ${err}`);
        res.status(404).send('Deletion was unsuccessful!');
    });
});

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const nodes = await Node.find({         // Replace it when caching is active
        story: currentStory.storyId
    });
    const links = await Link.find({
        story: currentStory.storyId
    });
    const startNode = nodes.find(node => node.startingNode == true);

    if (typeof startNode !== 'undefined') {
        let deletedInstances = [];
        for (const element of getIsolatedNodes(nodes, links, startNode)) {
            const deletedNode = await Node.findOneAndDelete(
                { _id: element._id }
            );
            deletedInstances.push(deletedNode);
        } 
        res.send(deletedInstances);
    } else {
        res.status(404).send('Starting point not defined!');
    }
});

/**
 * To delete all nodes and links which are depend on the 'startNode' argument.
 */
router.delete('/deleteDependencyTree/:startNode', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const startNode = await Node.findById(req.params.startNode);
    const nodes = await Node.find({     // Replace it when caching is active
        story: currentStory.storyId
    });
    const links = await Link.find({
        story: currentStory.storyId
    });

    const dependentNodes = getDependentBranch(nodes, links, startNode);
    console.log(dependentNodes);  

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(await Node.findOneAndDelete(
            { _id: element.id }
        ));
    }

    res.send(deletedInstances);
});

module.exports = router; 