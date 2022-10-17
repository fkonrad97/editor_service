const mongoose = require('mongoose');
const winston = require('winston');

const nodeSchema = new mongoose.Schema({
    startingNode: {
        type: Boolean,
        default: false
    },
    nodeStory: {
        type: String,
        required: true
    },
    inLinks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'inLinks'
        }
    ],
    outLinks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'outLinks'
        }
    ]
});

nodeSchema.pre('findOneAndDelete', async function(next) {
    const nodeId = this.getQuery()._id;
    console.log(`NodeSchema "findOneAndDelete" has been triggered for Node:{${nodeId}}...`);

    const Link = mongoose.model("Links");
    /*const res = await Link.deleteMany({ $or: [{ to: nodeId }, { from: nodeId }]})
        .then(() => winston.info(`Node:{${nodeId}} has been deleted from related Links.`))
        .catch(err => winston.info(`Could not remove Node:{${nodeId}} from related Links.`, err));*/

    const resTo = await Link.deleteMany({ to: nodeId });    // This way works, but have to try the $or solution too
    const resFrom = await Link.deleteMany({ from: nodeId });    
    next();
  });


const Node = mongoose.model('Nodes', nodeSchema);

exports.nodeSchema = nodeSchema;
module.exports = Node;