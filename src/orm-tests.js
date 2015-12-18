/*jshint expr: true*/

import { expect } from 'chai';

export default function orm(people, _ids, errors) {
  describe('Feathers ORM Specific Tests', () => {
    it('wraps an ORM error in a feathers error', done => {
      people.create({}).catch(error => {
        expect(error instanceof errors.FeathersError).to.be.ok;
        done();
      });
    });
  });
}
