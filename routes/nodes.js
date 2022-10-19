const mongoose = require('mongoose');
const Node = require('../models/node');
const Link = require('../models/link');
const { getIsolatedNodes, getDependentBranch } = require('../services/nodeService');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const nodes = await Node.find();
    res.send(nodes);
});

router.get('/isolatedNodes', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    /*const startNode = await Node.find({
        startingNode: true
    });*/
    res.send(getIsolatedNodes(nodes, links, nodes[0]));
});

router.get('/:id', async (req, res) => {
    const node = await Node.findById(req.params.id);
    res.send(node);
});

router.post('/', async (req, res) => {
    const node = new Node({
        startingNode: req.body.startingNode,
        nodeStory: req.body.nodeStory
    });
    await node.save();

    res.send(node);
});

router.delete('/:nodeId', async (req, res) => {
    const nodeId = new mongoose.Types.ObjectId(req.params.nodeId);

    const deletedInstance = await Node.findOneAndDelete(
        { _id: nodeId }
    );

    res.send(deletedInstance);
});

router.delete('/deleteIsolatedNodes', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    /*const startNode = await Node.find({
        startingNode: true
    });*/
    
    let deletedInstances = [];
    for (const element of getIsolatedNodes(nodes, links, nodes[0])) {
        const deletedNode = await Node.findOneAndDelete(
            { _id: element._id }
        );
        deletedInstances.push(deletedNode);
    }

    res.send(deletedInstances);
});

router.delete('/deleteDependencyTree/:startNode', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    const startNode = await Node.findById(req.params.startNode);

    const dependentNodes = getDependentBranch(nodes, links, startNode);
    
    let deletedInstances = [];
    for (const element of dependentNodes) {
        const deletedNode = await Node.findOneAndDelete(
            { _id: element._id }
        );
        deletedInstances.push(deletedNode);
    }

    res.send(deletedInstances);
}); 

module.exports = router; 