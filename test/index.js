'use strict';

const should = require('should');
const MongoClient = require('mongodb').MongoClient;

const CONFIGURATION = {
    mongoUrl: 'mongodb://localhost',
    databaseName: 'dbchangelog_test',
    mongoConnectionConfig: { useUnifiedTopology: true }
};

const changelog = require('../src/index');
const mongodb = require('./mongodb');
const HashError = require('../src/error').HashError;
const IllegalTaskListFormat = require('../src/error').IllegalTaskListFormat;
const IllegalTaskFormat = require('../src/error').IllegalTaskFormat;
const IllegalConfigurationError = require('../src/error').IllegalConfigurationError;

let mongoClient;

const firstOperation = () => {
    const collection = mongoClient.db(CONFIGURATION.databaseName).collection('users');
    return collection.insertOne({username: 'admin', password: 'test', isAdmin: true});
};
const secondOperation = () => Promise.resolve(true);
const thirdOperation = () => Promise.reject();
const fourthOperation = () => Promise.resolve(true);
const fifthOperation = () => Promise.resolve(true);
const promiseRejectOperation = () => Promise.reject('promiseRejectOperation');
const errorOperation = () => {throw new Error('errorOperation')};

before(async function() {
    const uri = await mongodb.start();
    CONFIGURATION.mongoUrl = uri;

    mongoClient = await MongoClient.connect(CONFIGURATION.mongoUrl, CONFIGURATION.mongoConnectionConfig);
    await mongoClient.db(CONFIGURATION.databaseName).collection('databasechangelog').deleteMany({});
    await mongoClient.db(CONFIGURATION.databaseName).collection('users').deleteMany({});
});

after(async function() {
    await mongoClient.close();
    await mongodb.stop();
});

describe('changelog(config, tasks)', function() {
    it('should return Promise', () => {
        changelog(CONFIGURATION, []).should.be.an.instanceOf(Promise);
    });

    it('should apply unprocessed operations', function(done) {
        changelog(CONFIGURATION, [
            {name: 'first', author: 'John', operation: firstOperation},
            {name: 'second', author: 'Jane', operation: secondOperation}
        ]).then(function(result) {
            result.should.have.property('first', changelog.Statuses.SUCCESSFULLY_APPLIED);
            result.should.have.property('second', changelog.Statuses.SUCCESSFULLY_APPLIED);

            mongoClient.db(CONFIGURATION.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
                user.should.have.property('username', 'admin');
                user.should.have.property('password', 'test');
                user.should.have.property('isAdmin', true);
                done();
            });
        }).catch(function(error) {
            done(error);
        });
    });

    it('should not apply already processed operations', function(done) {
        changelog(CONFIGURATION, [
            {name: 'first', author: 'John', operation: firstOperation},
            {name: 'second', author: 'Jane', operation: secondOperation}
        ]).then(function(result) {
            result.should.have.property('first', changelog.Statuses.ALREADY_APPLIED);
            result.should.have.property('second', changelog.Statuses.ALREADY_APPLIED);
            done();
        });
    });

    it('should reject with HashError if already applied operation hash changed', function(done) {
        changelog(CONFIGURATION, [
            {name: 'second', author: 'Johnny', operation: thirdOperation}
        ]).catch((err) => {
            err.should.be.an.instanceOf(HashError);
            done();
        });
    });

    it('should reject with IllegalTaskFormat if some operation does not fit format', function(done) {
        changelog(CONFIGURATION, [
            {wrongname: 'first'}
        ]).catch((err) => {
            err.should.be.an.instanceOf(IllegalTaskFormat);
            done();
        });
    });

    it('should work as async function', async function() {
        const appliedTasks = await changelog(CONFIGURATION, [
            {name: 'asyncExample', author: 'Janie', operation: firstOperation}
        ]);
        appliedTasks.should.match({asyncExample: 'SUCCESSFULLY_APPLIED'});
    });

    it('should work as async function (error)', async function() {
        try{
            await changelog(CONFIGURATION, [{wrongname: 'first'}]);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalTaskFormat);
        }
    });

    it('should throw an error in case the configuration is undefined', async function() {
        const configuration = undefined;

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration is null', async function() {
        const configuration = null;

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration is an empty string', async function() {
        const configuration = '';

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.mongoUrl is undefined', async function() {
        const configuration = {
            mongoUrl: undefined,
            databaseName: 'dbchangelog_test',
            mongoConnectionConfig: {}
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.mongoUrl is null', async function() {
        const configuration = {
            mongoUrl: null,
            databaseName: 'dbchangelog_test',
            mongoConnectionConfig: {}
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.mongoUrl is an empty string', async function() {
        const configuration = {
            mongoUrl: '',
            databaseName: 'dbchangelog_test',
            mongoConnectionConfig: {}
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.databaseName is undefined', async function() {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: undefined,
            mongoConnectionConfig: {}
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.databaseName is null', async function() {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: null,
            mongoConnectionConfig: {}
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.databaseName is an empty string', async function() {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: '',
            mongoConnectionConfig: {}
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.mongoConnectionConfig is undefined', async function() {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: 'dbchangelog_test',
            mongoConnectionConfig: undefined
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.mongoConnectionConfig is null', async function() {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: 'dbchangelog_test',
            mongoConnectionConfig: null
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the configuration.mongoConnectionConfig is an empty string', async function() {
        const configuration = {
            mongoUrl: 'mongodb://localhost',
            databaseName: 'dbchangelog_test',
            mongoConnectionConfig: ''
        };

        try{
            await changelog(configuration, []);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the task list is undefined', async function() {
        try{
            await changelog(CONFIGURATION, undefined);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalTaskListFormat);
        }
    });

    it('should throw an error in case the task list is null', async function() {
        try{
            await changelog(CONFIGURATION, null);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalTaskListFormat);
        }
    });

    it('should apply unprocessed operations even though one task is undefined', function(done) {
        changelog(CONFIGURATION, [
            {name: 'fourth', author: 'John', operation: fourthOperation},
            undefined
        ]).then(function(result) {
            result.should.have.property('fourth', changelog.Statuses.SUCCESSFULLY_APPLIED);
            mongoClient.db(CONFIGURATION.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
                user.should.have.property('username', 'admin');
                user.should.have.property('password', 'test');
                user.should.have.property('isAdmin', true);
                done();
            });
        }).catch(function(error) {
            done(error);
        });
    });

    it('should apply unprocessed operations even though one task is null', function(done) {
        changelog(CONFIGURATION, [
            {name: 'fifth', author: 'Jane', operation: fifthOperation},
            null
        ]).then(function(result) {
            result.should.have.property('fifth', changelog.Statuses.SUCCESSFULLY_APPLIED);
            mongoClient.db(CONFIGURATION.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
                user.should.have.property('username', 'admin');
                user.should.have.property('password', 'test');
                user.should.have.property('isAdmin', true);
                done();
            });
        }).catch(function(error) {
            done(error);
        });
    });

    it('should not create an entry in the databasechangelog collection if task rejects promise', function(done) {
        changelog(CONFIGURATION, [
            {name: 'promiseReject', author: 'Johnny', operation: promiseRejectOperation}
        ]).then(function() {
            done('Unexpected result for task with promise reject.');
        }).catch(function(error) {
            error.should.be.exactly('promiseRejectOperation');
            mongoClient.db(CONFIGURATION.databaseName).collection('databasechangelog').findOne({name: 'promiseReject'}).then(change => {
                if (change != null) {
                    done('Unexpected changelog entry for task with promise reject.');
                } else {
                    done();
                }
            });
        });
    });

    it('should not create an entry in the databasechangelog collection if task throws error', function(done) {
        changelog(CONFIGURATION, [
            {name: 'error', author: 'Janie', operation: errorOperation}
        ]).then(function() {
            done('Unexpected result for task throwing an error.');
        }).catch(function(error) {
            error.message.should.be.exactly('errorOperation');
            mongoClient.db(CONFIGURATION.databaseName).collection('databasechangelog').findOne({name: 'error'}).then(change => {
                if (change != null) {
                    done('Unexpected changelog entry for task throwing an error.');
                } else {
                    done();
                }
            });
        });
    });
});
