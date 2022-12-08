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

    it('should delete the links and node contained by the removed story', async () =>{
        const testGraph = await initGraph();

        await Story.findOneAndDelete(
            { _id: testGraph.story.id }
        );

        const nodes = await Node.find({});
        const links = await Link.find({});
        
        // After delete the only story from the DB, 
        // it should delete all the nodes and links as well
        expect(nodes.length).toBe(0);
        expect(links.length).toBe(0);
    });
});

