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