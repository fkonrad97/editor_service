const express = require('express');
const nodes = require('../routes/nodes');
const links = require('../routes/links');

module.exports = function(app) {
    app.use(express.json());
    app.use('/api/nodes', nodes);
    app.use('/api/links', links);
}