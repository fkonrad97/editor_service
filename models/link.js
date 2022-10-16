const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    decisionText: {
        type: String,
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

linkSchema.pre('remove', function(next) {
    this.model('Node').remove({ person: this._id }, next);
});

exports.linkSchema = linkSchema;
exports.Link = Link;