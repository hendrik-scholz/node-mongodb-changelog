const { expect } = require('chai');
const { getMD5Sum } = require('../src/hash');

describe('hash', function() {
    it('should return an MD5Sum for a given task', () => {
        const operation = () => Promise.resolve(true);
        const task = {name: 'operation', author: 'John', operation: operation};

        const md5sum = getMD5Sum(task);

        expect(md5sum.length).to.equal(32);
    });
});
