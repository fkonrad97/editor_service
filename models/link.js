const mongoose = require('mongoose');

const Link = mongoose.model('Links', new mongoose.Schema({
    decisionText: String,
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node"
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node"
    }
}));

module.exports = Node;