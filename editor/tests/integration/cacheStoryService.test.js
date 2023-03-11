const request = require('supertest');
const { Story } = require('../../models/story');
const { Node } = require('../../models/node');
const { Link } = require('../../models/link'); 
const { clearDB, initGraph } = require('../testService');
const CacheStoryService = require('../../caching/cacheStoryService');

let server;

describe('story cache service testing', () => {
    beforeEach(() => { 
       server = require('../../../index');
       CacheStoryService.clear();
    });

    afterEach(async () => { 
        server.close();
        await clearDB();
    });
        
    it('should cache the given story', async () => {
        const testGraph = await initGraph();

        await CacheStoryService.cache(testGraph.story.id);

        expect(CacheStoryService.nodes.length).toBe(7);
        expect(CacheStoryService.links.length).toBe(7);        
    });

    it('should update nodes in the cache', async () => {
        const testGraph = await initGraph();

        await CacheStoryService.cache(testGraph.story.id);

        CacheStoryService.addNode(new Node({
            story: testGraph.story.id,
            nodeStory: "MockNode"
        }));

        expect(CacheStoryService.nodes.length).toBe(8);   
    });

    it('should update links in the cache', async () => {
        const testGraph = await initGraph();

        await CacheStoryService.cache(testGraph.story.id);

        CacheStoryService.addLink(new Link({
            story: testGraph.story.id,
            decisionText: "MockNode",
            from: testGraph.nodes[0].id,
            to: testGraph.nodes[1].id
        }));

        expect(CacheStoryService.links.length).toBe(8);   
    });

    it('should remove nodes from the cache and related links', async () => {
        const testGraph = await initGraph();

        await CacheStoryService.cache(testGraph.story.id);

        CacheStoryService.removeNode(testGraph.nodes[0]);

        expect(CacheStoryService.nodes.length).toBe(6); 
        expect(CacheStoryService.links.length).toBe(5);   
    });

    it('should remove links from the cache', async () => {
        const testGraph = await initGraph();

        await CacheStoryService.cache(testGraph.story.id);

        CacheStoryService.removeLink(testGraph.links[0]);

        expect(CacheStoryService.links.length).toBe(6);   
    });

    it('should clear the cache', async () => {
        const testGraph = await initGraph();

        await CacheStoryService.cache(testGraph.story.id);

        CacheStoryService.clear();

        expect(CacheStoryService.story).toBe('undefined');
        expect(CacheStoryService.nodes.length).toBe(0);
        expect(CacheStoryService.links.length).toBe(0);
    });    

    it('should return true if the cache is empty, false when it is not', async () => {
        const testGraph = await initGraph();

        CacheStoryService.clear();

        expect(CacheStoryService.isEmpty()).toBe(true);

        await CacheStoryService.cache(testGraph.story.id);

        expect(CacheStoryService.isEmpty()).toBe(false);
    });

});