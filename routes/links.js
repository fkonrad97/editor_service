const mongoose = require('mongoose');
const Node = require('../models/node');
const Link = require('../models/link');  
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    const links = await Link.find();
    res.send(links);
});

// Using URL params
router.post('/:from/:to', async (req, res) => {
    const fromNode = await Node.findById(req.params.from);
    const toNode = await Node.findById(req.params.to);

    const link = new Link({
        decisionText: req.body.decisionText,
        from: fromNode,
        to: toNode
    })
    await link.save();

    fromNode.outLinks.push(link);
    await fromNode.save();

    toNode.inLinks.push(link);
    await toNode.save();

    res.send([fromNode, toNode]);
});

// Using Body params
router.post('/', async (req, res) => {
    const fromNode = await Node.findById(req.body.from);
    const toNode = await Node.findById(req.body.to);

    const link = new Link({
        decisionText: req.body.decisionText,
        from: fromNode,
        to: toNode
    })
    await link.save();

    fromNode.outLinks.push(link);
    await fromNode.save();

    toNode.inLinks.push(link);
    await toNode.save();

    res.send([fromNode, toNode]);
});

router.delete('/:linkId', async (req, res) => {
    const linkId = new mongoose.Types.ObjectId(req.params.linkId);

    const deletedInstance = await Link.findOneAndDelete(
        { _id: linkId }
    );

    res.json(deletedInstance);
});

module.exports = router; 