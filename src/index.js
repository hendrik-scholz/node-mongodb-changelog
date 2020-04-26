'use strict';

const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
const IllegalTaskListFormat = require('./error').IllegalTaskListFormat;
const IllegalTaskFormat = require('./error').IllegalTaskFormat;
const IllegalConfigurationError = require('./error').IllegalConfigurationError;
const HashError = require('./error').HashError;

const Statuses = {
    ALREADY_APPLIED: 'ALREADY_APPLIED',
    SUCCESSFULLY_APPLIED: 'SUCCESSFULLY_APPLIED'
};

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
        throw new IllegalTaskListFormat();
    }

    const filteredTasks = filterUndefinedOrNullTasks(tasks);

    const mongoClient = await MongoClient.connect(configuration.mongoUrl, configuration.mongoConnectionConfig);
    const changelogCollection = await mongoClient.db(configuration.databaseName).createCollection('databasechangelog');
    await changelogCollection.createIndex({name: 1}, {unique: true});

    const result = {};
    for (let i = 0; i < filteredTasks.length; i++) {
        const task = filteredTasks[i];
        result[task.name] = await processTask(task, changelogCollection);
    }
    await mongoClient.close();

    return result;
}

/**
 * Process new task. Check hash of applied tasks.
 * @param {Object} task
 * @param {mongodb collection} changelogCollection - changelog collection
 * @throws {IllegalTaskFormat} task should have "name" and "operation"
 * @throws {HashError} Already applied tasks should not be modified.
 * @returns Status
 */
async function processTask(task, changelogCollection) {
    if (!isTaskValid(task)) {
        throw new IllegalTaskFormat();
    }

    const storedTask = await changelogCollection.findOne({name: task.name});
    const md5sum = getMD5Sum(task);
    let status;
    if (storedTask) {
        if (storedTask.md5sum !== md5sum) {
            throw new HashError(task, md5sum);
        } else {
            status = Statuses.ALREADY_APPLIED;
        }
    } else {
        await task.operation();
        const appliedChange = {
            name: task.name,
            author: task.author,
            dateExecuted: new Date(),
            md5sum: md5sum
        };
        await changelogCollection.insertOne(appliedChange);
        status = Statuses.SUCCESSFULLY_APPLIED;
    }
    return status;
}

function isConfigurationValid(configuration) {
    return configuration && configuration.mongoUrl && configuration.databaseName && configuration.mongoConnectionConfig;
}

function isTaskListValid(taskList) {
    return taskList;
}

function isTaskValid(task) {
    return task.name && task.operation && task.operation instanceof Function;
}

function filterUndefinedOrNullTasks(tasks) {
    return tasks.filter(task => task);
}

function isTaskValid(task) {
    return task.name && task.author && task.operation && task.operation instanceof Function;
}

function getMD5Sum(task) {
    return crypto.createHash('md5').update(task.operation.toString()).digest('hex');
}

module.exports = runMigrations;
module.exports.Statuses = Statuses;
