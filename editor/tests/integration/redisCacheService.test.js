const { clearDB, initGraph } = require('../testService');
const { cache, getCache, delCache, getCacheWPattern, setStoryCache, delCacheWPattern } = require('../../services/cacheService');


let server;

describe('redis cache service testing', () => {
    beforeEach(() => { 
       server = require('../../../index');
    });

    afterEach(async () => { 
        server.close();
        await delCacheWPattern(`test_*`);
        await clearDB();
    });

    it('should cache the given story', async () => {
        const testGraph = await initGraph();

        await cache(`test_story_${testGraph.story.id}`, testGraph.story);

        for(const node of testGraph.nodes) {
            await cache(`test_node_${node.id}`, node);
        }
        
        for(const link of testGraph.links) {
            await cache(`test_link_${link.id}`, link);
        }

        const testStory = await getCache(`test_story_${testGraph.story._id}`);

        const testNodes = await getCacheWPattern(`test_node_*`);

        const testLinks = await getCacheWPattern(`test_link_*`);

        expect(testStory.title).toBe("TestStory");
        expect(testNodes.length).toBe(7);
        expect(testLinks.length).toBe(7);
    });
});