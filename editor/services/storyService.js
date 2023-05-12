const { retrieveStory } = require('../services/nodeService');

/**
* 
* @param {*} story 
* @returns 
*/
async function fetchParentStory(story) {
    const parentStories = [];
    if (story.parentCIDs.length != 0) {
        for (const element of story.parentCIDs) {
            parentStories.push(await retrieveStory(element));
        }
    }
    return parentStories;
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
            mergeStories.push(parentStory.id);  // Is it working???
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

exports.mergeStories = mergeStories;
exports.fetchParentStory = fetchParentStory;