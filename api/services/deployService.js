/**
 * 'finalizeStory' function puts Story, Nodes and Links together into one object to be ready to upload to IPFS
 * @param {Story} story 
 * @param {[Node]} storyNodes 
 * @param {[Link]} storyLinks 
 * @returns 
 */
function finalizeStory(story, storyNodes, storyLinks) {
    let nodesArr = [];

    for(const element of storyNodes) {
        nodesArr.push({
            id: element.id,
            startingNode: element.startingNode,
            nodeStory: element.nodeStory,
            inLinks: element.inLinks,
            outLinks: element.outLinks
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

    const deployedStory = {
        title: story.title,
        storyId: story.id,
        nodes: nodesArr,
        links: linksArr
    }

    return deployedStory;
}

exports.finalizeStory = finalizeStory;