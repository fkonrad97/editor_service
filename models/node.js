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
            ref: 'Link'
        }
    ],
    outLinks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Link'
        }
    ]
});

nodeSchema.pre('findOneAndDelete', async function(next) {
    nodeId = this.getQuery()._id;
    console.log(`NodeSchema "findOneAndDelete" has been triggered for Node: {${nodeId}}...`);

    const Story = mongoose.model("Stories");
    await Story.updateMany({}, {
         $pull: {
            nodes: { $in: [nodeId] }
        }
    })
    .then(() => winston.info(`Node: {${nodeId}} has been deleted from Story's reference lists.`))
    .catch(err => winston.info(`Could not remove Node: {${nodeId}} from Story's reference list properties.`, err));

    next();
  });

const Node = mongoose.model('Nodes', nodeSchema);

exports.nodeSchema = nodeSchema;
module.exports = Node;