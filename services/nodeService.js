const Node = require('../models/node');
const Link = require('../models/link');  

/**
 * Breadth First Traversal
 * @param {[Node]} nodes - all nodes
 * @param {Node} startNode 
 * @returns {[Node]}
 */
function bfsAlgo(nodes, links, startNode) {
    let queue = [startNode];
    let connectedNodes = [];

    while(queue.length > 0) {
        const current = queue.shift();
        if(current === null) continue;
        connectedNodes.push(current);
        for (const element of current.outLinks) {
            const link = links.find(link => link.id == element);
            queue.push(nodes.find(node => node.id == link.to));
        }
    }

    return connectedNodes;
}

/**
 * Returns with all the Nodes which does not have any connection to the main story line which starts from the given startNode. 
 * If the whole graph is connected, so no isolated nodes, then returns with an empty array.
 * @param {[Node]} nodes 
 * @param {[Link]} links 
 * @param {Node} startNode 
 * @returns {[Node]}
 */
function getIsolatedNodes(nodes, links, startNode) {
    return nodes.filter(x => !bfsAlgo(nodes, links, startNode).includes(x));
}

/**
 * Returns with all the nodes which are dependent from the given startNode. 
 * One node is dependent if it depends only on the given startNode or on other dependent nodes.
 * @param {[Node]} nodes 
 * @param {Node} startNode
 * @returns {[Node]}
 */
function getDependentBranch(nodes, links, startNode) {  // Looking for optimalization options
    let queue = [startNode];
    let dependentNodes = [];
    let usedNodeList = [];
    let cntMap = new Map();
    let usedLinkList = [];

    while(queue.length > 0) {
        const current = queue.shift();
        if(current === null) continue;
        if (!usedNodeList.includes(current)) {
            usedNodeList.push(current);
        }

        if (current.outLinks.length > 0) {
            for (const element of current.outLinks) {
                if (!usedLinkList.includes(element)) {
                    const tmpNode = nodes.find(node => node.id == links.find(link => link.id == element).to);
    
                    if (cntMap.has(tmpNode.id)) {
                        cntMap.set(tmpNode.id, cntMap.get(tmpNode.id) + 1);
                    } else {
                        cntMap.set(tmpNode.id, 1);
                    }
                    
                    if (!usedNodeList.includes(tmpNode)) {
                        queue.push(tmpNode);
                    }
                    usedLinkList.push(element);
                }
            }
        }
    }

    for (const element of usedNodeList) {
         if (element.inLinks.length == cntMap.get(element.id)) dependentNodes.push(element);
    }
    dependentNodes.push(startNode);

    return dependentNodes;
}

exports.getIsolatedNodes = getIsolatedNodes;
exports.getDependentBranch = getDependentBranch;