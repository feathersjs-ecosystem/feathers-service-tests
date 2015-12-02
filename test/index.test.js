import assert from 'assert';
import * as plugin from '../src';

describe('feathers-service-tests', () => {
  it('basic functionality', done => {
    assert.equal(typeof plugin, 'object', 'That is all we can test');
    assert.equal(typeof plugin.base, 'function', 'That is all we can test');
    assert.equal(typeof plugin.example, 'function', 'That is all we can test');
    done();
  });
});
