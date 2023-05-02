const { redisClient } = require('../startup/caching');

// we need getCached(), cache(), delCache()

module.exports = {
    getCachedData: async function(req, res, next) {
        const id = req.body._id;
        
        await redisClient.get(id) // https://stackoverflow.com/questions/72340564/middleware-is-breaking-redis-express-setup
            .then((data) => {
                if (data !== null) {
                    res.locals.cachedData = JSON.parse(data);
                } else {
                    res.locals.cachedData = undefined;
                }
                next();
            }).catch(err => {
                if (err) throw err;
            });
    }
};