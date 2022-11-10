const mongoose = require('mongoose');

/**
 * DeployedStory schema: After the Story uploaded to IPFS, 
 * then the mongoDB database will store the Story's id and the CID from IPFS.
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