const mongoose = require('mongoose');
const { linkSchema } = require('./link');

const Node = mongoose.model('Nodes', new mongoose.Schema({
    nodeStory: {
        type: String,
        required: true
    },
    inLinks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Node"
        }
    ],
    outLinks: [ linkSchema ]
}));

/**
 * Breadth First Search
 * @param {[Node]} nodes - all nodes
 * @param {Node} startNode 
 * @returns 
 */
function bfsAlgo(nodes, startNode) {
    let queue = [startNode];
    let connectedNodes = [];

    while(queue.length > 0) {
        const current = queue.shift();
        if(current === null) continue;
        connectedNodes.push(current);
        for (const element of current.outLinks) {
            queue.push(nodes.find(node => node.id == element.to));
        }
        /*for (let i = 0; i < current.outLinks.length; i++) { 
            queue.push(nodes.find(node => node.id == current.outLinks[i].to));
        }*/
    }

    return connectedNodes;
}

function getIsolatedNodes(nodes, startNode) {
    return nodes.filter(x => !bfsAlgo(nodes, startNode).includes(x));
}

exports.Node = Node;
exports.getIsolatedNodes = getIsolatedNodes;