const { expect } = require('chai');
const { filterUndefinedOrNullTasks } = require('../src/filter');

describe('filter', function() {
    const operation = () => Promise.resolve(true);
    const task = {name: 'operation', author: 'John', operation: operation};

    it('should filter undefined tasks', () => {
        const tasks = [task, undefined];

        const filteredTasks = filterUndefinedOrNullTasks(tasks);

        expect(filteredTasks.length).to.equal(1);
        expect(filteredTasks[0].name).to.equal('operation');
        expect(filteredTasks[0].author).to.equal('John');
        expect(filteredTasks[0].operation).to.be.an.instanceof(Function);
    });

    it('should filter null tasks', () => {
        const tasks = [task, null];

        const filteredTasks = filterUndefinedOrNullTasks(tasks);

        expect(filteredTasks.length).to.equal(1);
        expect(filteredTasks[0].name).to.equal('operation');
        expect(filteredTasks[0].author).to.equal('John');
        expect(filteredTasks[0].operation).to.be.an.instanceof(Function);
    });
});
