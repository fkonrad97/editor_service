const mongoose = require('mongoose');
const winston = require('winston');

const linkSchema = new mongoose.Schema({
    decisionText: {
        type: String,
        required: true
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'fromNode',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'toNode',
        required: true
    }
});

linkSchema.pre('findOneAndDelete', async function(next) {
    linkId = this.getQuery()._id;
    console.log(`LinkSchema "findOneAndDelete" has been triggered for Link:{${linkId}}...`);

    const Node = mongoose.model("Nodes");
    const res = await Node.updateMany({}, {
         $pull: {
            inLinks: { $in: [linkId] },
            outLinks: { $in: [linkId] }
        }
    })
    .then(() => winston.info(`Link:{${linkId}} has been deleted from Node's reference lists.`))
    .catch(err => winston.info(`Could not remove Link:{${linkId}} from Node's reference list properties.`, err));

    next();
  });

const Link = mongoose.model('Links', linkSchema);

exports.linkSchema = linkSchema;
module.exports = Link;