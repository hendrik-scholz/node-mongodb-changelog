const { MongoClient } = require('mongodb');
const { IllegalConfigurationError } = require('./errors/IllegalConfigurationError');
const { IllegalTaskListFormatError } = require('./errors/IllegalTaskListFormatError');
const { isConfigurationValid, isTaskListValid } = require('./validator');
const { filterUndefinedOrNullTasks } = require('./filter');
const { processTask } = require('./task');

/**
 * Run migrations/tasks against database, specified by config.
 * @param {Object} configuration
 * @param {Object[]} tasks
 * @param {string} tasks[].name - unique name of the task
 * @param {function} tasks[].operation - function, returning yieldable value (https://github.com/tj/co#yieldables)
 * @returns {Promise} resolved with hash (taskName: Status), or rejected with en error occurred
 */
async function runMigrations(configuration, tasks) {
    if (!isConfigurationValid(configuration)) {
        throw new IllegalConfigurationError();
    }

    if (!isTaskListValid(tasks)) {
        throw new IllegalTaskListFormatError();
    }

    const filteredTasks = filterUndefinedOrNullTasks(tasks);

    const mongoClient = await MongoClient.connect(configuration.mongoUrl, configuration.mongoConnectionConfig);
    const changelogCollection = await mongoClient.db(configuration.databaseName).createCollection('databasechangelog');
    await changelogCollection.createIndex({ name: 1 }, { unique: true });

    const result = {};
    for (let i = 0; i < filteredTasks.length; i++) {
        const task = filteredTasks[i];
        result[task.name] = await processTask(task, changelogCollection);
    }
    await mongoClient.close();

    return result;
}

module.exports = runMigrations;
