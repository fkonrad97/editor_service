const { Node } = require('../models/node');
const { Link } = require('../models/link');  

/**
 * Returns all links which goes out from the given node
 * @param {Node} node 
 * @returns {[Node]}
 */
async function getOutlinks(nodeId) {        // cache 10
    const links = await Link.find({
        from: nodeId
    });
    return links;
}

/**
 * Returns all links which goes into the given node
 * @param {Node} node 
 * @returns {[Node]}
 */
async function getInlinks(nodeId) {         // cache 11
    const links = await Link.find({
        to: nodeId
    });

    return links;
}

/**
 * Breadth First Traversal
 * @param {[Node]} nodes - all nodes
 * @param {Node} startNode 
 * @returns {[Node]}
 */
async function bfsAlgo(nodes, startNode) {
    let queue = [startNode];
    let connectedNodes = [];

    while(queue.length > 0) {
        const current = queue.shift();
        if(current === null) continue;
        connectedNodes.push(current);
        // const outlinks = await getOutlinks(current.id);
        for (const element of getOutlinks(current.id)) {                        // cache 12
            queue.push(nodes.find(node => node.id == element.to));
        }
    }

    return connectedNodes;
}

/**
 * Returns with all the Nodes which does not have any connection to the main story line which starts from the given startNode. 
 * If the whole graph is connected, so no isolated nodes, then returns with an empty array.
 * @param {[Node]} nodes
 * @param {Node} startNode 
 * @returns {[Node]}
 */
function getIsolatedNodes(nodes, startNode) {
    return nodes.filter(x => !bfsAlgo(nodes, startNode).includes(x));
}

/**
 * Returns with all the nodes which are dependent from the given startNode. 
 * One node is dependent if it depends only on the given startNode or on other dependent nodes.
 * @param {[Node]} nodes 
 * @param {Node} startNode
 * @returns {[Node]}
 */
async function getDependentBranch(nodes, links, startNode) {  // Looking for optimalization options
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

        const outlinks = getOutlinks(current.id);               // cache 13
        if (outlinks.length > 0) {
            for (const element of outlinks) {
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
         if (getInlinks(element.id).length == cntMap.get(element.id)) dependentNodes.push(element);
    }
    dependentNodes.push(startNode);

    return dependentNodes;
}

// 1. Maybe would be better to use fetch the tokenURI from the NFT rather than searching for CID in the database
// 2. Move the DAO calls out of the function
async function retrieveStory(cid) {
    const { create } = await import('ipfs-http-client');
    const node = create();

    const chunks = [];
    for await (const chunk of node.cat(cid)) {
        chunks.push(chunk);
    }

    const retrievedStoryJSON = JSON.parse(chunks.toString());

    return await retrievedStoryJSON;
}

/**
 * Cache the selected story
 * @param {Story} story 
 * @param {Node} storyNodes 
 * @param {Link} storyLinks 
 * @returns A full object with the additional parent stories if they exist.
 */
async function loadStory(story, storyNodes, storyLinks) {                               // useless
    let nodesArr = [];
    for(const element of storyNodes) {
        nodesArr.push({
            id: element.id,
            startingNode: element.startingNode,
            nodeStory: element.nodeStory,
            inLinks: getInlinks(element.id),
            outLinks: getOutlinks(element.id)
        });
    }

    let linksArr = [];
    for(const element of storyLinks) {
        linksArr.push({
            id: element.id,
            decisionText: element.decisionText,
            from: element.from,
            to: element.to
        });
    }

    let parentStoriesArr = [];
    if (story.parentCIDs !== null) {
        for await(const element of story.parentCIDs) {
            parentStoriesArr.push(await retrieveStory(element));
        }
    }

    const deployedStory = {
        title: story.title,
        storyId: story.id,
        nodes: nodesArr,
        links: linksArr,
        parentStories: parentStoriesArr
    }

    return deployedStory;
}

// Needs to work on it
async function mergeStories(storyObj) {                                                     // useless
    const parentStories = storyObj.parentStories;
    const links = storyObj.links;

    for (const link of links) {
        for (const node of parentStories.nodes) {
            if (link.from == node.id || link.to == node.id) {
                node.links.push(link);
            }
        }
    }

    storyObj.parentStories = parentStories;
    return storyObj;
}

exports.getOutlinks = getOutlinks;
exports.mergeStories = mergeStories;
exports.loadStory = loadStory;
exports.retrieveStory = retrieveStory;
exports.getIsolatedNodes = getIsolatedNodes;
exports.getDependentBranch = getDependentBranch;