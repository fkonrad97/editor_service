const { redisClient } = require('../startup/caching');

module.exports = {
    cache: async function(key = undefined, obj) {
        if (key !== undefined) {
            await redisClient.set(key, JSON.stringify(obj));
        } else {
            await redisClient.set(obj.id, JSON.stringify(obj));
        }
    },
    getCacheWPattern: async function(pattern) {
        const matchingKeys = await redisClient.keys(pattern);

        let values = [];
        for (const key of matchingKeys) {
            let value = await redisClient.get(key);
            values.push(JSON.parse(value));
        }
        return values;
    },
    getCache: async function(key) {
        const obj = await redisClient.get(key) // https://stackoverflow.com/questions/72340564/middleware-is-breaking-redis-express-setup
            .catch(err => {
                if (err) throw err;
            });
        return JSON.parse(obj);
    },
    delCache: async function(key) {
        await redisClient.del(key);
    },
    clearCache: async function() {
        await redisClient.flushAll();
    },
    setStoryCache: async function(stories, nodes, links) {
        await module.exports.clearCache();

        for (const element of stories) {
            await module.exports.cache(`story_${element.id}`, element);
        }
    
        for (const element of nodes) {
            await module.exports.cache(`node_${element.id}`, element);
        }
    
        for (const element of links) {
            await module.exports.cache(`link_${element.id}`, element);
        }
    }
};