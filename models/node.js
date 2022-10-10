const mongoose = require('mongoose');

const Node = mongoose.model('Nodes', new mongoose.Schema({
    nodeStory: String,
    from: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Node"
        }
    ],
    to: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Node"
        }
    ]
}));

module.exports = Node;