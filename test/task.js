const { expect } = require('chai');
const { MongoClient } = require('mongodb');
const { processTask } = require('../src/task');
const { Statuses } = require('../src/status');
const mongodb = require('./utils/mongodb');

describe('task', function() {
    const useInMemoryMongoDB = true;

    const CONFIGURATION = {
        mongoUrl: 'mongodb://localhost',
        databaseName: 'dbchangelog_test',
        mongoConnectionConfig: { useUnifiedTopology: true }
    };

    let mongoClient;
    let changelogCollection;

    before(async function() {
        if(useInMemoryMongoDB) {
            const uri = await mongodb.start();
            CONFIGURATION.mongoUrl = uri;
        }
    
        mongoClient = await MongoClient.connect(CONFIGURATION.mongoUrl, CONFIGURATION.mongoConnectionConfig);
        changelogCollection = await mongoClient.db(CONFIGURATION.databaseName).createCollection('databasechangelog');
    });

    beforeEach(async function() {
        await mongoClient.db(CONFIGURATION.databaseName).collection('databasechangelog').deleteMany({});
    });

    after(async function() {
        await mongoClient.close();

        if(useInMemoryMongoDB) {
            await mongodb.stop();
        }
    });

    const operation = () => Promise.resolve(true);
    const operationRejectingPromise = () => Promise.reject(new Error('rejected'));
    const operationThrowingError = () => { throw new Error('errorOperation') };
    const task = {name: 'operation', author: 'John', operation: operation};
    const taskRejectingPromise = {name: 'operation', author: 'John', operation: operationRejectingPromise};
    const taskThrowingError = {name: 'operation', author: 'John', operation: operationThrowingError};

    it('should insert one document in the changelog collection', (done) => {
        processTask(task, changelogCollection)
            .then((status) => {
                expect(status).to.equal(Statuses.SUCCESSFULLY_APPLIED);

                return changelogCollection.findOne({name: 'operation'})
            })
            .then((changelogEntry) => {
                expect(changelogEntry.author).to.equal('John');
                expect(changelogEntry.md5sum.length).to.equal(32);
                done();
            })
            .catch((error) => done(error));
    });

    it('should insert only one document in the changelog collection in case the task is the same', (done) => {
        processTask(task, changelogCollection)
            .then((status) => {
                expect(status).to.equal(Statuses.SUCCESSFULLY_APPLIED);

                return changelogCollection.findOne({name: 'operation'});
            })
            .then((changelogEntry) => {
                expect(changelogEntry.author).to.equal('John');
                expect(changelogEntry.md5sum.length).to.equal(32);

                return processTask(task, changelogCollection);
            })
            .then((status) => {
                expect(status).to.equal(Statuses.ALREADY_APPLIED);

                return changelogCollection.countDocuments({});
            })
            .then((count) => {
                expect(count).to.equal(1);
                done();
            })
            .catch(error => done(error));
    });

    it('should not insert a document in the changelog collection in case the task rejects promise', (done) => {
        processTask(taskRejectingPromise, changelogCollection)
            .then(() => {
                done('Unexpected result for task that rejects promise.');
            })
            .catch((error) => {
                expect(error).to.be.an.instanceof(Error);

                changelogCollection.countDocuments({})
                    .then((count) => {
                        expect(count).to.equal(0);
                        done();
                    })
                    .catch((error) => done(error));
            });
    });

    it('should not insert a document in the changelog collection in case the task throws error', (done) => {
        processTask(taskThrowingError, changelogCollection)
            .then(() => {
                done('Unexpected result for task that throws an error.');
            })
            .catch((error) => {
                expect(error).to.be.an.instanceof(Error);

                changelogCollection.countDocuments({})
                    .then((count) => {
                        expect(count).to.equal(0);
                        done();
                    })
                    .catch((error) => done(error));
            });
    });
});
