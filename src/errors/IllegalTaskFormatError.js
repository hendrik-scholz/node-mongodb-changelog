class IllegalTaskFormatError extends Error {
    constructor() {
        super(arguments);
        Error.captureStackTrace(this, IllegalTaskFormatError);

        this.message = 'Wrong task format. Expected { name: "taskname", author: "author", operation: function }';
    }
}

module.exports = { IllegalTaskFormatError };
