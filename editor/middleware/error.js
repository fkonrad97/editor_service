const winston = require('winston');

module.exports = function(err, req, res, next){
    // Log the exception
    winston.error(err);

    // Send a user-friendly message to the client
    res.status(500).send({
        message: 'An error occurred while processing your request. Please try again later.',
        errorCode: err.code
        // Add any other relevant information about the error here
    });
}