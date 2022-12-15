const { Node } = require('../models/node');
const { Link } = require('../models/link');  
const { Story } = require('../models/story');
const { mergeStories } = require('../services/storyService');

class CacheStoryService {
    static story = 'undefined';
    static nodes = [];
    static links = [];

    static async cache(_storyId) {
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
    static async refresh() {
        const _storyId = this.story.id;

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

    static addNode(node) {
        this.nodes.push(node);
    }

    static addLink(link) {
        this.links.push(link);
    }

    static removeLink(removableLinkId) {
        this.links.splice(
            this.links.find(link => link._id == removableLinkId),
            1
        );
    }

    static removeNode(removableNodeId) {
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

    static isEmpty() {
        if (this.story === 'undefined')
            return true;
        return false;
    }

    static clear() {
        this.story = 'undefined';
        this.nodes = [];
        this.links = [];
    }
}

//const StoryCache = new CachedStory();
module.exports = CacheStoryService;
// module.exports = StoryCache;