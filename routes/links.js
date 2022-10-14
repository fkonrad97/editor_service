const mongoose = require('mongoose');
const {Node} = require('../models/node'); 
const express = require('express');
const router = express.Router();

/**
 * Will display the nodes choices.
 * @param id - Node's ID
 */
router.get('/:id', async (req, res) => {
    const node = await Node.findById(req.params.id);

    res.send(node.to);
});

// Using URL params
router.post('/:from/:to', async (req, res) => {
    const fromNode = await Node.findById(req.params.from);
    const toNode = await Node.findById(req.params.to);

    fromNode.outLinks.push({
        decisionText: req.body.decisionText,
        to: toNode
    });
    await fromNode.save();

    toNode.inLinks.push(fromNode);
    await toNode.save();

    res.send([fromNode, toNode]);
});

// Using Body params
router.post('/', async (req, res) => {
    const fromNode = await Node.findById(req.body.from);
    const toNode = await Node.findById(req.body.to);

    fromNode.outLinks.push({
        decisionText: req.body.decisionText,
        to: toNode
    });
    await fromNode.save();

    toNode.inLinks.push(fromNode);
    await toNode.save();

    res.send([fromNode, toNode]);

});

module.exports = router; 