// const changelog = require('mongodb-changelog');
const changelog = require('../src'); // for testing only

const config = {mongoUrl: 'mongodb://localhost:27017', databaseName: 'test', mongoConnectionConfig: {}};
const tasks = [
    {name: 'initDB',           author: 'John', operation: () => Promise.resolve(true)},
    {name: 'addAppAdminUsers', author: 'Jane', operation: () => Promise.resolve(true)},
    require('./filePerOperation')
];

changelog(config, tasks).then(
    res => console.log(res),
    err => console.error(err.message)
);
