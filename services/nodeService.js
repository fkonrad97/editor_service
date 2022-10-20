const Node = require('../models/node');
const Link = require('../models/link');  

/**
 * Breadth First Search
 * @param {[Node]} nodes - all nodes
 * @param {Node} startNode 
 * @returns 
 */
function bfsAlgo(nodes, links, startNode) {
    let queue = [startNode];
    let connectedNodes = [];

    while(queue.length > 0) {
        const current = queue.shift();
        if(current === null) continue;
        connectedNodes.push(current);
        console.log(current);
        for (const element of current.outLinks) {
            const link = links.find(link => link.id == element);
            queue.push(nodes.find(node => node.id == link.to));
        }
    }

    return connectedNodes;
}

function getIsolatedNodes(nodes, links, startNode) {
    return nodes.filter(x => !bfsAlgo(nodes, links, startNode).includes(x));
}

/**
 * 
 * @param { [Node] } nodes 
 * @param { Node } startNode
 * @returns { [Node] }
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

/**
 * 
 * @param {*} selectedNode 
 * @returns 
 */
async function deleteNode(selectedNode) {
    for (const link of selectedNode.inLinks) {
        await Link.findOneAndDelete(
            { _id: link }
        );
    }

    for (const link of selectedNode.outLinks) {
        await Link.findOneAndDelete(
            { _id: link }
        );
    }

    const deletedNode = await Node.findOneAndDelete(
        { _id: selectedNode._id }
    );

    return deletedNode;
}

exports.getIsolatedNodes = getIsolatedNodes;
exports.getDependentBranch = getDependentBranch;
exports.deleteNode = deleteNode;