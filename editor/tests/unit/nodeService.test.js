const { getUnreachableNodes, getDependentBranch, getInlinks, getOutlinks } = require('../../services/nodeService');
const { clearDB, initGraph, clearRedis } = require('../testService');

let server;

describe('nodeService test', () => {
    beforeEach(async () => { 
        server = require('../../../index');
    });

    afterEach(async () => { 
        server.close();
        await clearDB();
        await clearRedis();
    });

    it('should return with all incoming links', async () => {
        const testGraph = await initGraph();
        
        expect(getInlinks(testGraph.nodes[2].id, testGraph.links).length).toBe(1);
    });

    it('should return with all outgoing links', async () => {
        const testGraph = await initGraph();

        expect(getOutlinks(testGraph.nodes[2].id, testGraph.links).length).toBe(2);
    });

    /*it('should return with all isolated nodes', async () => {
        const testGraph = await initGraph();

        const startingNode = testGraph.nodes.find(node => node.startingNode == true);

        expect(getUnreachableNodes(testGraph.nodes, startingNode, testGraph.links).length).toBe(1);
    });*/

    /*it('should return with all dependent nodes', async () => {
        const testGraph = await initGraph();

        const startingNode = testGraph.nodes[2];

        expect(getDependentBranch(testGraph.nodes, testGraph.links, startingNode).length).toBe(2);
    });*/
});

