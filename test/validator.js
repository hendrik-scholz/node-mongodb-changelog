const { expect } = require('chai');
const { isConfigurationValid, isTaskListValid, isTaskValid } = require('../src/validator');

describe('validator', function() {
    const operation = () => Promise.resolve(true);

    it('should return true for a valid configuration', () => {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: 'test',
            mongoConnectionConfig: {}
        };

        expect(isConfigurationValid(configuration)).to.be.true;
    });

    it('should return true for an invalid configuration - configuration is undefined', () => {
        const configuration = undefined;
        
        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration is null', () => {
        it('should return true for an invalid configuration - configuration is undefined', () => {
            const configuration = null;
            
            expect(isConfigurationValid(configuration)).to.be.false;
        });
    });

    it('should return true for an invalid configuration - configuration.mongoUrl is undefined', () => {
        const configuration = {
            mongoUrl: undefined,
            databaseName: '',
            mongoConnectionConfig: {}
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.mongoUrl is null', () => {
        const configuration = {
            mongoUrl: null,
            databaseName: '',
            mongoConnectionConfig: {}
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.mongoUrl is an empty string', () => {
        const configuration = {
            mongoUrl: '',
            databaseName: '',
            mongoConnectionConfig: {}
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.databaseName is undefined', () => {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: undefined,
            mongoConnectionConfig: {}
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.databaseName is null', () => {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: null,
            mongoConnectionConfig: {}
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.databaseName is an empty string', () => {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: '',
            mongoConnectionConfig: {}
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.mongoConnectionConfig is undefined', () => {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: '',
            mongoConnectionConfig: undefined
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.mongoConnectionConfig is null', () => {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: '',
            mongoConnectionConfig: null
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for an invalid configuration - configuration.mongoConnectionConfig is an empty string', () => {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: '',
            mongoConnectionConfig: ''
        };

        expect(isConfigurationValid(configuration)).to.be.false;
    });

    it('should return true for a valid task list', () => {
        const taskList = [{name: 'operation', author: 'John', operation: operation}];

        expect(isTaskListValid(taskList)).to.be.true;
    });

    it('should return false for an invalid task list - task list is undefined', () => {
        const taskList = undefined;

        expect(isTaskListValid(taskList)).to.be.false;
    });

    it('should return false for an invalid task list - task list is null', () => {
        const taskList = null;

        expect(isTaskListValid(taskList)).to.be.false;
    });

    it('should return false for an invalid task list - task list is not an array', () => {
        const taskList = {};

        expect(isTaskListValid(taskList)).to.be.false;
    });

    it('should return true for a valid task', () => {
        const task = {name: 'operation', author: 'John', operation: operation};

        expect(isTaskValid(task)).to.be.true;
    });

    it('should return false for an invalid task - task.name is undefined', () => {
        const task = {name: undefined, author: 'John', operation: operation};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.name is null', () => {
        const task = {name: null, author: 'John', operation: operation};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.name is an empty string', () => {
        const task = {name: '', author: 'John', operation: operation};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.author is undefined', () => {
        const task = {name: 'operation', author: undefined, operation: operation};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.author is null', () => {
        const task = {name: 'operation', author: null, operation: operation};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.author is an empty string', () => {
        const task = {name: 'operation', author: '', operation: operation};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.operation is undefined', () => {
        const task = {name: 'operation', author: 'John', operation: undefined};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.operation is null', () => {
        const task = {name: 'operation', author: 'John', operation: null};

        expect(isTaskValid(task)).to.be.false;
    });

    it('should return false for an invalid task - task.operation is not a function', () => {
        const task = {name: 'operation', author: 'John', operation: ''};

        expect(isTaskValid(task)).to.be.false;
    });
});
