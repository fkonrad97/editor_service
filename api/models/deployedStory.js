const mongoose = require('mongoose');

/**
 * DeployedStory schema:
 */
const deployedStorySchema = new mongoose.Schema({
    _id: {
        type: String
    },
    cid: {
        type: String,
        unique: true,
        required: true
    }
}, { _id: false });

const DeployedStory = mongoose.model('DeployedStories', deployedStorySchema);

module.exports = {
    deployedStorySchema,
    DeployedStory,
  };