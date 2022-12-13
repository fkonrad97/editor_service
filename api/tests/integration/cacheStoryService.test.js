const request = require('supertest');
const { Story } = require('../../models/story');
const { Node } = require('../../models/node');
const { Link } = require('../../models/link'); 
const { clearDB, initGraph } = require('../testService');
const StoryCache = require('../../caching/cacheStoryService');

let server;

describe('story cache service testing', () => {
    beforeEach(() => { 
       server = require('../../../index');
       StoryCache.clear();
    });

    afterEach(async () => { 
        server.close();
        await clearDB();
    });
        
    it('should cache the given story', async () => {
        const testGraph = await initGraph();

        await StoryCache.setStory(testGraph.story.id);

        expect(StoryCache.nodes.length).toBe(7);
        expect(StoryCache.links.length).toBe(7);        
    });

    it('should update nodes in the cache', async () => {
        const testGraph = await initGraph();

        await StoryCache.setStory(testGraph.story.id);

        StoryCache.addNode(new Node({
            story: testGraph.story.id,
            nodeStory: "MockNode"
        }));

        expect(StoryCache.nodes.length).toBe(8);   
    });

    it('should update links in the cache', async () => {
        const testGraph = await initGraph();

        await StoryCache.setStory(testGraph.story.id);

        StoryCache.addLink(new Link({
            story: testGraph.story.id,
            decisionText: "MockNode",
            from: testGraph.nodes[0].id,
            to: testGraph.nodes[1].id
        }));

        expect(StoryCache.links.length).toBe(8);   
    });

    it('should remove nodes from the cache and related links', async () => {
        const testGraph = await initGraph();

        await StoryCache.setStory(testGraph.story.id);

        StoryCache.removeNode(testGraph.nodes[0]);

        expect(StoryCache.nodes.length).toBe(6); 
        expect(StoryCache.links.length).toBe(5);   
    });

    it('should remove links from the cache', async () => {
        const testGraph = await initGraph();

        await StoryCache.setStory(testGraph.story.id);

        StoryCache.removeLink(testGraph.links[0]);

        expect(StoryCache.links.length).toBe(6);   
    });

    it('should clear the cache', async () => {
        const testGraph = await initGraph();

        await StoryCache.setStory(testGraph.story.id);

        StoryCache.clear();

        expect(StoryCache.story).toBe('undefined');
        expect(StoryCache.nodes.length).toBe(0);
        expect(StoryCache.links.length).toBe(0);
    });    

    it('should return true if the cache is empty, false when it is not', async () => {
        const testGraph = await initGraph();

        StoryCache.clear();

        expect(StoryCache.isEmpty()).toBe(true);

        await StoryCache.setStory(testGraph.story.id);

        expect(StoryCache.isEmpty()).toBe(false);
    });

});