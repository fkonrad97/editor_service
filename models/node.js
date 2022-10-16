const mongoose = require('mongoose');

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

const Node = mongoose.model('Nodes', nodeSchema);

exports.nodeSchema = nodeSchema;
module.exports = Node;

/*const Node = mongoose.model('Nodes', new mongoose.Schema({
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
}));*/