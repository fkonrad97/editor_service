const mongoose = require('mongoose');
const winston = require('winston');
const Node = require('../models/node');
const Link = require('../models/link');  
const Story = require('../models/story'); 
const express = require('express');
const { getIsolatedNodes, getDependentBranch } = require('../services/nodeService');
const router = express.Router();

let currentStory = null;    // figure it out how to do it

router.get('/selectStory', async (req, res) => {
    currentStory = await Story.findOne({ title: req.body.title });

    console.log(currentStory);
    if (currentStory !== null) {
        res.send(`Selected Story: ${currentStory.title}`);
    } else {
        res.status(404).send(`${req.body.title} can not be found!`);
    }
});

router.get('/', async (req, res) => {
    const stories = await Story.find();
    res.send(stories);
});

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

// Uses pre save in nodes to save to the Story also
router.post('/addNode', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const node = new Node({
        startingNode: req.body.startingNode,
        story: currentStory.id,
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

// Uses pre save in links to save to the Story and the related Nodes also
router.post('/addLink', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const fromNode = await Node.findById(req.body.from);
    const toNode = await Node.findById(req.body.to);

    if (fromNode.story.equals(toNode.story)) {
        const link = new Link({
            decisionText: req.body.decisionText,
            story: currentStory.id,
            from: fromNode,
            to: toNode
        })
        await link.save();

        res.send(link);
    } else {
        res.send('They are not in the same Story.');
    }
});

// DELETION
router.delete('/deleteLink/:linkId', async (req, res) => {
    const linkId = new mongoose.Types.ObjectId(req.params.linkId);

    const deletedInstance = await Link.findOneAndDelete(
        { _id: linkId }
    );

    res.send(deletedInstance);
});

router.delete('/deleteNode/:nodeId', async (req, res) => {
    const nodeId = new mongoose.Types.ObjectId(req.params.nodeId);

    await Node.findOneAndDelete(
        { _id: nodeId }
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

router.delete('/deleteIsolatedNodes', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
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

router.delete('/deleteDependencyTree/:startNode', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    const startNode = await Node.findById(req.params.startNode);

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

// UPDATE
/* router.put('/updateLinkToNode/:id', async (req, res) => {
    const link = await Link.findById(req.params.id);
    const newToNode = await Node.findById(req.body.toNode);
    const oldToNode = await Node.findById(link.to);

    oldToNode.updateOne({}, {
        $pull: {
           inLinks: { $in: [link.id] }
       }
    });

    newToNode.inLinks.push(link.id);

    link.to = newToNode.id;

    res.send(link);
});

router.put('/updateLinkFromNode/:id', async (req, res) => {
    const link = await Link.findById(req.params.id);
    const newFromNode = await Node.findById(req.body.fromNode);
    const oldFromNode = await Node.findById(link.from);

    oldFromNode.updateOne({}, {
        $pull: {
           outLinks: { $in: [link.id] }
       }
    });

    newFromNode.outLinks.push(link.id);

    link.from = newFromNode.id;

    res.send(link);
}); */

module.exports = router; 