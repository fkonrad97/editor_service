const winston = require('winston');
const express = require('express');
const app = express();

require('./editor/startup/logging')();
require('./editor/startup/routes')(app);
require('./editor/startup/database')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;