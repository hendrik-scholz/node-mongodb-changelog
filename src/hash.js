const crypto = require('crypto');

function getMD5Sum(task) {
    return crypto.createHash('md5').update(task.operation.toString()).digest('hex');
}

module.exports = { getMD5Sum };
