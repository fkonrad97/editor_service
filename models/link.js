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

exports.linkSchema = linkSchema;