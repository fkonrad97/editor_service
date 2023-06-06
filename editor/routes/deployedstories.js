const { Node }  = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story');
const { DeployedStory } = require('../models/deployedStory');
const { deploy } = require('../services/deployService')
const express = require('express');
const router = express.Router();
require("dotenv").config();

/**
 * Gets all DeployedStory from MongoDB
 */
router.get('/', async (req, res) => {
    const deployedstories = await DeployedStory.find();
    res.send(deployedstories);
});

router.post('/deploy', async (req, res) => {
    const _storyId = req.body.storyId;

    const story = await Story.findOne({ id: _storyId });
    const nodes = await Node.find({ story: _storyId });
    const links = await Link.find({ story: _storyId });

    const deployedStory = await deploy(story, nodes, links);

    // Delete the story and its parts from the other tables than Deployed Stories
    // ...

    res.status(200).send(deployedStory);
});

module.exports = router; 