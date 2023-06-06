const mongoose = require('mongoose');

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
    storyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Story',
        required: true
    },
    from: { // change the name to source
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Node',
        required: true
    },
    to: {  // change the name to destination
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Node',
        required: true
    }
});

/**
 * 'findOneAndDelete' post hook
 * This one gets called right after the 'findOnAndDelete' is called and executed on a Link. 
 * It removes the events which were owned by the removed link.
 */
linkSchema.post('findOneAndDelete', async function(doc) {
    const linkId = doc.id;
    console.log(`LinkSchema "findOneAndDelete" has been triggered for Link: {${linkId}}...`);

    const Story = mongoose.model("Stories");
    await Story.updateMany({
        _id: doc.story
    }, {
        $pull: {
            eventContainer: { ownerId: linkId }
        }
    })
    .then(() => winston.info(`Events connected to ${linkId} has been deleted.`))
    .catch(err => winston.info(`Could not remove Event connected to ${linkId} : ${err}`));
});

const Link = mongoose.model('Links', linkSchema);

module.exports = {
    linkSchema,
    Link
  };