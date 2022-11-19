const mongoose = require('mongoose');
const winston = require('winston');

/**
 * Link schema:
 * - 'decisionText': The text of the decision(link).
 * - 'story': The including Story's reference id.
 * - 'from': From which node the Link coming from.
 * - 'to': To which node is the Link going. 
 */
const linkSchema = new mongoose.Schema({
    decisionText: {
        type: String,
        required: true
    },
    story: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
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

const Link = mongoose.model('Links', linkSchema);

module.exports = {
    linkSchema,
    Link
  };