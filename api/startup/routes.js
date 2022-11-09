const express = require('express');
const stories = require('../routes/stories');
const deployedStories = require('../routes/deployedstories');

module.exports = function(app) {
    app.use(express.json());
    app.use('/api/stories', stories);
    app.use('/api/deployedstories', deployedStories);
}