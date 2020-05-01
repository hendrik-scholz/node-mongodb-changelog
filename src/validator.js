function isConfigurationValid(configuration) {
    let validationResult = false;

    if (configuration && configuration.mongoUrl && configuration.databaseName && configuration.mongoConnectionConfig) {
        validationResult = true;
    }

    return validationResult;
}

function isTaskListValid(taskList) {
    let validationResult = false;

    if (taskList && taskList instanceof Array) {
        validationResult = true;
    }

    return validationResult;
}

function isTaskValid(task) {
    let validationResult = false;

    if (task.name && task.author && task.operation && task.operation instanceof Function) {
        validationResult = true;
    }

    return validationResult;
}

module.exports = {
    isConfigurationValid,
    isTaskListValid,
    isTaskValid
};
