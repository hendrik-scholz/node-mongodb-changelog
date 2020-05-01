function filterUndefinedOrNullTasks(tasks) {
    return tasks.filter((task) => task);
}

module.exports = { filterUndefinedOrNullTasks };
