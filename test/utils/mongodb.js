// https://stackoverflow.com/questions/13607732/in-memory-mongodb-for-test
// https://www.npmjs.com/package/mongodb-memory-server
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

function start() {
    mongod = new MongoMemoryServer();
    return mongod.getUri();
}

function stop() {
    return mongod.stop();
}

module.exports = {
    start,
    stop
}
