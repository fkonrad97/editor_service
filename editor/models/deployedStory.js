const mongoose = require('mongoose');
const { eventSchema } = require('./eventContainer')
const { nodeSchema } = require('./node');
const { linkSchema } = require('./link');

/**
 * DeployedStory schema
 */
const deployedStorySchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story ID'
    },
    title: {
        type: String,
        required: true,
        unique: true,
        ref: 'Title'
    },
    parentStories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            unique: true,
            ref: 'Parent Stories'
        }
    ],
    eventContainer: [{
        type: eventSchema,
        ref: 'Event Container'
    }],
    nodes: [{ type: nodeSchema }],
    links: [{ type: linkSchema }]
}, { _id: false });

const DeployedStory = mongoose.model('DeployedStories', deployedStorySchema);

module.exports = {
    deployedStorySchema,
    DeployedStory
  };