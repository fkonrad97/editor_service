const mongoose = require('mongoose');
const Node = require('../models/node');
const Link = require('../models/link');
const { getIsolatedNodes, getDependentBranch, deleteNode } = require('../services/nodeService');
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

router.get('/dependent', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    /*const startNode = await Node.find({
        startingNode: true
    });*/
    res.send(getDependentBranch(nodes, links, nodes[0]));
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
    console.log(dependentNodes);  

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(deleteNode(element));
    }

    res.send(deletedInstances);
}); 


router.post('/test', async (req, res) => {
    const node1 = new Node({
        nodeStory: "Node1"
    });

    const node2 = new Node({
        nodeStory: "Node2"
    });

    const node3 = new Node({
        nodeStory: "Node3"
    });

    const node4 = new Node({
        nodeStory: "Node4"
    });

    const node5 = new Node({
        nodeStory: "Node5"
    });

    const node6 = new Node({
        nodeStory: "Node6"
    });

    const link1 = new Link({
        decisionText: "Link1",
        to: node2,
        from: node1
    });
    link1.save();

    const link2 = new Link({
        decisionText: "Link2",
        to: node3,
        from: node1
    });
    link2.save();

    const link3 = new Link({
        decisionText: "Link3",
        to: node6,
        from: node2
    });
    link3.save();

    const link4 = new Link({
        decisionText: "Link4",
        to: node4,
        from: node2
    });
    link4.save();

    const link5 = new Link({
        decisionText: "Link5",
        to: node4,
        from: node3
    });
    link5.save();

    const link6 = new Link({
        decisionText: "Link6",
        to: node5,
        from: node3
    });
    link6.save();

    const link7 = new Link({
        decisionText: "Link7",
        to: node6,
        from: node5
    });
    link7.save();

    node1.outLinks.push(link1);
    await node1.save();
    node2.inLinks.push(link1);
    await node2.save();

    node1.outLinks.push(link2);
    await node1.save();
    node3.inLinks.push(link2);
    await node3.save();

    node2.outLinks.push(link3);
    await node2.save();
    node6.inLinks.push(link3);
    await node6.save();

    node2.outLinks.push(link4);
    await node2.save();
    node4.inLinks.push(link4);
    await node4.save();

    node3.outLinks.push(link5);
    await node3.save();
    node4.inLinks.push(link5);
    await node4.save();

    node3.outLinks.push(link6);
    await node3.save();
    node5.inLinks.push(link6);
    await node5.save();

    node5.outLinks.push(link7);
    await node5.save();
    node6.inLinks.push(link7);
    await node6.save();

    res.send();
});

module.exports = router; 