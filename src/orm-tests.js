/* eslint-disable no-unused-expressions */

import { expect } from 'chai';

export default function orm (people, errors, idProp = 'id') {
  describe('Feathers ORM Common Tests', () => {
    it('wraps an ORM error in a feathers error', () => {
      return people.create({}).catch(error => {
        expect(error instanceof errors.FeathersError).to.be.ok
      });
    });

    describe('Raw/Lean Queries', () => {
      const _ids = {};
      const _data = {};

      beforeEach(() =>
        people.create({
          name: 'Doug',
          age: 32
        }).then(data => {
          _data.Doug = data;
          _ids.Doug = data[idProp];
        })
      );

      afterEach(() =>
        people.remove(_ids.Doug).catch(() => {})
      );

      function noPOJO() {
        // The prototype objects are huge and cause node to hang
        // when the reporter tries to log the errors to the console.
        throw new Error('The expected result was not a POJO.');
      }

      it('returns POJOs for find()', () => {
        return people.find({}).then(results =>
          expect(Object.getPrototypeOf(results[0])).to.equal(Object.prototype)
        ).catch(noPOJO);
      });

      it('returns a POJO for get()', () => {
        return people.get(_ids.Doug).then(result =>
          expect(Object.getPrototypeOf(result)).to.equal(Object.prototype)
        ).catch(noPOJO);
      });

      it('returns a POJO for create()', () => {
        return people.create({name: 'Sarah', age: 30}).then(result =>
          expect(Object.getPrototypeOf(result)).to.equal(Object.prototype)
        ).catch(noPOJO);
      });

      it('returns POJOs for bulk create()', () => {
        return people.create([{name: 'Sarah', age: 30}]).then(result =>
          expect(Object.getPrototypeOf(result[0])).to.equal(Object.prototype)
        ).catch(noPOJO);
      });

      it('returns a POJO for patch()', () => {
        return people.patch(_ids.Doug, {name: 'Sarah'}).then(result =>
          expect(Object.getPrototypeOf(result)).to.equal(Object.prototype)
        ).catch(noPOJO);
      });

      it('returns a POJO for update()', () => {
        return people.update(_ids.Doug, Object.assign(_data.Doug, {name: 'Sarah'})).then(result =>
          expect(Object.getPrototypeOf(result)).to.equal(Object.prototype)
        ).catch(noPOJO);
      });

      it('returns a POJO for remove()', () => {
        return people.remove(_ids.Doug).then(result =>
          expect(Object.getPrototypeOf(result)).to.equal(Object.prototype)
        ).catch(noPOJO);
      });
    });
  });
}
