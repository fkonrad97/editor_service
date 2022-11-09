const mongoose = require('mongoose');
const winston = require('winston');
const { Node }  = require('../models/node');
const { Link } = require('../models/link');  
const Story = require('../models/story');
const { DeployedStory } = require('../models/deployedStory');
const express = require('express');
const router = express.Router();
const { ethers } = require("hardhat");
require("dotenv").config();
const contract = require("../artifacts/contracts/StoryNFT.sol/StoryNFT.json");


router.get('/', async (req, res) => {
    const deployedstories = await DeployedStory.find();
    res.send(deployedstories);
});

router.post('/finalize/:storyId', async (req, res) => {
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

router.get('/deployNFT', async (req, res) => {
    var exec = require('child_process').exec;

    exec(`npx hardhat run scripts/deploy.js --network goerli`,
        function (error, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            res.send(stdout.toString());
        });
});

router.get('/uploadStory/:storyId', async (req, res) => {
    const story = await DeployedStory.findOne({
        _id: req.params.storyId
    });

    const { create } = await import('ipfs-core');
    const node = await create();

    const { cid } = await node.add(JSON.stringify(story));
    console.info("IPFS id: ", cid);

    res.send(cid);
});

router.get('/mint/:cid', async (req, res) => {
    var exec = require('child_process').exec;

    exec(`npx hardhat mint --tokenuri https://ipfs.io/ipfs/${req.params.cid} --network goerli`,
        function (error, stdout, stderr) {
            console.log(stdout);
            console.log(stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            res.send(stdout.toString());
        });
});

module.exports = router; 