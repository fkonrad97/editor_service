const mongoose = require('mongoose');
const winston = require('winston');

/**
 * Node schema:
 * - 'startingNode': The starting point of the Story. Only one node can be starting point in each Story. But there must be one.
 * - 'story': The including Story's reference id.
 * - 'nodeStory': The text of the node.
 * - 'inLinks': List of the incoming Links' ids.
 * - 'outLinks': List of the outgoing Links' ids.
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

/**
 * 'findOneAndDelete' post hook
 * This one gets called right after the 'findOnAndDelete' is called and executed on a Node. 
 * It removes the Links which were related the deleted Node.
 */
nodeSchema.post('findOneAndDelete', async function(doc, next) {
    const nodeId = doc.id;
    console.log(`NodeSchema "findOneAndDelete" has been triggered for Node: {${nodeId}}...`);

    const relatedLinks = doc.inLinks.concat(doc.outLinks);

    if (relatedLinks.length > 0) {
        const Link = mongoose.model("Links");
        for (const link of relatedLinks) {
            try {
                await Link.findOneAndDelete(
                    { _id: link }
                );
            } catch(error) {
                winston.info(`Could not remove Node: {${nodeId}} from Link's reference list properties.`, error);
            }
        }
    }

    next();
  });

/**
 * 'findOneAndDelete' post hook
 * This one gets called after the 'findOnAndDelete' post hook is called and executed on related Links. 
 * It removes the deleted Node's id from the including Story.
 */
nodeSchema.post('findOneAndDelete', async function(doc) {
    const nodeId = doc.id;

    const Story = mongoose.model("Stories");
    await Story.updateMany({
        _id: doc.story
    }, {
         $pull: {
            nodes: { $in: [nodeId] }
        }
    })
    .then(() => winston.info(`Node: {${nodeId}} has been deleted from Story's reference lists.`))
    .catch(err => winston.info(`Could not remove Node: {${nodeId}} from Story's reference list properties.`, err));
  });

/**
 * 'save' post hook
 * This one gets called after the node saved to the DB. It adds the new Node's id to the including Story.
 */
nodeSchema.post('save', async function(doc) {
    const nodeId = doc.id;
    console.log(`NodeSchema post middleware "save" has been triggered for Node: {${nodeId}} after it has been saved to the DB...`);

    const Story = mongoose.model("Stories");
    await Story.updateMany({
        _id: doc.story
    }, {
         $push: {
            nodes: nodeId
        }
    })
    .then(() => winston.info(`Node: {${nodeId}} has been add to Story's reference lists.`))
    .catch(err => winston.info(`Could not add Link: {${nodeId}} to Story's reference list.`, err));
});

const Node = mongoose.model('Nodes', nodeSchema);

module.exports = {
    nodeSchema,
    Node
  };