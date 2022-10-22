const mongoose = require('mongoose');
const winston = require('winston');

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

/**
 * findOneAndDelete pres
 */
linkSchema.pre('findOneAndDelete', async function(next) {
    const linkId = this.getQuery()._id;
    console.log(`LinkSchema "findOneAndDelete" has been triggered for Link: {${linkId}}...`);

    const Node = mongoose.model("Nodes");
    await Node.updateMany({}, {
         $pull: {
            inLinks: { $in: [linkId] },
            outLinks: { $in: [linkId] }
        }
    })
    .then(() => winston.info(`Link: {${linkId}} has been deleted from Node's reference lists.`))
    .catch(err => winston.info(`Could not remove Link: {${linkId}} from Node's reference list properties.`, err));

    next();
  });

linkSchema.pre('findOneAndDelete', async function(next) {
    const linkId = this.getQuery()._id;
    console.log(`LinkSchema "findOneAndDelete" has been triggered for Link: {${linkId}}...`);

    const Story = mongoose.model("Stories");
    await Story.updateMany({}, {
         $pull: {
            links: { $in: [linkId] }
        }
    })
    .then(() => winston.info(`Link: {${linkId}} has been deleted from Story's reference lists.`))
    .catch(err => winston.info(`Could not remove Link: {${linkId}} from Story's reference list properties.`, err));

    next();
  });

/**
 * SAVE posts
 */
linkSchema.post('save', async function(doc ,next) {
    const linkId = doc.id;
    console.log(`LinkSchema post middleware "save" has been triggered for Link: {${linkId}} after it has been saved to the DB...`);

    const Node = mongoose.model("Nodes");

    await Node.updateOne(
        { _id: doc.from }, 
        { $push: { outLinks: linkId } }
    )
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

linkSchema.post('save', async function(doc) {
    const linkId = doc.id;

    const Story = mongoose.model("Stories");
    await Story.updateMany({}, {
         $push: {
            links: linkId
        }
    })
    .then(() => winston.info(`Link: {${linkId}} has been added to Story's reference lists.`))
    .catch(err => winston.info(`Could not add Link: {${linkId}} to Story's reference list.`, err));
});

/**
 * update posts
 */

const Link = mongoose.model('Links', linkSchema);

exports.linkSchema = linkSchema;
module.exports = Link;