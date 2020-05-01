const { expect } = require('chai');
const MongoClient = require('mongodb');

const changelog = require('../src/index');
const mongodb = require('./utils/mongodb');
const HashError = require('../src/errors/HashError').HashError;
const IllegalTaskListFormatError = require('../src/errors/IllegalTaskListFormatError').IllegalTaskListFormatError;
const IllegalTaskFormatError = require('../src/errors/IllegalTaskFormatError').IllegalTaskFormatError;
const IllegalConfigurationError = require('../src/errors/IllegalConfigurationError').IllegalConfigurationError;
const { Statuses } = require('../src/status');

describe('changelog(config, tasks)', function() {
    const useInMemoryMongoDB = true;

    const CONFIGURATION = {
        mongoUrl: 'mongodb://localhost',
        databaseName: 'dbchangelog_test',
        mongoConnectionConfig: { useUnifiedTopology: true }
    };

    let mongoClient;

    const firstOperation = () => {
        const collection = mongoClient.db(CONFIGURATION.databaseName).collection('users');
        return collection.insertOne({username: 'admin', password: 'test', isAdmin: true});
    };
    const secondOperation = () => Promise.resolve(true);
    const thirdOperation = () => Promise.reject();
    const fourthOperation = () => Promise.resolve(true);
    const fifthOperation = () => Promise.resolve(true);

    before(async function() {
        if(useInMemoryMongoDB) {
            const uri = await mongodb.start();
            CONFIGURATION.mongoUrl = uri;
        }
    
        mongoClient = await MongoClient.connect(CONFIGURATION.mongoUrl, CONFIGURATION.mongoConnectionConfig);
        await mongoClient.db(CONFIGURATION.databaseName).collection('databasechangelog').deleteMany({});
        await mongoClient.db(CONFIGURATION.databaseName).collection('users').deleteMany({});
    });
    
    after(async function() {
        await mongoClient.close();

        if(useInMemoryMongoDB) {
            await mongodb.stop();
        }
    });

    it('should return Promise', () => {
        expect(changelog(CONFIGURATION, [])).to.be.an.instanceOf(Promise);
    });

    it('should apply unprocessed operations', function(done) {
        changelog(CONFIGURATION, [
            {name: 'first', author: 'John', operation: firstOperation},
            {name: 'second', author: 'Jane', operation: secondOperation}
        ]).then(function(result) {
            expect(result).to.have.property('first', Statuses.SUCCESSFULLY_APPLIED);
            expect(result).to.have.property('second', Statuses.SUCCESSFULLY_APPLIED);

            mongoClient.db(CONFIGURATION.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
                expect(user).to.have.property('username', 'admin');
                expect(user).to.have.property('password', 'test');
                expect(user).to.have.property('isAdmin', true);
                done();
            });
        }).catch((error) => done(error));
    });

    it('should not apply already processed operations', function(done) {
        changelog(CONFIGURATION, [
            {name: 'first', author: 'John', operation: firstOperation},
            {name: 'second', author: 'Jane', operation: secondOperation}
        ])
        .then(function(result) {
            expect(result).to.have.property('first', Statuses.ALREADY_APPLIED);
            expect(result).to.have.property('second', Statuses.ALREADY_APPLIED);
            done();
        })
        .catch((error) => done(error));
    });

    it('should reject with HashError if already applied operation hash changed', function(done) {
        changelog(CONFIGURATION, [
            {name: 'second', author: 'Johnny', operation: thirdOperation}
        ])
        .then(() => {
            done('Unexpected result for task. Expected HashError.');
        })
        .catch((error) => {
            expect(error).to.be.an.instanceof(HashError);
            done();
        });
    });

    it('should reject with IllegalTaskFormatError if some operation does not fit format', function(done) {
        changelog(CONFIGURATION, [
            {wrongname: 'first'}
        ])
        .then(() => {
            done('Unexpected result for task. Expected IllegalTaskFormatError.');
        })
        .catch((error) => {
            expect(error).to.be.an.instanceof(IllegalTaskFormatError);
            done();
        });
    });

    it('should work as async function', async function() {
        const appliedTasks = await changelog(CONFIGURATION, [
            {name: 'asyncExample', author: 'Janie', operation: firstOperation}
        ]);

        expect(appliedTasks).to.deep.equal({asyncExample: 'SUCCESSFULLY_APPLIED'});
    });

    it('should work as async function (error)', async function() {
        try {
            await changelog(CONFIGURATION, [{wrongname: 'first'}]);
        } catch (error) {
            expect(error).to.be.an.instanceof(IllegalTaskFormatError);
        }
    });

    it('should throw an error in case the configuration is invalid', async function() {
        const configuration = undefined;

        try {
            await changelog(configuration, []);
        } catch (error) {
            expect(error).to.be.an.instanceof(IllegalConfigurationError);
        }
    });

    it('should throw an error in case the task list is invalid', async function() {
        try {
            await changelog(CONFIGURATION, undefined);
        } catch (error) {
            expect(error).to.be.an.instanceof(IllegalTaskListFormatError);
        }
    });

    it('should apply unprocessed operations even though one task is undefined', function(done) {
        changelog(CONFIGURATION, [
            {name: 'fourth', author: 'John', operation: fourthOperation},
            undefined
        ])
        .then(function(result) {
            expect(result).to.have.property('fourth', Statuses.SUCCESSFULLY_APPLIED);
            mongoClient.db(CONFIGURATION.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
                expect(user).to.have.property('username', 'admin');
                expect(user).to.have.property('password', 'test');
                expect(user).to.have.property('isAdmin', true);
                done();
            });
        })
        .catch(function(error) {
            done(error);
        });
    });

    it('should apply unprocessed operations even though one task is null', function(done) {
        changelog(CONFIGURATION, [
            {name: 'fifth', author: 'Jane', operation: fifthOperation},
            null
        ])
        .then(function(result) {
            expect(result).to.have.property('fifth', Statuses.SUCCESSFULLY_APPLIED);
            mongoClient.db(CONFIGURATION.databaseName).collection('users').findOne({username: 'admin'}).then(user => {
                expect(user).to.have.property('username', 'admin');
                expect(user).to.have.property('password', 'test');
                expect(user).to.have.property('isAdmin', true);
                done();
            });
        })
        .catch(function(error) {
            done(error);
        });
    });
});
