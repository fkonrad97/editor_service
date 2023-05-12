const request = require('supertest');
const { Story } = require('../../models/story');
const { Node } = require('../../models/node');
const { Link } = require('../../models/link'); 
const { clearDB, initGraph, clearRedis } = require('../testService');
const { delCacheWPattern } = require('../../services/cacheService');

/**
 * Should use a different Redis server for testing!!
 */

let server;

describe('/editor/stories/', () => {
    beforeEach(() => { 
       server = require('../../../index');
    });

    afterEach(async () => { 
        server.close();
        await delCacheWPattern(`*`);
        await clearDB();
        await clearRedis();
    });

    describe('GET /', () => {
        it('should return all the stories', async () => {
            await Story.collection.insertMany([
                { title: 'TestStory1' }, 
                { title: 'TestStory2' }
            ]);

            const res = await request(server).get('/editor/stories/');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(story => story.title === 'TestStory1')).toBeTruthy();
            expect(res.body.some(story => story.title === 'TestStory2')).toBeTruthy();
        });
    });

    describe('POST /', () => {
        it('should create a new story object and save to the database', async () => {
            const res = await request(server).post('/editor/stories/createStory').send({
                title: "TestStoryTitle"
            });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("TestStoryTitle");
        });

        it('should create a new node object and save to the database', async () => {
            let createdStory = await request(server).post('/editor/stories/createStory').send({
                title: "TestStoryTitle"
            });

            await request(server).get('/editor/stories/loadStory').send({
                storyId: createdStory.body._id
            });

            const nodesBeforeSave = await Node.find({});

            const res = await request(server).post('/editor/stories/addNode').send({
                startingNode: "true",
                nodeStory: "This is a test node!"
            });

            const nodesAfterSave = await Node.find({});

            expect(res.status).toBe(200);
            expect(nodesBeforeSave.length).toBe(0);
            expect(nodesAfterSave.length).toBe(1);
        });

        it('should create a new link object and save to the database', async () => {
            const testStory = await Story.collection.insertMany([
                { title: 'TestStoryTitle' }
            ]);

            const nodes = await Node.collection.insertMany([
                { nodeStory: 'MockNode1', story: testStory.insertedIds[0] },
                { nodeStory: 'MockNode2', story: testStory.insertedIds[0] }
            ]);

            // To update cache in the request
            await request(server).get('/editor/stories/loadStory').send({
                storyId: testStory.insertedIds[0]
            });

            const linksBeforeSave = await Link.find({});

            const res = await request(server).post('/editor/stories/addLink').send({
                decisionText: "This is a test link!",
                from: nodes.insertedIds[0],
                to: nodes.insertedIds[1]
            });

            const linksAfterSave = await Link.find({});

            expect(res.status).toBe(200);
            expect(linksBeforeSave.length).toBe(0);
            expect(linksAfterSave.length).toBe(1);
        });
    });

    describe('PUT /', () => {
        it('should update toNode in given link', async () => {
            const testStory = await Story.collection.insertMany([
                { title: 'TestStoryTitle' }
            ]);
            
            const nodes = await Node.collection.insertMany([
                { nodeStory: 'MockNode1', story: testStory.insertedIds[0] },
                { nodeStory: 'MockNode2', story: testStory.insertedIds[0] },
                { nodeStory: 'MockNode3', story: testStory.insertedIds[0] },
            ]);

            const link = await Link.collection.insertMany([
                { 
                    decisionText: 'TestLink', 
                    story: testStory.insertedIds[0], 
                    from: nodes.insertedIds[0], 
                    to: nodes.insertedIds[1] 
                }
            ]);

            await request(server).get('/editor/stories/loadStory').send({
                storyId: testStory.insertedIds[0]
            });

            const res = await request(server).put('/editor/stories/updateLinkToNode').send({
                linkId: link.insertedIds[0],
                toNodeId: nodes.insertedIds[2]
            });

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(1);
        });

        it('should update fromNode in given link', async () => {
            const testStory = await Story.collection.insertMany([
                { title: 'TestStoryTitle' }
            ]);
            
            const nodes = await Node.collection.insertMany([
                { nodeStory: 'MockNode1', story: testStory.insertedIds[0] },
                { nodeStory: 'MockNode2', story: testStory.insertedIds[0] },
                { nodeStory: 'MockNode3', story: testStory.insertedIds[0] },
            ]);

            const link = await Link.collection.insertMany([
                { 
                    decisionText: 'TestLink', 
                    story: testStory.insertedIds[0], 
                    from: nodes.insertedIds[0], 
                    to: nodes.insertedIds[1] 
                }
            ]);

            await request(server).get('/editor/stories/loadStory').send({
                storyId: testStory.insertedIds[0]
            });

            const res = await request(server).put('/editor/stories/updateLinkFromNode').send({
                linkId: link.insertedIds[0],
                fromNodeId: nodes.insertedIds[2]
            });

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(1);
        });

        it('should update story text of a Node', async () => {
            const testStory = await Story.collection.insertMany([
                { title: 'TestStoryTitle' }
            ]);

            const node = await Node.collection.insertMany([
                { nodeStory: 'MockNode1', story: testStory.insertedIds[0] }
            ]);

            await request(server).get('/editor/stories/loadStory').send({
                storyId: testStory.insertedIds[0]
            });

            const res = await request(server).put('/editor/stories/updateNodeStory').send({
                nodeId: node.insertedIds[0],
                text: "Test Story"
            });

            expect(res.status).toBe(200);
            expect(res.body.modifiedCount).toBe(1);
        });
    });

    describe('DELETE /', () => {
        it('should delete story', async () => {
            const testStory = await Story.collection.insertMany([
                { title: 'TestStoryTitle' }
            ]);

            const res = await request(server).delete('/editor/stories/deleteStory').send({
                storyId: testStory.insertedIds[0]
            });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('TestStoryTitle');
        });

        it('should delete node', async () => {
            const testStory = await Story.collection.insertMany([
                { title: 'TestStoryTitle' }
            ]);
    
            const node = await Node.collection.insertMany([
                { nodeStory: 'MockNode1', story: testStory.insertedIds[0] }
            ]);
    
            await request(server).get('/editor/stories/loadStory').send({
                storyId: testStory.insertedIds[0]
            });
    
            const res = await request(server).delete('/editor/stories/deleteNode').send({
                nodeId: node.insertedIds[0]
            });

            const deletedNode = await Node.find({});
    
            expect(deletedNode.length).toBe(0);
            expect(res.status).toBe(200);
            expect(res.body.nodeStory).toBe('MockNode1');
        });
    
        it('should delete link', async () => {
            const testStory = await Story.collection.insertMany([
                { title: 'TestStoryTitle' }
            ]);
    
            const nodes = await Node.collection.insertMany([
                { nodeStory: 'MockNode1', story: testStory.insertedIds[0] },
                { nodeStory: 'MockNode2', story: testStory.insertedIds[0] }
            ]);
    
            const link = await Link.collection.insertMany([
                { 
                    decisionText: 'TestLink', 
                    story: testStory.insertedIds[0], 
                    from: nodes.insertedIds[0], 
                    to: nodes.insertedIds[1] 
                }
            ]);
    
            await request(server).get('/editor/stories/loadStory').send({
                storyId: testStory.insertedIds[0]
            });
    
            const res = await request(server).delete('/editor/stories/deleteLink').send({
                linkId: link.insertedIds[0]
            });
    
            const deletedLink = await Link.find({});
    
            expect(deletedLink.length).toBe(0);
            expect(res.status).toBe(200);
            expect(res.body.decisionText).toBe('TestLink');
        });

        it('should delete isolated nodes', async () => {
            const testGraph = await initGraph();

            await request(server).get('/editor/stories/loadStory').send({
                storyId: testGraph.story._id
            });

            const res = await request(server).delete('/editor/stories/deleteIsolatedNodes');
            
            expect(res.body.deletedCount).toBe(1);
            expect(res.status).toBe(200);
        });

        it('should delete dependent nodes', async () => {
            const testGraph = await initGraph();

            await request(server).get('/editor/stories/loadStory').send({
                storyId: testGraph.story._id
            });

            const res = await request(server).delete('/editor/stories/deleteDependencyTree').send({
                startNodeId: testGraph.nodes[2]._id
            });

            const remainedNodes = await Node.find({});
            const remainedLinks = await Link.find({});

            expect(res.body.length).toBe(2);
            expect(res.status).toBe(200);
            expect(remainedLinks.length).toBe(3);
            expect(remainedNodes.length).toBe(5);
        });
    });
});

