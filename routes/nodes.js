const mongoose = require('mongoose');
const {Node} = require('../models/node'); 
const express = require('express');
const router = express.Router();

router.get('/:id', async (req, res) => {
    const node = await Node.findById(req.params.id);
    res.send(node);
});

module.exports = router; 