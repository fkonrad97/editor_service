const express = require('express');
const stories = require('../routes/stories');
const deployedStories = require('../routes/deployedstories');
const error = require('../middleware/error');

module.exports = function(app) {
    app.use(express.json());
    app.use('/editor/stories', stories);
    app.use('/editor/deployedstories', deployedStories);
    app.use(error);
}