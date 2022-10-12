const express = require('express');
const nodes = require('../routes/nodes');

module.exports = function(app) {
    app.use(express.json());
    app.use('/api/nodes', nodes);
}