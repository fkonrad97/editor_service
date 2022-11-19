const mongoose = require('mongoose');
const winston = require('winston');

/**
 * Node schema:
 * - 'startingNode': The starting point of the Story. Only one node can be starting point in each Story. But there must be one.
 * - 'story': The including Story's reference id.
 * - 'nodeStory': The text of the node.
 */
const nodeSchema = new mongoose.Schema({
    startingNode: {
        type: Boolean,
        default: false
    },
    story: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: true
    },
    nodeStory: {
        type: String,
        required: true
    }
});

/**
 * 'findOneAndDelete' post hook
 * This one gets called right after the 'findOnAndDelete' is called and executed on a Node. 
 * It removes the Links which were related the deleted Node.
 */
nodeSchema.post('findOneAndDelete', async function(doc) {
    const nodeId = doc.id;
    console.log(`NodeSchema "findOneAndDelete" has been triggered for Node: {${nodeId}}...`);

    const Link = mongoose.model("Links");
    await Link.deleteMany({
        $or: [
            { from: nodeId },
            { to: nodeId }
        ]
    })
    .then(() => winston.info(`Links with ${nodeId} has been deleted.`))
    .catch(err => winston.info(`Could not remove Link with ${nodeId} : ${err}`));
});

const Node = mongoose.model('Nodes', nodeSchema);

module.exports = {
    nodeSchema,
    Node
  };