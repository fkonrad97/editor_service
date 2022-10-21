const mongoose = require('mongoose');
const winston = require('winston');
const Node = require('../models/node');
const Link = require('../models/link');  
const Story = require('../models/story'); 
const express = require('express');
const c = require('config');
const router = express.Router();

let currentStory = null;    // figure it out how to do it

router.get('/selectStory', async (req, res) => {
    currentStory = await Story.findOne({ title: req.body.title });

    console.log(currentStory);
    if (currentStory !== null) {
        res.send(`Selected Story: ${currentStory.title}`);
    } else {
        res.status(404).send(`${req.body.title} can not be found!`);
    }
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
    if (currentStory === null) return res.status(404).send('Story has not been selected!');

    const node = new Node({
        startingNode: req.body.startingNode,
        nodeStory: req.body.nodeStory
    });

    node.save(function (err) {
        if (err) {
            winston.info(`Node: {${node.id}} caugth error during saving: ${err}`);
            res.status(400).send(`Unable to save to database: ${err}`);
        }
    });

    currentStory.nodes.push(node);
    await currentStory.save(function (err) {
        if (err) {
            winston.info(`Node: {${node.id}} caugth error during saving to the Story {${currentStory.title}}: ${err}`);
            res.status(400).send(`Unable to save to database: ${err}`);
        } else {
            winston.info(`Node: {${node.id}} saved to Story {${currentStory.title}}`);
            res.send(`Node saved to Story {${currentStory.title}}!`);
        }
    });
});

module.exports = router; 