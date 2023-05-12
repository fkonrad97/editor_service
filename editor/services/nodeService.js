const { Node } = require('../models/node');
const { Link } = require('../models/link');

/**
 * Creates an adjacency matrix from the given nodes and links.
 * 
 * The createAdjacencyMatrix function takes in an array of Node objects and an array of Link objects.
 * It initializes a Map object called adjacencyMatrix and then iterates through the nodes array,
 * adding each node as a key in adjacencyMatrix and setting its value to a new Map object.
 * Next, the function iterates through the links array. For each link, it finds the Node objects
 * that correspond to the from and to properties of the link and adds an entry to the inner map
 * for the fromNode with the toNode as the key and a value of true. Finally, the function returns
 * the adjacencyMatrix map.
 * 
 * @param {[Node]} nodes  - An array of Node objects representing the nodes in the graph.
 * @param {[Link]} links  - An array of Link objects representing the links in the graph.
 * 
 * @returns {Map} A map where the keys are the nodes in the graph and the values are maps representing
 *                the outgoing links for each node. The inner maps use the nodes as keys and boolean
 *                values to indicate whether there is a link between the two nodes.
 */
function createAdjacencyMatrix(nodes, links) {
    const adjacencyMatrix = new Map();

    for (const node of nodes) {
        adjacencyMatrix.set(node, new Map());
    }

    for (const link of links) {
        const fromNode = nodes.find(node => node._id == link.from);
        const toNode = nodes.find(node => node._id == link.to);
        if (adjacencyMatrix.has(fromNode)) {
            adjacencyMatrix.get(fromNode).set(toNode, true);
        }
    }

    return adjacencyMatrix;
}

/**
 * Returns an array of links that are incoming to the given node.
 * 
 * @param {Node} node - The node to find the incoming links for.
 * @param {[Link]} links - An array of Link objects representing all the links in the graph.
 */
function getInlinks(nodeId, links) {
    return links.filter(link => link.to.toString() === nodeId.toString());
}

/**
 * Returns an array of links that are outgoing from the given node.
 * 
 * @param {Node} node - The node to find the outgoing links for.
 * @param {[Link]} links - An array of Link objects representing all the links in the graph.
 * 
 * @returns {[Link]} 
*/
function getOutlinks(nodeId, links) {
    return links.filter(link => link.from.toString() === nodeId.toString());
}

/**
 * Returns an array of nodes that are unreachable from the given start node.
 * A node is considered unreachable if it has no incoming or outgoing links.
 * 
 * @param {[Node]} nodes - An array of Node objects representing the nodes in the graph.
 * @param {Node} startNode - The node to start the search from.
 * @param {[Link]} links - An array of Link objects representing the links in the graph.
 * 
 * @returns {[Node]} An array of Node objects representing the unreachable nodes in the graph.
 */
function getUnreachableNodes(nodes, startNode, links) {
    // create a set to keep track of visited nodes
    const visited = new Set();

    // perform DFS on the graph starting from the startNode, following both incoming and outgoing links
    /**
     * @param {Node} node 
     * @param {[Link]} links 
     */
    function dfs(node) {
        visited.add(node);
        for (const link of getOutlinks(node._id, links)) {
            const neighbor = nodes.find(n => n._id == link.to);
            if (!visited.has(neighbor)) {
                dfs(neighbor);
            }
        }
        for (const link of getInlinks(node._id, links)) {
            const neighbor = nodes.find(n => n._id == link.from);
            if (!visited.has(neighbor)) {
                dfs(neighbor);
            }
        }
    }

    dfs(startNode);

    // return the nodes that have not been visited
    return nodes.filter(node => !visited.has(node));
}


/**
 * Returns with all the nodes which are dependent from the given startNode. 
 * One node is dependent if it depends only on the given startNode or on other dependent nodes.
 * @param {[Node]} nodes 
 * @param {[Link]} links 
 * @param {Node} startNode
 * @returns {[Node]}
 */
function getDependentBranchAdjMatrix(nodes, links, startNode) {
    // Initialize variables
    let queue = [startNode];
    let dependentNodes = [];
    let usedNodeList = new Set();
    let cntMap = new Map();
    let usedLinkList = new Set();

    // Loop until the queue is empty
    while(queue.length > 0) {
        // Remove the first element from the queue
        const current = queue.shift();
        if(current === null) continue;

        // Add the current node to the used node list
        usedNodeList.add(current);

        // Find the outbound links for the current node
        const outLinks = getOutlinks(current._id, links);
        if (outLinks.length > 0) {
            // Iterate through the outbound links
            for (const link of outLinks) {
                // Check if the link has already been followed
                if (!usedLinkList.has(link.id)) {
                    // Get the toNode for the link
                    const toNode = nodes.find(node => node.id == link.to);

                    // If the link has not been followed, increment the count for the toNode in cntMap
                    if (cntMap.has(toNode.id)) {
                        cntMap.set(toNode.id, cntMap.get(toNode.id) + 1);
                    } else {
                        cntMap.set(toNode.id, 1);
                    }
                    
                    // If the toNode has not been visited yet, add it to the queue
                    if (!usedNodeList.has(toNode)) {
                        queue.push(toNode);
                    }
                    // Add the link to the used link list
                    usedLinkList.add(link);
                }
            }
        }
    }

    // Iterate through the nodes in usedNodeList
    for (const element of usedNodeList) {
         // If the number of inbound links for the node equals the count stored in cntMap, add the node to dependentNodes
         if (getInlinks(element._id, links).length == cntMap.get(element.id)) dependentNodes.push(element);
    }
    // Add the start node to dependentNodes
    dependentNodes.push(startNode);

    // Return dependentNodes
    return dependentNodes;
}

/**
 * Returns with all the nodes which are dependent from the given startNode. 
 * One node is dependent if it depends only on the given startNode or on other dependent nodes.
 * @param {[Node]} nodes 
 * @param {Node} startNode
 * @returns {[Node]}
 */
function getDependentBranch(nodes, links, startNode) {
    // Create an adjacency matrix representation of the graph
    const adjacencyMatrix = createAdjacencyMatrix(nodes, links);

    // Initialize variables
    let queue = [startNode];
    let dependentNodes = [];
    let usedNodeList = new Set();
    let cntMap = new Map();
    let usedLinkList = new Set();

    // Loop until the queue is empty
    while(queue.length > 0) {
        // Remove the first element from the queue
        const current = queue.shift();
        if(current === null) continue;

        // Add the current node to the used node list
        usedNodeList.add(current);

        // Get the inner map for the current node from the adjacency matrix
        const outLinks = adjacencyMatrix.get(current);
        if (outLinks.size > 0) {
            // Iterate through the entries in the inner map
            for (const [toNode, hasLink] of outLinks.entries()) {
                // Check if the link has already been followed
                if (!usedLinkList.has(toNode._id)) {
                    // If the link has not been followed, increment the count for the toNode in cntMap
                    if (cntMap.has(toNode._id)) {
                        cntMap.set(toNode._id, cntMap.get(toNode._id) + 1);
                    } else {
                        cntMap.set(toNode._id, 1);
                    }
                    
                    // If the toNode has not been visited yet, add it to the queue
                    if (!usedNodeList.has(toNode)) {
                        queue.push(toNode);
                    }
                    // Add the link to the used link list
                    usedLinkList.add(hasLink);
                }
            }
        }
    }

    // Iterate through the nodes in usedNodeList
    for (const element of usedNodeList) {
         // If the number of inbound links for the node equals the count stored in cntMap, add the node to dependentNodes
         if (adjacencyMatrix.get(element).size == cntMap.get(element._id)) dependentNodes.push(element);
    }

    // Add the start node to dependentNodes
    dependentNodes.push(startNode);

    // Return dependentNodes
    return dependentNodes;
}


// 1. Maybe would be better to use fetch the tokenURI from the NFT rather than searching for CID in the database
// 2. Move the DAO calls out of the function
async function retrieveStory(cid) { // should be changed to the new
    const { create } = await import('ipfs-http-client');
    const node = create();

    const chunks = [];
    for (const chunk of node.cat(cid)) {
        chunks.push(chunk);
    }

    const retrievedStoryJSON = JSON.parse(chunks.toString());

    return retrievedStoryJSON;
}

// Fetch the token URI from the NFT rather than searching for the CID in the database
async function retrieveStoryNEW(tokenURI) {
    const { create } = await import('ipfs-http-client');
    const node = create();

    // Extract the CID from the token URI
    const cid = tokenURI.split('/').pop();

    // Initialize the chunks array
    const chunks = [];

    // Retrieve the file from IPFS in chunks
    for await (const chunk of node.cat(cid)) {
        chunks.push(chunk);
    }

    // Parse the file contents as JSON
    const retrievedStoryJSON = JSON.parse(chunks.toString());

    // Return the parsed JSON
    return retrievedStoryJSON;
}

exports.getOutlinks = getOutlinks;
exports.getInlinks = getInlinks;
exports.retrieveStory = retrieveStory;
exports.getUnreachableNodes = getUnreachableNodes;
exports.getDependentBranch = getDependentBranch;