const mongoose = require('mongoose');
const winston = require('winston');

const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
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

const Story = mongoose.model('Stories', storySchema);

function currentStorySelector() {
    let currentStory = {
        story: new Story({
            title: "Dummy"
        })
    };

    Object.defineProperty(currentStory, 'getCurrentStory', {
        get: function () {
            return this.story;
        }
    });
    
    Object.defineProperty(currentStory, 'changeCurrentStory', {
        set : function (story) {
            console.log(story);
            this.story = story;
        }
    });
}

exports.currentStorySelector = currentStorySelector;
exports.storySchema = storySchema;
module.exports = Story;