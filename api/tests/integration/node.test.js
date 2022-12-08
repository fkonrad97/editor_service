const request = require('supertest');
const { Story } = require('../../models/story');
const { Link } = require('../../models/link');
const { Node } = require('../../models/node');
const { clearDB, initGraph } = require('../testService');

let server;

describe('post hook test', () => {
    beforeEach(() => { 
       server = require('../../../index');
    });

    afterEach(async () => { 
        server.close();
        await clearDB();
    });
    
    it('should delete the links related to the removed node', async () =>{
        const testGraph = await initGraph();

        await Node.findOneAndDelete(
            { _id: testGraph.nodes[2].id }
        );

        const nodes = await Node.find({});
        const links = await Link.find({});
        
        // After delete one node from all 7 nodes, 
        // there must be 4 links left from the original 7
        expect(nodes.length).toBe(6);
        expect(links.length).toBe(4);
    });
});

