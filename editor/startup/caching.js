const redis = require("redis");
const winston = require('winston');

const redisClient = redis.createClient();

redisClient.on('error', err => console.log('Redis Client Error', err));

async function connectToRedis() {
    await redisClient.connect()
        .then(() => winston.info(`Connected to Redis...`));
}

module.exports = { connectToRedis, redisClient }


