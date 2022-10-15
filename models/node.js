const mongoose = require('mongoose');
const { linkSchema } = require('./link');

const Node = mongoose.model('Nodes', new mongoose.Schema({
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
            ref: "Node"
        }
    ],
    outLinks: [ linkSchema ]
}));

exports.Node = Node;