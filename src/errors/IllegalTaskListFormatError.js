class IllegalTaskListFormatError extends Error {
    constructor() {
        super(arguments);
        Error.captureStackTrace(this, IllegalTaskListFormatError);

        this.message = 'Wrong task list format. The task list must not be undefined or null.';
    }
}

module.exports = { IllegalTaskListFormatError };
