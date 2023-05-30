const mongoose = require('mongoose');
const winston = require('winston');
const { eventSchema } = require('./eventContainer')

/**
 * Story schema:
 * - 'title': Title of the Story.
 */
const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true,
        ref: 'Title'
    },
    parentCIDs: [
        {
            type: String,
            ref: 'CIDs of Parent Stories'
        }
    ],
    eventContainer: [{
        type: eventSchema,
        ref: 'Event Container'
    }]
});

/**
 * 'findOneAndDelete' post hook
 * This one gets called after the 'findOnAndDelete' post hook is called and the Story is actually deleted. 
 * It removes the all nodes and links related to the deleted Story.
 */
storySchema.post('findOneAndDelete', async function(doc) {
    const storyId = doc.id;
    console.log(`StorySchema "findOneAndDelete" has been triggered for delete Links and Nodes from Story: {${storyId}}...`);

    const Node = mongoose.model("Nodes");
    await Node.deleteMany({
        story: storyId
    })
    .then(() => winston.info(`Nodes from Story: ${doc.title}} has been deleted.`))
    .catch(err => winston.info(`Could not remove Nodes from from Story: ${doc.title}: ${err}`));

    const Link = mongoose.model("Links");
    await Link.deleteMany({
        story: storyId
    })
    .then(() => winston.info(`Links from Story: ${doc.title}} has been deleted.`))
    .catch(err => winston.info(`Could not remove Links from from Story: ${doc.title}: ${err}`));
  });

const Story = mongoose.model('Stories', storySchema);

module.exports = {
    storySchema,
    Story
  };