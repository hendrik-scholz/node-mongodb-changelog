class IllegalConfigurationError extends Error {
    constructor() {
        super(arguments);
        Error.captureStackTrace(this, IllegalConfigurationError);

        this.message = 'Wrong configuration format. Expected {'
            + 'mongoUrl: "mongodb://localhost", '
            + 'databaseName: "databaseName", '
            + 'mongoConnectionConfig: object}';
    }
}

module.exports = { IllegalConfigurationError };
