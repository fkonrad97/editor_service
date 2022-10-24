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

/**
 * 'findOneAndDelete' post hook
 * This one gets called right after the 'findOnAndDelete' is called and executed on a Link. It removes the Link's reference from all the related Nodes.
 */
linkSchema.post('findOneAndDelete', async function(doc, next) {
    const linkId = doc.id;
    console.log(`LinkSchema "findOneAndDelete" has been triggered for delete Link: {${linkId}} from Nodes...`);

    const Node = mongoose.model("Nodes");
    await Node.updateMany({
        story: doc.story
    }, {
         $pull: {
            inLinks: { $in: [linkId] },
            outLinks: { $in: [linkId] }
        }
    })
    .then(() => winston.info(`Link: {${linkId}} has been deleted from Node's reference lists.`))
    .catch(err => winston.info(`Could not remove Link: {${linkId}} from Node's reference list properties.`, err));

    next();
  });

/**
 * 'findOneAndDelete' post hook
 * This one gets called after the 'findOnAndDelete' post hook is called and executed on related Nodes. It removes the deleted Link's id from the including Story.
 */
linkSchema.post('findOneAndDelete', async function(doc) {
    const linkId = doc.id;
    console.log(`LinkSchema "findOneAndDelete" has been triggered for delete Link: {${linkId}} from Story...`);

    const Story = mongoose.model("Stories");
    await Story.updateMany({
        _id: doc.story
    }, {
         $pull: {
            links: { $in: [linkId] }
        }
    })
    .then(() => winston.info(`Link: {${linkId}} has been deleted from Story's reference lists.`))
    .catch(err => winston.info(`Could not remove Link: {${linkId}} from Story's reference list properties.`, err));
  });

/**
 * 'save' post hook
 * This one gets called after the link saved to the DB and it adds the new Link's id to the related Nodes.
 */
linkSchema.post('save', async function(doc ,next) {
    const linkId = doc.id;
    console.log(`LinkSchema post middleware "save" has been triggered for save Link: {${linkId}} to related Nodes and Story reference lists after it has been saved to the DB...`);

    const Node = mongoose.model("Nodes");

    await Node.updateOne({ 
        _id: doc.from 
    }, { 
        $push: { outLinks: linkId } 
    })
    .then(() => {
        Node.updateOne(
            { _id: doc.to }, 
            { $push: { inLinks: linkId } }
        )
        .then(() => winston.info(`Link: {${linkId}} has been added to fromNode: {${doc.from}} and to toNode: {${doc.to}} reference lists.`))
        .catch(err => winston.info(`Could not add Link: {${linkId}} to toNode: {${doc.to}} reference list.`, err));
    })
    .catch(err => winston.info(`Could not add Link: {${linkId}} to fromNode: {${doc.from}} reference list.`, err));

    next();
});

/**
 * 'save' post hook
 * This one gets called after the first post hook. It adds the new Link's id to the including Story.
 */
linkSchema.post('save', async function(doc) {
    const linkId = doc.id;

    const Story = mongoose.model("Stories");
    await Story.updateMany({
        _id: doc.story
    }, {
         $push: {
            links: linkId
        }
    })
    .then(() => winston.info(`Link: {${linkId}} has been added to Story's reference lists.`))
    .catch(err => winston.info(`Could not add Link: {${linkId}} to Story's reference list.`, err));
});

const Link = mongoose.model('Links', linkSchema);

exports.linkSchema = linkSchema;
module.exports = Link;