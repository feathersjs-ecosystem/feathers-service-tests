import assert from 'assert';
import * as plugin from '../src';

describe('feathers-service-tests', () => {
  it('basic functionality', () => {
    assert.equal(typeof plugin, 'object', 'plugin is not an object');
    assert.equal(typeof plugin.base, 'function', 'plugin.base is not a function');
    assert.equal(typeof plugin.example, 'function', 'plugin.example is not a function');
    assert.equal(typeof plugin.orm, 'function', 'plugin.orm is not a function');
  });
});
