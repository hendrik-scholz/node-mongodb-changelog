class HashError extends Error {
    constructor(task, newHash) {
        super(arguments);
        Error.captureStackTrace(this, HashError);

        this.message = `Wrong md5sum for changeset "${task.name}". Current value is ${newHash}`;
    }
}

module.exports = { HashError };
