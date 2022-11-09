const mongoose = require('mongoose');
const winston = require('winston');
const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const Story = require('../models/story'); 
const express = require('express');
const { getIsolatedNodes, getDependentBranch } = require('../services/nodeService');
const router = express.Router();

/**
 * Temporary solution for selecting a current story.
 */
let currentStory = null;    // figure it out how to do it

/**
 * To select a current story.
 */
router.get('/selectStory', async (req, res) => {
    currentStory = await Story.findOne({ title: req.body.title });

    if (currentStory !== null) {
        res.send(`Selected Story: ${currentStory.title}`);
    } else {
        res.status(404).send(`${req.body.title} can not be found!`);
    }
});

/**
 * To get all Story documents from DB.
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

/**
 * To delete selected Story.
 * 'Story.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteStory/:storyId', async (req, res) => {
    const storyId = new mongoose.Types.ObjectId(req.params.storyId);

    const deletedInstance = await Story.findOneAndDelete(
        { _id: storyId }
    );

    res.send(deletedInstance);
});

/**
 * To delete selected link.
 * 'Link.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteLink/:linkId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const linkId = new mongoose.Types.ObjectId(req.params.linkId);

    const deletedInstance = await Link.findOneAndDelete(
        { _id: linkId }
    );

    res.send(deletedInstance);
});

/**
 * To delete selected node.
 * 'Node.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteNode/:nodeId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

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

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const nodes = await Node.find({ 
        story: currentStory.id
    });
    const links = await Link.find({
        story: currentStory.id
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
    const nodes = await Node.find({ 
        story: currentStory.id
    });
    const links = await Link.find({
        story: currentStory.id
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

/**
 * To update the selected link's 'to' property.
 */
router.put('/updateLinkToNode/:linkId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const link = await Link.findById(req.params.linkId);
    const newToNode = await Node.findById(req.body.toNode);
    const oldToNode = await Node.findById(link.to);

    await Node.updateOne({
        _id: oldToNode.id
    }, {
        $pull: {
           inLinks: link.id
       }
    })
    .then(() => {
        Node.updateOne({
            _id: newToNode.id
        }, {
            $push:  {
                inLinks: link.id
            }
        })
        .then(() => {
            Link.updateOne({
                _id: link.id
            }, {
                to: newToNode.id
            })
            .then(() => {
                winston.info('Update was succesful!');
            })
            .catch(err => winston.info(`Error has been caught during updating the Link's 'to' property: ${err}`));
        })
        .catch(err => winston.info(`Error has been caught during updating the old 'outLinks' list: ${err}`));
    })
    .catch(err => winston.info(`Error has been caught during updating the old 'inLinks' list: ${err}`));

    res.send("Update was succesful!");
});

/**
 * To update the selected link's 'from' property.
 */
router.put('/updateLinkFromNode/:linkId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const link = await Link.findById(req.params.linkId);
    const newFromNode = await Node.findById(req.body.fromNode);
    const oldFromNode = await Node.findById(link.from);

    await Node.updateOne({
        _id: oldFromNode.id
    }, {
        $pull: {
           outLinks: link.id
       }
    })
    .then(() => {
        Node.updateOne({
            _id: newFromNode.id
        }, {
            $push:  {
                outLinks: link.id
            }
        })
        .then(() => {
            Link.updateOne({
                _id: link.id
            }, {
                from: newFromNode.id
            })
            .then(() => {
                winston.info('Update was succesful!');
            })
            .catch(err => winston.info(`Error has been caught during updating the Link's 'from' property: ${err}`));
        })
        .catch(err => winston.info(`Error has been caught during updating the old 'inLinks' list: ${err}`));
    })
    .catch(err => winston.info(`Error has been caught during updating the old 'outLinks' list: ${err}`));

    res.send("Update was succesful!");
});

/**
 * To update the selected node's text.
 */
router.put('/updateNodeStory/:nodeId', async (req, res) => {
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const node = await Link.findById(req.params.nodeId);
    const updatedText = req.body.text;

    await Node.updateOne({
        _id: node.id
    }, {
        nodeStory: updatedText
    })
    .then(() => {
        winston.info('NodeStory update was succesful!');
    })
    .catch(err => winston.info(`Error has been caught during updating the node's text: ${err}`));

    res.send("NodeStory update was succesful!");
});

module.exports = router; 