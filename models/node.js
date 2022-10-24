const mongoose = require('mongoose');
const winston = require('winston');

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
 * findOneAndDelete
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
 * SAVE
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

exports.nodeSchema = nodeSchema;
module.exports = Node;