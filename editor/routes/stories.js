const express = require('express');
const router = express.Router();

const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 
const { DeployedStory } = require('../models/deployedStory');

const { getUnreachableNodes, getDependentBranch } = require('../services/nodeService');
const CacheStoryService = require('../caching/cacheStoryService');

const mqChannel = require('../startup/msgbroker')
const mqConnection = require('../startup/msgbroker')

/**
 * 
 */
async function sendData(data) {
    // send data to queue
    await mqChannel.sendToQueue("test-queue", Buffer.from(JSON.stringify(data)));
        
    // close the channel and connection
    await mqChannel.close();
    await mqConnection.close(); 
}

/**
 * 
 */
router.get("/sendStory", (req, res) => {
    if (!CacheStoryService.isEmpty()) CacheStoryService.clear();

    sendData(CacheStoryService.toString);  // pass the data to the function we defined
    console.log("A message is sent to queue")
    res.send("Message Sent"); //response to the API request
})

/**
 * To select and cache the current story.
 */
router.get('/selectStory', async (req, res) => {
    if (!CacheStoryService.isEmpty()) CacheStoryService.clear();

    await CacheStoryService.cache(req.body.storyId);
    
    res.status(200).send("Story has been loaded to cache!");
});

/**
 * Get all Story documents from DB.
 */
router.get('/', async (req, res) => {
    const stories = await Story.find({});
    res.status(200).send(stories);
});

/**
 * To create a new story.
 */
router.post('/createStory', async (req, res) => {
    const story = new Story({
        title: req.body.title
    })

    await story.save();

    res.status(200).send(story);
});

/**
 * To create a new node.
 * 'Node.save' has post middleware.
 */
router.post('/addNode', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const node = new Node({
        startingNode: req.body.startingNode,
        story: CacheStoryService.story._id,
        nodeStory: req.body.nodeStory
    });

    await node.save();

    // Update cache 'CacheStoryService'
    CacheStoryService.addNode(node);

    res.status(200).send(node);
});

/**
 * To create a new link.
 */
router.post('/addLink', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const fromNode = CacheStoryService.nodes.find(node => node._id == req.body.from);
    const toNode = CacheStoryService.nodes.find(node => node._id == req.body.to);

    const link = new Link({
        decisionText: req.body.decisionText,
        story: CacheStoryService.story._id,
        from: fromNode,
        to: toNode
    });

    await link.save();

    // Update cache 'CacheStoryService'
    CacheStoryService.addLink(link);

    res.status(200).send(link);
});

/**
 * Add parent stories to the current story.
 */
 router.put('/addParentStory', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.body.storyId
    });

    const updateResult = await Story.findOneAndUpdate({
        _id: CacheStoryService.story._id
    }, {
        $push: {
            parentCIDs: story.cid
        }
    });

    // Update cache 'CacheStoryService'
    CacheStoryService.refresh();

    res.status(200).send(updateResult);
});

/**
 * To update the selected link's 'to' property.
 */
router.put('/updateLinkToNode', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        to: req.body.toNodeId
    });

    // Update cache 'CacheStoryService'
    CacheStoryService.links.find(link => link._id == req.body.linkId).to = req.body.toNodeId;

    res.status(200).send(updateResult);
});

/**
 * To update the selected link's 'from' property.
 */
router.put('/updateLinkFromNode', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const updateResult = await Link.updateOne({
        _id: req.body.linkId
    }, {
        from: req.body.fromNodeId
    });

    // Update cache 'CacheStoryService'
    CacheStoryService.links.find(link => link._id == req.body.linkId).from = req.body.fromNodeId;

    res.status(200).send(updateResult);
});

/**
 * To update the selected node's text.
 */
router.put('/updateNodeStory', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const updateResult = await Node.updateOne({
        _id: req.body.nodeId
    }, {
        nodeStory: req.body.text
    });

    // Update cache 'CacheStoryService'
    CacheStoryService.nodes.find(node => node._id == req.body.nodeId).nodeStory = req.body.text;

    res.status(200).send(updateResult);
});

/**
 * Delete parent stories to the current story.
 */
 router.put('/deleteParentStory', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const story = await DeployedStory.findOne({
        _id: req.body.storyId
    });

    const deletion = await Story.updateOne({
        _id: CacheStoryService.story._id 
    }, {
        $pull: {
            parentCIDs: story.cid
        }
    });

    // Update cache 'CacheStoryService'
    CacheStoryService.refresh();
    
    res.status(200).send(deletion);
});

/**
 * To delete selected Story.
 * 'Story.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteStory', async (req, res) => {
    const deletedInstance = await Story.findOneAndDelete(
        { _id: req.body.storyId }
    );

    res.status(200).send(deletedInstance);
});

/**
 * To delete selected node.
 * 'Node.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteNode', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');   

    const deletedInstance = await Node.findOneAndDelete(
        { _id: req.body.nodeId }
    );

    // Update cache 'CacheStoryService'
    CacheStoryService.removeNode(req.body.nodeId);

    res.status(200).send(deletedInstance);
});

/**
 * To delete selected link.
 * 'Link.findOneAndDelete' uses post middlewares.
 */
router.delete('/deleteLink', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!');

    const deletedInstance = await Link.findOneAndDelete(
        { _id: req.body.linkId }
    );

    // Update cache 'CacheStoryService'
    CacheStoryService.removeLink(req.body.linkId);

    res.status(200).send(deletedInstance);
});

/**
 * To delete all nodes which are isolated from the main storyline.
 */
router.delete('/deleteIsolatedNodes', async (req, res) => {
    if (CacheStoryService.isEmpty()) return res.status(404).send('Story has not been selected!'); 

    const startNode = CacheStoryService.nodes.find(node => node.startingNode == true);

    if (typeof startNode !== 'undefined') {
        const isolatedNodesIds = getUnreachableNodes(CacheStoryService.nodes, startNode, CacheStoryService.links).map(element => element.id);

        const deletedInstances = await Node.deleteMany({
            _id: {
                $in: isolatedNodesIds
            }
        });

        isolatedNodesIds.forEach(deletedNodeId => CacheStoryService.removeNode(deletedNodeId));

        res.status(200).send(deletedInstances);
    } else {
        res.status(404).send("StartNode not defined!");
    }
});

/**
 * To delete all nodes and links which are depend on the 'startNode' argument.
 * 'findOneAndDelete' is justified, because of the post-hook which deletes the related links
 */
router.delete('/deleteDependencyTree', async (req, res) => {
    if (CacheStoryService === null) return res.status(404).send('Story has not been selected!');

    const startNode = CacheStoryService.nodes.find(node => node._id == req.body.startNodeId);

    const dependentNodes = getDependentBranch(CacheStoryService.nodes, CacheStoryService.links, startNode);

    let deletedInstances = [];
    for (const element of dependentNodes) {
        deletedInstances.push(await Node.findOneAndDelete( 
            { _id: element.id }
        ));
    }

    // Update cache 'CacheStoryService'
    deletedInstances.map(instance => instance.id).forEach(id => CacheStoryService.removeNode(id));

    res.status(200).send(deletedInstances);
});

module.exports = router; 