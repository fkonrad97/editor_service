const config = require('config');
const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');

module.exports = function() {
    winston.hanleException(
        new winston.transports.Console({ colorize: true, prettyPrint: true }),
        new winston.transports.File({ 'uncaughtExceptions.log' }));

    process.on('unhandledRejection', (ex) => {
        throw ex;
    });

    winston.add(winston.transports.File, { filename: 'log_summary.log' });
    winston.add(winston.transports.MongoDB, {
        db: config.get('db'),
        level: 'info'
    });
}