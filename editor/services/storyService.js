const { DeployedStory } = require('../models/deployedStory');
const { Story } = require('../models/story'); 
const { Node } = require('../models/node'); 
const { Link } = require('../models/link'); 

/**
* @param {*} story 
* @returns 
*/
async function fetchParentStory(story) {
    const parentStoryIds = story.parentStories;
    
    if (parentStoryIds.length != 0) {
        const parentStories = DeployedStory.find({
            $in: parentStoryIds
        });
        
        return parentStories;
    }

    return [];
}

/**
 * @param {*} story 
 * @param {*} nodes 
 * @param {*} links 
 * @returns 
 */
async function mergeStories(story, nodes, links) {
    const mergeNodes = [];
    const mergeLinks = [];
    const mergeStories = [];

    const parentStories = await fetchParentStory(story);

    if (parentStories.length != 0) {
        for (const parentStory of parentStories) {
            mergeStories.push(parentStory);
            mergeNodes.push(parentStory.nodes);
            mergeLinks.push(parentStory.links);
        }
        mergeStories.push(story);
        mergeNodes.push(nodes);
        mergeLinks.push(links);

        const mergedStory = {
            stories: mergeStories.flat(),
            nodes: mergeNodes.flat(),
            links: mergeLinks.flat()
        }
        return mergedStory;
    } else {
        return { stories: [story], nodes, links }
    }
}

/**
 * 
 */
async function loadStory(storyId) {
    const tmpStory = await Story.findOne({ _id: storyId });
    const tmpNodes = await Node.find({ storyId: storyId });
    const tmpLinks = await Link.find({ storyId: storyId });

    const { stories, nodes, links } = await mergeStories(tmpStory, tmpNodes, tmpLinks);

    return { stories, nodes, links }
}

exports.mergeStories = mergeStories;
exports.fetchParentStory = fetchParentStory;
exports.loadStory = loadStory;