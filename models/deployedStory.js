const mongoose = require('mongoose');
const winston = require('winston');

const extendedNodeSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    startingNode: {
        type: Boolean,
        default: false
    },
    nodeStory: {
        type: String,
        required: true
    },
    inLinks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Link'
        }
    ],
    outLinks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Link'
        }
    ]
});

const extendedLinkSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    decisionText: {
        type: String,
        required: true
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Node',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Node',
        required: true
    }
});

/**
 * DeployedStory schema:
 */
const deployedStorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    editStoryID: mongoose.Schema.Types.ObjectId,
    nodes: [extendedNodeSchema],
    links: [extendedLinkSchema]
});

const DeployedStory = mongoose.model('DeployedStories', deployedStorySchema);

/*exports.deployedStorySchema = deployedStorySchema;
module.exports = DeployedStory;*/

module.exports = {
    deployedStorySchema,
    DeployedStory,
  };