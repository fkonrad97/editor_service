const winston = require('winston');
const express = require('express');
const app = express();

// // docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.9-management

require('./editor/startup/logging')();
require('./editor/startup/routes')(app);
require('./editor/startup/database')();
require('./editor/startup/msgbroker')

const port = process.env.PORT || 3000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;