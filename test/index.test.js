import assert from 'assert';
import plugin from '../src';

describe('feathers-service-tests', () => {
  it('basic functionality', done => {
    assert.equal(typeof plugin, 'function', 'That is all we can test');
    done();
  });
});
