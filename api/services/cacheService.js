function createOutlinksMap(nodes, links) {
    const outLinksMap = new Map();
    for (const node of nodes) {
        let outLinks = [];
        const tmpLinks = links.find(link => node.id == link.from);
        if (typeof tmpLinks !== 'undefined') {
            outLinks.push(tmpLinks.id);
            outLinksMap.set(node.id, outLinks);
        }
    }

    return outLinksMap;
}

function createInlinksMap(nodes, links) {
    const inLinksMap = new Map();
    for (const node of nodes) {
        let inLinks = [];
        const tmpLinks = links.find(link => node.id == link.to);
        if (typeof tmpLinks !== 'undefined') {
            inLinks.push(tmpLinks.id);
            inLinksMap.set(node.id, inLinks);
        }
    }

    return inLinksMap;
}

function CachedStory(story, nodes, links, parentStories) {
    this.story = story;
    this.nodes = nodes;
    this.links = links;
    this.parentStories = parentStories;
    this.inLinksMap = createInlinksMap(nodes, links);
    this.outLinksMap = createOutlinksMap(nodes, links);

    this.addNode = function(node) {
        this.nodes.push(node);
    }

    this.addLink = function(link) {
        this.links.push(link);
    }

    this.addParentStory = function(parentStory) {
        this.parentStories.push(parentStory);
    }

    this.getUpdateLinkMaps = function(newLink) {
        const inLinksValueArr = this.inLinksMap.get(newLink.to);
        inLinksValueArr.push(newLink);
        this.inLinksMap.set(newLink.to, inLinksValueArr);

        const outLinksValueArr = this.outLinksMap.get(newLink.from);
        outLinksValueArr.push(newLink);
        this.outLinksMap.set(newLink.from, outLinksValueArr);
    }

    Object.defineProperties(CachedStory.prototype, {     
        'story': {             
            get: function() {
                this.story;
            }
        },
        'nodes': {
            get: function() {
                return this.nodes;
            }
        }, 
        'links': {
            get: function() {
                return this.links;
            } 
        },
        'parentStories': {
            get: function() {
                this.parentStories;
            } 
        },
        'inLinksMap': {
            get: function() {
                return this.inLinksMap;
            }
        },
        'outLinksMap': {
            get: function() {
                return this.outLinksMap;
            }
        }
      });
};

module.exports = CachedStory;
