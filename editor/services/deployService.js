const { DeployedStory } = require('../models/deployedStory');

/**
 * 'finalizeStory' function puts Story, Nodes and Links together into one object
 * @param {Story} story 
 * @param {[Node]} storyNodes 
 * @param {[Link]} storyLinks 
 * @returns 
 */
async function deploy(story, nodes, links) {2
    const deployedStory = new DeployedStory({
        _id: story._id,
        title: story.title,
        parentStories: story.parentStories,
        eventContainer: story.eventContainer,
        nodes: nodes,
        links: links
    });

    await deployedStory.save();

    return deployedStory;
}

exports.deploy = deploy;