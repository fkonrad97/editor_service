const mongoose = require('mongoose');
const {Node, getIsolatedNodes} = require('../models/node'); 
const express = require('express');
const router = express.Router();

/*router.get('/', async (req, res) => {
    const nodes = await Node.find();
    res.send(nodes);
});*/

router.get('/', async (req, res) => {
    const nodes = await Node.find();
    const startNode = nodes[0];
    res.send(getIsolatedNodes(nodes, startNode));
});

router.get('/:id', async (req, res) => {
    const node = await Node.findById(req.params.id);
    res.send(node);
});

router.post('/', async (req, res) => {
    const node = new Node({
        nodeStory: req.body.nodeStory
    });
    await node.save();

    res.send(node);
});

module.exports = router; 