const { retrieveStory } = require('../services/nodeService');
const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story'); 

/**
 * 
 * @param {*} _story 
 * @param {*} _nodes 
 * @param {*} _links 
 * @returns 
 */
async function cacheStory(_story, _nodes, _links) {
    const parentStories = await fetchParentStory(_story);
    const mergedStory = mergeStories(_nodes, _links, parentStories);
    return {
        story: _story,
        nodes: mergedStory.nodes,
        links: mergedStory.links
    };
}

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
function mergeStories(nodes, links, parentStories) {
    const mergeNodes = [];
    const mergeLinks = [];

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



function CachedStory () {
    let cachedStory = Object.create(CachedStory.prototype);

    Object.defineProperties(this, {
        "story": {
          get: function() {
                return this.story;
          },
          set: function(_story) {
                this.story = _story;
          }
        },
        "nodes": {
          get: function() {
                return this.nodes;
          },
          set: function(_nodes) {
                this.nodes = _nodes;
          }
        },
        "links": {
           get: function() {
                return this.links;
           },
           set: function(_links) {
                this.links = _links;
           }
        }
    });

    return cachedStory;
}

CachedStory.prototype.construct = async function(_storyId) {
    const tmpStory = await Story.findOne({
        id: _storyId
    });
    
    const tmpNodes = await Node.find({
        story: tmpStory.id
    });
    
    const tmpLinks = await Link.find({
        story: tmpStory.id
    });

    const parentStories = await fetchParentStory(tmpStory);
    const mergedStory = mergeStories(tmpNodes, tmpLinks, parentStories);

    this.story = mergedStory.story;
    this.nodes = mergedStory.nodes;
    this.links = mergedStory.links;
}

CachedStory.prototype.addNode = function(node) {
    this.nodes.push(node);
}

CachedStory.prototype.addLink = function(link) {
    this.links.push(link);
}

CachedStory.prototype.removeLink = function(removableLinkId) {
    this.links.splice(
        this.links.find(link => link._id == removableLinkId),
        1
    );
}

CachedStory.prototype.removeNode = function(removableNodeId) {
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

exports.CachedStory = CachedStory;
exports.fetchParentStory = fetchParentStory;
exports.cacheStory = cacheStory;

