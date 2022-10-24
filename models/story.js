const mongoose = require('mongoose');
const winston = require('winston');

const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    nodes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Node'
        }
    ],
    links: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Link'
        }
    ]
});

const Story = mongoose.model('Stories', storySchema);

exports.storySchema = storySchema;
module.exports = Story;