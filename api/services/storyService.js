const { retrieveStory } = require('../services/nodeService');

/**
* 
* @param {*} story 
* @returns 
*/
async function fetchParentStory(story) {
    const parentStories = [];
    if (story.parentCIDs !== null) {
        for (const element of story.parentCIDs) {
            parentStories.push(await retrieveStory(element));
        }
    }
    return parentStories;
}

/**
 * 
 * @param {*} story 
 * @param {*} nodes 
 * @param {*} links 
 * @returns 
 */
async function mergeStories(story, nodes, links) {
    const mergeNodes = [];
    const mergeLinks = [];

    const parentStories = await fetchParentStory(story);

    if (parentStories !== []) {
        for (const parentStory of parentStories) {
            mergeNodes.push(parentStory.nodes);
            mergeLinks.push(parentStory.links);
        }
        mergeNodes.push(nodes);
        mergeLinks.push(links);

        const mergedStory = {
            nodes: mergeNodes.flat(),
            links: mergeLinks.flat()
        }
        return mergedStory;
    } else {
        return { nodes, links }
    }
}

exports.mergeStories = mergeStories;
exports.fetchParentStory = fetchParentStory;