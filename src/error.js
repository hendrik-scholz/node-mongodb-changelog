'use strict';

class HashError extends Error {
    constructor(task, newHash) {
      super(arguments);
      Error.captureStackTrace(this, HashError);

      this.message = `Wrong md5sum for changeset "${task.name}". Current value is ${newHash}`;
    }
}

class IllegalConfigurationError extends Error {
  constructor() {
    super(arguments);
    Error.captureStackTrace(this, IllegalConfigurationError);

    this.message = 'Wrong configuration format. Expected { mongoUrl: "mongodb://localhost", databaseName: "databaseName", mongoConnectionConfig: object}';
  }
}

class IllegalTaskListFormat extends Error {
  constructor() {
    super(arguments);
    Error.captureStackTrace(this, IllegalTaskListFormat);

    this.message = 'Wrong task list format. The task list must not be undefined or null.';
  }
}

class IllegalTaskFormat extends Error {
    constructor() {
      super(arguments);
      Error.captureStackTrace(this, IllegalTaskFormat);

      this.message = 'Wrong task format. Expected { name: "taskname", author: "author", operation: function }';
    }
}

module.exports = {
    HashError,
    IllegalConfigurationError,
    IllegalTaskListFormat,
    IllegalTaskFormat
};
