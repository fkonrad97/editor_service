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
    }

    return connectedNodes;
}

function getIsolatedNodes(nodes, startNode) {
    return nodes.filter(x => !bfsAlgo(nodes, startNode).includes(x));
}

/**
 * 
 * @param {[Node]} nodes 
 * @param {Node} startNode
 * @returns {[Node]}
 */
function getDependentBranch(nodes, startNode) {
    let queue = [startNode];
    let dependentNodes = [];

    while(queue.length > 0) {
        console.log(queue);
        const current = queue.shift();
        if(current === null) continue;
        dependentNodes.push(current);

        for (const element of current.outLinks) {
            const tmpNode = nodes.find(node => node.id == element.to);
            if (tmpNode.inLinks.length == 1) {
                queue.push(tmpNode);
            }
        }
    }

    return dependentNodes;
}

exports.getIsolatedNodes = getIsolatedNodes;
exports.getDependentBranch = getDependentBranch;