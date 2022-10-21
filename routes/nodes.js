const mongoose = require('mongoose');
const Node = require('../models/node');
const Link = require('../models/link');
const { getIsolatedNodes, getDependentBranch, deleteNode } = require('../services/nodeService');
const winston = require('winston');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const nodes = await Node.find();
    res.send(nodes);
});

router.get('/isolatedNodes', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    const startNode = nodes.find(node => node.startingNode == true);
    if (typeof startNode !== 'undefined') {
        res.send(getIsolatedNodes(nodes, links, startNode));
    } else {
        res.status(404).send('Starting point not defined!');
    }
});

router.get('/dependencyTree/:id', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    
    let dependentNodes = [];
        
    const startNode = nodes.find(node => node.id == req.params.id)
        
    if (typeof startNode !== 'undefined') {
        dependentNodes = getDependentBranch(nodes, links, startNode);
        res.send(dependentNodes);
    } else {
        res.status(404).send('There are 0 node in the Story or the given ID is not found!');
    }
});

router.get('/:id', async (req, res) => {
    const node = await Node.findById(req.params.id)
        .then(result => {
            res.send(node);
        })
        .catch(err => {
            res.status(404).send(`ID: {${req.params.id}} not found.`);
        })
});

router.post('/', async (req, res) => {
    const node = new Node({
        startingNode: req.body.startingNode,
        nodeStory: req.body.nodeStory
    });

    await node.save()
        .then(savedNode => {
            winston.info(`Node: {${savedNode.id}} saved to the database.`);
            res.send("Node saved to database!");
        })
        .catch(err => {
            winston.info(`Node: {${savedNode.id}} caugth error during saving: ${err}`);
            res.status(400).send(`Unable to save to database: ${err}`);
        });
});

router.delete('/:nodeId', async (req, res) => {
    const nodeId = new mongoose.Types.ObjectId(req.params.nodeId);


    await Node.findOneAndDelete(
        { _id: nodeId }
    )
    .then(deletedNode => {
        winston.info("Deletion was successful for: ", deletedNode);
        res.status(500).send("Deletion was successful for: ", deletedNode);
    })
    .catch(err => {
        winston.info("Deletion was unsuccessful for: ", err);
        res.status(500).send("Deletion was unsuccessful for: ", err);
    });
});

router.delete('/deleteIsolatedNodes', async (req, res) => {
    const nodes = await Node.find();
    const links = await Link.find();
    const startNode = nodes.find(node => node.startingNode == true);

    if (typeof startNode !== 'undefined') {
        let deletedInstances = [];
        for (const element of getIsolatedNodes(nodes, links, nodes[0])) {
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
        deletedInstances.push(deleteNode(element));
    }

    res.send(deletedInstances);
}); 


router.post('/test', async (req, res) => {
    const node1 = new Node({
        nodeStory: "Node1",
        startingNode: true
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