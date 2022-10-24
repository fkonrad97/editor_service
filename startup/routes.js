const express = require('express');
const stories = require('../routes/stories');

module.exports = function(app) {
    app.use(express.json());
    app.use('/api/stories', stories);
}