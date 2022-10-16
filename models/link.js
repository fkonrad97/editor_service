const mongoose = require('mongoose');
const Node = require('../models/node');

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

linkSchema.pre('findOneAndDelete', async function(next) {
    console.log('trigger when middleware runs' , this.getQuery()["_id"]) ;
    
    const linkId = new mongoose.Types.ObjectId(this.getQuery()["_id"]);
    await Node.updateOne({}, { $pull: { outLinks: { _id: linkId }}});
    next();
});

const Link = mongoose.model('Links', linkSchema);

exports.linkSchema = linkSchema;
module.exports = Link;