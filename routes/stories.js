const mongoose = require('mongoose');
const winston = require('winston');
const Node = require('../models/node');
const Link = require('../models/link');  
const Story = require('../models/story'); 
const express = require('express');
const router = express.Router();

let currentStory = {};    // figure it out how to do it

router.get('/selectStory', async (req, res) => {
    const tmpStory = await Story.find({
        title: req.body.title
    });

    // ....
});

router.get('/', async (req, res) => {
    const stories = await Story.find();
    res.send(stories);
});

router.post('/createStory/:title', async (req, res) => {
    const story = new Story({
        title: req.params.title
    })

    story.save(function(err,result){
        if (err){
            winston.info(`Story: {${story.id}} caugth error during saving: ${err}`);
            res.status(400).send(`Unable to save to database: ${err}`);
        }
        else {
            winston.info(`Story: {${result.id}} saved to the database.`);
            res.send("Story saved to database!");
        }
    });
});

router.post('/addNode', async (req, res) => {
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

module.exports = router; 