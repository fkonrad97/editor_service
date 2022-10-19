const mongoose = require('mongoose');
const winston = require('winston');

const nodeSchema = new mongoose.Schema({
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
            ref: 'inLinks'
        }
    ],
    outLinks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'outLinks'
        }
    ]
});

const Node = mongoose.model('Nodes', nodeSchema);

exports.nodeSchema = nodeSchema;
module.exports = Node;