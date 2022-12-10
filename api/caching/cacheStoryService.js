const { retrieveStory } = require('../services/nodeService');
const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 

/**
 * 
 * @param {*} story 
 * @returns 
 */
async function fetchParentStory(story) {
    parentStories = [];
    if (story.parentCIDs !== null) {
        for(const element of story.parentCIDs) {
            parentStories.push(await retrieveStory(element));
        }
    }
    return parentStories;
}

/**
 * 
 * @param {*} nodes 
 * @param {*} links 
 * @param {*} parentStories 
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



class CachedStory {
    constructor(_story = 'undefined', _nodes = [], _links = []) {
        this.story = _story;
        this.nodes = _nodes;
        this.links = _links;
    }

    async setStory(_storyId) {
        const tmpStory = await Story.findOne({
            id: _storyId
        });

        const tmpNodes = await Node.find({
            story: tmpStory.id
        });

        const tmpLinks = await Link.find({
            story: tmpStory.id
        });

        const mergedStory = await mergeStories(tmpStory, tmpNodes, tmpLinks);

        this.story = tmpStory;
        this.nodes = mergedStory.nodes;
        this.links = mergedStory.links;
    }

    // Refresh the already selected Story
    // Use it when the whole, already loaded cached story needs to be updated.
    async refresh() {
        const storyId = this.story.id;

        this.clear();

        const tmpStory = await Story.findOne({
            id: _storyId
        });

        const tmpNodes = await Node.find({
            story: tmpStory.id
        });

        const tmpLinks = await Link.find({
            story: tmpStory.id
        });

        const mergedStory = mergeStories(tmpStory, tmpNodes, tmpLinks);

        this.story = tmpStory;
        this.nodes = mergedStory.nodes;
        this.links = mergedStory.links;
    }

    addNode(node) {
        this.nodes.push(node);
    }

    addLink(link) {
        this.links.push(link);
    }

    removeLink(removableLinkId) {
        this.links.splice(
            this.links.find(link => link._id == removableLinkId),
            1
        );
    }

    removeNode(removableNodeId) {
        this.nodes.splice(
            this.nodes.find(node => node._id == removableNodeId),
            1
        );

        // Delete related links from cache
        this.links.splice(
            this.links.find(link => link.to == removableNodeId),
            1
        );

        this.links.splice(
            this.links.find(link => link.from == removableNodeId),
            1
        );
    }

    isEmpty() {
        if (typeof this.story === 'undefined')
            return true;
        return false;
    }

    clear() {
        this.story = 'undefined';
        this.nodes = [];
        this.links = [];
    }
}

const StoryCache = new CachedStory();
module.exports = StoryCache;