const winston = require('winston');
const express = require('express');
const app = express();
const { connectToRedis } = require('./editor/startup/caching');

require('./editor/startup/logging')();
require('./editor/startup/routes')(app);
require('./editor/startup/database')();
connectToRedis();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;