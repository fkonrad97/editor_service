const mongoose = require('mongoose');
const winston = require('winston');

/**
 * Story schema:
 * - 'title': Title of the Story.
 * - 'nodes': All nodes in the Story.
 * - 'links': All nodes in the Link.
 */
const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    parentCIDs: [
        {
            type: String,
            unique: true    // Does not work on not ID, need to fix
        }
    ],
    nodes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Node'
        }
    ],
    links: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Link'
        }
    ]
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