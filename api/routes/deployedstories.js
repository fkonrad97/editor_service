const { Node }  = require('../models/node');
const { Link } = require('../models/link');  
const Story = require('../models/story');
const { DeployedStory } = require('../models/deployedStory');
const { finalizeStory } = require('../services/deployService')
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

/**
 * Puts together the parts of the Story and uploads it to IPFS and removes all parts from MongoDB
 */
router.post('/toIPFS/:storyId', async (req, res) => {
    const { create } = await import('ipfs-core');

    const story = await Story.findOne({
        _id: req.params.storyId
    });

    const storyNodes = await Node.find({
        $in: story.nodes
    });

    const storyLinks = await Link.find({
        $in: story.links
    });

    const finalizedStory = finalizeStory(story, storyNodes, storyLinks);
    const finalizedStoryJSON = JSON.stringify(finalizedStory);

    const node = await create({repo: 'ok' + Math.random()});

    const { cid } = await node.add(finalizedStoryJSON);
    console.info("IPFS id: ", cid);

    await Story.findByIdAndDelete(story.id);

    const deployedStory = new DeployedStory({
        _id: finalizedStory.storyId,
        cid: cid
    });

    await deployedStory.save();

    res.send(deployedStory);
});

/**
 * Mints an NFT with the Story's tokenURI
 */
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

/**
 * Deploys the smart contract
 */
router.get('/deployNFT', async (req, res) => {
    var exec = require('child_process').exec;

    exec(`npx hardhat deploy --network goerli`,
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