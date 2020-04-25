'use strict';

const should = require('should');
const MongoClient = require('mongodb').MongoClient;

const CONFIG = {
    mongoUrl: 'mongodb://localhost',
    databaseName: 'dbchangelog_test',
    mongoConnectionConfig: {}
};

const changelog = require('../src/index');
const HashError = require('../src/error').HashError;
const IllegalTaskListFormat = require('../src/error').IllegalTaskListFormat;
const IllegalTaskFormat = require('../src/error').IllegalTaskFormat;
const IllegalConfigurationError = require('../src/error').IllegalConfigurationError;

let mongoClient;

const firstOperation = () => {
    const collection = mongoClient.db(CONFIG.databaseName).collection('users');
    return collection.insert({username: 'admin', password: 'test', isAdmin: true});
};
const secondOperation = () => Promise.resolve(true);
const thirdOperation = () => Promise.reject();
const fourthOperation = () => Promise.resolve(true);
const fifthOperation = () => Promise.resolve(true);

before(async function() {
    mongoClient = await MongoClient.connect(CONFIG.mongoUrl, CONFIG.mongoConnectionConfig);
    await mongoClient.db(CONFIG.databaseName).collection('databasechangelog').deleteMany({});
    await mongoClient.db(CONFIG.databaseName).collection('users').deleteMany({});
});

describe('changelog(config, tasks)', function() {
    it('should return Promise', () => {
        changelog(CONFIG, []).should.be.an.instanceOf(Promise);
    });

    it('should apply unprocessed operations', function(done) {
        changelog(CONFIG, [
            {name: 'first', operation: firstOperation},
            {name: 'second', operation: secondOperation}
        ]).then(function(result) {
            result.should.have.property('first', changelog.Statuses.SUCCESSFULLY_APPLIED);
            result.should.have.property('second', changelog.Statuses.SUCCESSFULLY_APPLIED);
            mongoClient.db(CONFIG.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
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
        changelog(CONFIG, [
            {name: 'first', operation: firstOperation},
            {name: 'second', operation: secondOperation}
        ]).then(function(result) {
            result.should.have.property('first', changelog.Statuses.ALREADY_APPLIED);
            result.should.have.property('second', changelog.Statuses.ALREADY_APPLIED);
            done();
        });
    });

    it('should reject with HashError if already applied operation hash changed', function(done) {
        changelog(CONFIG, [
            {name: 'second', operation: thirdOperation}
        ]).catch((err) => {
            err.should.be.an.instanceOf(HashError);
            done();
        });
    });

    it('should reject with IllegalTaskFormat if some operation does not fit format', function(done) {
        changelog(CONFIG, [
            {wrongname: 'first'}
        ]).catch((err) => {
            err.should.be.an.instanceOf(IllegalTaskFormat);
            done();
        });
    });

    it('should work as async function', async function() {
        const appliedTasks = await changelog(CONFIG, [
            {name: 'asyncExample', operation: firstOperation}
        ]);
        appliedTasks.should.match({asyncExample: 'SUCCESSFULLY_APPLIED'});
    });

    it('should work as async function (error)', async function() {
        try{
            await changelog(CONFIG, [{wrongname: 'first'}]);
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

    it('should throw an error in case the task list is undefined', async function() {
        try{
            await changelog(CONFIG, undefined);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalTaskListFormat);
        }
    });

    it('should throw an error in case the task list is null', async function() {
        try{
            await changelog(CONFIG, null);
        } catch (error) {
            error.should.be.an.instanceOf(IllegalTaskListFormat);
        }
    });

    it('should apply unprocessed operations even though one task is undefined', function(done) {
        changelog(CONFIG, [
            {name: 'fourth', operation: fourthOperation},
            undefined
        ]).then(function(result) {
            result.should.have.property('fourth', changelog.Statuses.SUCCESSFULLY_APPLIED);
            mongoClient.db(CONFIG.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
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
        changelog(CONFIG, [
            {name: 'fifth', operation: fifthOperation},
            null
        ]).then(function(result) {
            result.should.have.property('fifth', changelog.Statuses.SUCCESSFULLY_APPLIED);
            mongoClient.db(CONFIG.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
                user.should.have.property('username', 'admin');
                user.should.have.property('password', 'test');
                user.should.have.property('isAdmin', true);
                done();
            });
        }).catch(function(error) {
            done(error);
        });
    });
});
