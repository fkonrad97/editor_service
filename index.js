const winston = require('winston');
const express = require('express');
const app = express();

require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/database')();

const port = process.env.PORT || 3000;
const server = app.listen(port, () => winston.info(`Listening on port ${port}...`));

module.exports = server;

/*const Node = require('./models/node');

const node1 = new Node({     
    nodeStory: "BLABLABLA1"
});

const node2 = new Node({     
    nodeStory: "BLABLABLA2",
    from: node1
});

const node3 = new Node({     
    nodeStory: "BLABLABLA3",
    from: node1,
    to: {
        decisionText: "Lol",
        to: node2
    }
});

node1.save();
node2.save();
node3.save(); */