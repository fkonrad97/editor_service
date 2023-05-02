// https://dev.to/franciscomendes10866/caching-in-node-js-using-redis-2o80
// https://blog.bitsrc.io/optimizing-node-js-performance-with-redis-caching-f509edf33e04
// https://redis.io/docs/getting-started/installation/install-redis-on-windows/

const redis = require("redis");
const winston = require('winston');

const redisClient = redis.createClient();

redisClient.on('error', err => console.log('Redis Client Error', err));

async function connectToRedis() {
    await redisClient.connect()
        .then(() => winston.info(`Connected to Redis...`));
}

module.exports = { connectToRedis, redisClient }


