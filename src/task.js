const { getMD5Sum } = require('./hash');
const { isTaskValid } = require('./validator');
const { HashError } = require('./errors/HashError');
const { IllegalTaskFormatError } = require('./errors/IllegalTaskFormatError');
const { Statuses } = require('./status');

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
        throw new IllegalTaskFormatError();
    }

    const storedTask = await changelogCollection.findOne({ name: task.name });
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
            md5sum
        };
        await changelogCollection.insertOne(appliedChange);
        status = Statuses.SUCCESSFULLY_APPLIED;
    }
    return status;
}

module.exports = { processTask };
