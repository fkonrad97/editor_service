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

router.delete('/:linkid', async (req, res) => {
    const deletedInstance = await Link.findOneAndDelete(
        { _id: req.params.linkid}
    )

    res.send(deletedInstance);
});

// Nem torli ki a referenciakat a nem torolt de kapcsolodo nodeokbol
/* router.delete('/:startNode', async (req, res) => {
    const nodes = await Node.find();
    const startNode = await Node.findById(req.params.startNode);
    const dependentNodes = getDependentBranch(nodes, startNode);

    let deletedNodes = [];
      for (const element of dependentNodes) {
        for (const fromNode of element.inLinks) {
            const tmpNode = nodes.find(node => node.id == fromNode);
            if (!dependentNodes.includes(tmpNode)) {
                const index = tmpNode.outLinks.indexOf(element);
                tmpNode.outLinks.splice(index, 1);
            }
        }

        for (const toNode of element.outLinks) {
            const tmpNode = nodes.find(node => node.id == toNode.id);
            if (!dependentNodes.includes(tmpNode)) {
                const index = tmpNode.indexOf(element);
                tmpNode.splice(index, 1);
            }
        } 

        const node = await Node.findByIdAndRemove(element.id);
        deletedNodes.push(node);
    }

    res.send(deletedNodes);
}); */

module.exports = router; 