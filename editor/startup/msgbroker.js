const amqp = require("amqplib");
const config = require('config');
const winston = require('winston');

async function connectQueue() {   
    try {
        const mqConnection = await amqp.connect(config.get('mqRabbit'));
        const mqChannel = await mqConnection.createChannel();
    
        await mqChannel.assertQueue("test-queue");
        winston.info(`Connecting to RabbitMq has been successful...`);
        return {mqChannel, mqConnection};
    } catch (error) {
        winston.info(`Error at connecting to RabbitMQ server...${error}`);
    }
}
const {mqChannel, mqConnection} = connectQueue();

module.mqChannel = mqChannel;
module.mqConnection = mqConnection;