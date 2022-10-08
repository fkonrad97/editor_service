const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');

module.exports = function() {
    const database = config.get('db');
    mongoose.connect(database)
        .then(() => winston.info(`Connected to ${database}...`));
}