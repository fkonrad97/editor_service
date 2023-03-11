const { Link } = require('../models/link');
const { Node } = require('../models/node');
const { Story } = require('../models/story');

async function clearDB() {
    await Story.deleteMany({});
    await Node.deleteMany({});
    await Link.deleteMany({});
}

async function initGraph() {
    const testStory = new Story({ title: 'TestStory' });
    await testStory.save();

    const node1 = new Node({ "startingNode": true, "story": testStory.id, "nodeStory": "TestNode1" });
    const node2 = new Node({ "story": testStory.id, "nodeStory": "TestNode2" });
    const node3 = new Node({ "story": testStory.id, "nodeStory": "TestNode3" });
    const node4 = new Node({ "story": testStory.id, "nodeStory": "TestNode4" });
    const node5 = new Node({ "story": testStory.id, "nodeStory": "TestNode5" });
    const node6 = new Node({ "story": testStory.id, "nodeStory": "TestNode6" });
    const node7 = new Node({ "story": testStory.id, "nodeStory": "TestNode7" });

    await node1.save();
    await node2.save();
    await node3.save();
    await node4.save();
    await node5.save();
    await node6.save();
    await node7.save();

    const link1 = new Link({ "story": testStory.id, "decisionText": "TestLink1", from: node1.id, to: node2.id });
    const link2 = new Link({ "story": testStory.id, "decisionText": "TestLink2", from: node1.id, to: node3.id });
    const link3 = new Link({ "story": testStory.id, "decisionText": "TestLink3", from: node2.id, to: node6.id });
    const link4 = new Link({ "story": testStory.id, "decisionText": "TestLink4", from: node2.id, to: node4.id });
    const link5 = new Link({ "story": testStory.id, "decisionText": "TestLink5", from: node3.id, to: node4.id });
    const link6 = new Link({ "story": testStory.id, "decisionText": "TestLink6", from: node3.id, to: node5.id });
    const link7 = new Link({ "story": testStory.id, "decisionText": "TestLink7", from: node5.id, to: node6.id });

    await link1.save();
    await link2.save();
    await link3.save();
    await link4.save();
    await link5.save();
    await link6.save();
    await link7.save();

    return {
        story: testStory,
        nodes: [node1, node2, node3, node4, node5, node6, node7],
        links: [link1, link2, link3, link4, link5, link6, link7]
    }
}

module.exports = {
    clearDB,
    initGraph
}