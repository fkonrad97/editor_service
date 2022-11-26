const express = require('express');
const stories = require('../routes/stories');
const deployedStories = require('../routes/deployedstories');
const error = require('../middleware/error');

module.exports = function(app) {
    app.use(express.json());
    app.use('/api/stories', stories);
    app.use('/api/deployedstories', deployedStories);
    app.use(error);
}