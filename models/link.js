const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    decisionText: {
        type: String,
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true
    }
});

const Link = mongoose.model('Links', linkSchema);

exports.linkSchema = linkSchema;
exports.Link = Link;