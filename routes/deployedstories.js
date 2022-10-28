const mongoose = require('mongoose');
const winston = require('winston');
const { Node }  = require('../models/node');
const { Link } = require('../models/link');  
const Story = require('../models/story');
const { DeployedStory } = require('../models/deployedStory');
const express = require('express');
const router = express.Router();

router.get('/:id', async (req, res) => {
    const deployedstories = await DeployedStory.find();
    res.send(deployedstories);
});

router.post('/deploy/:storyId', async (req, res) => {
    const story = await Story.findOne({
        _id: req.params.storyId
    });

    const storyNodes = await Node.find({
        $in: story.nodes
    });

    const storyLinks = await Link.find({
        $in: story.links
    });

    const deployedStory = new DeployedStory({
        title: story.title,
        editStoryID: story.id
    });

    for(const element of storyNodes) {
        deployedStory.nodes.push({
            id: element.id,
            startingNode: element.startingNode,
            nodeStory: element.nodeStory,
            inLinks: element.inLinks,
            outLinks: element.outLinks
        });
    }

    for(const element of storyLinks) {
        deployedStory.links.push({
            id: element.id,
            decisionText: element.decisionText,
            from: element.from,
            to: element.to
        });
    }

    await deployedStory.save();

    res.send("Save success!");
});

module.exports = router; 