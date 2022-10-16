const { nodeSchema } = require('../models/node');
const { linkSchema } = require('../models/link');

linkSchema.pre('updateOne', function(next) {
    // Remove all the assignment docs that reference the removed person.
    this.model('nodeSchema').updateOne({ $pull: { 'outLinks': req.params.id }}, next);
});

linkSchema.pre('updateOne', function(next) {
    // Remove all the assignment docs that reference the removed person.
    this.model('nodeSchema').updateOne({ $pull: { 'outLinks': req.params.id }}, next);
});