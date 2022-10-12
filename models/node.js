const mongoose = require('mongoose');
const linkSchema = require('./link');

const Node = mongoose.model('Nodes', new mongoose.Schema({
    nodeStory: {
        type: String,
        required: true
    },
    from: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Node"
        }
    ],
    to: [ linkSchema ]
}));

exports.Node = Node;