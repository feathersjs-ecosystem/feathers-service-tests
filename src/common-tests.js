/*jshint expr: true*/

import { expect } from 'chai';

export default function common(people, _ids, errors, idProp = 'id') {
  describe('extend', () => {
    it('extends and uses extended method', () => {
      let now = new Date().getTime();
      let extended = people.extend({
        create(data) {
          data.time = now;
          return this._super.apply(this, arguments);
        }
      });

      return extended.create({ name: 'Dave' })
        .then(data => extended.remove(data[idProp]))
        .then(data => expect(data.time).to.equal(now));
    });
  });

  describe('get', () => {
    it('returns an instance that exists', () => {
      return people.get(_ids.Doug).then(data => {
        expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
        expect(data.name).to.equal('Doug');
      });
    });

    it('returns NotFound error for non-existing id', () => {
      return people.get('568225fbfe21222432e836ff').catch(error => {
        expect(error instanceof errors.NotFound).to.be.ok;
        expect(error.message).to.equal('No record found for id \'568225fbfe21222432e836ff\'');
      });
    });
  });

  describe('remove', () => {
    it('deletes an existing instance and returns the deleted instance', () => {
      people.remove(_ids.Doug).then(data => {
        expect(data).to.be.ok;
        expect(data.name).to.equal('Doug');
      });
    });

    it('deletes multiple instances', () => {
      return people.create({ name: 'Dave', age: 29, created: true })
        .then(() => people.create({ name: 'David', age: 3, created: true }))
        .then(() => people.remove(null, { query: { created: true } }))
        .then(data => {
          expect(data.length).to.equal(2);

          let names = data.map(person => person.name);
          expect(names.indexOf('Dave')).to.be.above(-1);
          expect(names.indexOf('David')).to.be.above(-1);
        });
    });
  });

  describe('find', () => {
    beforeEach(() => {
      return people.create({
        name: 'Bob',
        age: 25
      }).then(bob => {
        _ids.Bob = bob[idProp].toString();

        return people.create({
          name: 'Alice',
          age: 19
        });
      }).then(alice => _ids.Alice = alice[idProp].toString());
    });

    afterEach(() => {
      return people.remove(_ids.Bob)
        .then(() => people.remove(_ids.Alice));
    });

    it('returns all items', () => {
      return people.find().then(data => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(3);
      });
    });

    it('filters results by a single parameter', () => {
      const params = { query: { name: 'Alice' } };

      return people.find(params).then(data => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(1);
        expect(data[0].name).to.equal('Alice');
      });
    });

    it('filters results by multiple parameters', () => {
      const params = { query: { name: 'Alice', age: 19 } };

      return people.find(params).then(data => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(1);
        expect(data[0].name).to.equal('Alice');
      });
    });

    describe('special filters', ()  => {
      it('can $sort', () => {
        const params = {
          query: {
            $sort: {name: 1}
          }
        };

        return people.find(params).then(data => {
          expect(data.length).to.equal(3);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Bob');
          expect(data[2].name).to.equal('Doug');
        });
      });

      it('can $limit', () => {
        const params = {
          query: {
            $limit: 2
          }
        };

        people.find(params)
          .then(data => expect(data.length).to.equal(2));
      });

      it('can $skip', () => {
        const params = {
          query: {
            $sort: {name: 1},
            $skip: 1
          }
        };

        return people.find(params).then(data => {
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Bob');
          expect(data[1].name).to.equal('Doug');
        });
      });

      it('can $select', () => {
        const params = {
          query: {
            name: 'Alice',
            $select: ['name']
          }
        };

        return people.find(params).then(data => {
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Alice');
          expect(data[0].age).to.be.undefined;
        });
      });

      it('can $or', () => {
        const params = {
          query: {
            $or: [
              { name: 'Alice' },
              { name: 'Bob' }
            ],
            $sort: {name: 1}
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Bob');
        });
      });

      it.skip('can $not', () => {
        var params = {
          query: {
            age: { $not: 19 },
            name: { $not: 'Doug' }
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Bob');
        });
      });

      it('can $in', () => {
        const params = {
          query: {
            name: {
              $in: ['Alice', 'Bob']
            },
            $sort: {name: 1}
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Bob');
        });
      });

      it('can $nin', () => {
        const params = {
          query: {
            name: {
              $nin: ['Alice', 'Bob']
            }
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Doug');
        });
      });

      it('can $lt', () => {
        const params = {
          query: {
            age: {
              $lt: 30
            }
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
        });
      });

      it('can $lte', () => {
        const params = {
          query: {
            age: {
              $lte: 25
            }
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
        });
      });

      it('can $gt', () => {
        const params = {
          query: {
            age: {
              $gt: 30
            }
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
        });
      });

      it('can $gte', () => {
        const params = {
          query: {
            age: {
              $gte: 25
            }
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
        });
      });

      it('can $ne', () => {
        const params = {
          query: {
            age: {
              $ne: 25
            }
          }
        };

        return people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
        });
      });
    });

    it.skip('can handle complex nested special queries', () => {
      const params = {
        query: {
          $or: [
            {
              name: 'Doug'
            },
            {
              age: {
                $gte: 18,
                $not: 25
              }
            }
          ]
        }
      };

      return people.find(params, (error, data) => {
        expect(!error).to.be.ok;
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(2);
      });
    });

    describe('paginate', function() {
      before(() => people.paginate = { default: 1, max: 2 });

      after(() => people.paginate = {});

      it('returns paginated object, paginates by default and shows total', () => {
        return people.find().then(paginator => {
          expect(paginator.total).to.equal(3);
          expect(paginator.limit).to.equal(1);
          expect(paginator.skip).to.equal(0);
          expect(paginator.data[0].name).to.equal('Doug');
        });
      });

      it('paginates max and skips', () => {
        return people.find({ query: { $skip: 1, $limit: 4 } }).then(paginator => {
          expect(paginator.total).to.equal(3);
          expect(paginator.limit).to.equal(2);
          expect(paginator.skip).to.equal(1);
          expect(paginator.data[0].name).to.equal('Bob');
          expect(paginator.data[1].name).to.equal('Alice');
        });
      });

      it('allows to override paginate in params', () => {
        return people.find({ paginate: { default: 2 } }).then(paginator => {
          expect(paginator.limit).to.equal(2);
          expect(paginator.skip).to.equal(0);
          return people.find({ paginate: false }).then(results =>
            expect(results.length).to.equal(3)
          );
        });
      });
    });
  });

  describe('update', () => {
    it('replaces an existing instance, does not modify original data', () => {
      const originalData = { [idProp]: _ids.Doug, name: 'Dougler' };
      const originalCopy = Object.assign({}, originalData);

      return people.update(_ids.Doug, originalData).then(data => {
        expect(originalData).to.deep.equal(originalCopy);
        expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
        expect(data.name).to.equal('Dougler');
        expect(!data.age).to.be.ok;
      });
    });

    it('returns NotFound error for non-existing id', () => {
      return people.update('568225fbfe21222432e836ff', { name: 'NotFound' })
        .catch(error => {
          expect(error).to.be.ok;
          expect(error instanceof errors.NotFound).to.be.ok;
          expect(error.message).to.equal('No record found for id \'568225fbfe21222432e836ff\'');
        });
    });
  });

  describe('patch', () => {
    it('updates an existing instance, does not modify original data', () => {
      const originalData = { [idProp]: _ids.Doug, name: 'PatchDoug' };
      const originalCopy = Object.assign({}, originalData);

      return people.patch(_ids.Doug, originalData).then(data => {
        expect(originalData).to.deep.equal(originalCopy);
        expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
        expect(data.name).to.equal('PatchDoug');
        expect(data.age).to.equal(32);
      });
    });

    it('patches multiple instances', () => {
      return people.create({ name: 'Dave', age: 29, created: true }).then(() =>
        people.create({ name: 'David', age: 3, created: true })
      ).then(() =>
        people.patch(null, { age: 2 }, { query: { created: true } })
      ).then(data => {
        expect(data[0].age).to.equal(2);
        expect(data[1].age).to.equal(2);
      });
    });

    it('returns NotFound error for non-existing id', () => {
      return people.patch('568225fbfe21222432e836ff', { name: 'PatchDoug' })
        .then(() => { throw new Error('Should never get here'); })
        .catch(error => {
          expect(error).to.be.ok;
          expect(error instanceof errors.NotFound).to.be.ok;
          expect(error.message).to.equal('No record found for id \'568225fbfe21222432e836ff\'');
        });
    });
  });

  describe('create', () => {
    it('creates a single new instance and returns the created instance', () => {
      const originalData = {
        name: 'Bill',
        age: 40
      };
      const originalCopy = Object.assign({}, originalData);

      return people.create(originalData).then(data => {
        expect(originalData).to.deep.equal(originalCopy);
        expect(data).to.be.instanceof(Object);
        expect(data).to.not.be.empty;
        expect(data.name).to.equal('Bill');
      });
    });

    it('creates multiple new instances', () => {
      const items = [
        {
          name: 'Gerald',
          age: 18
        },
        {
          name: 'Herald',
          age: 18
        }
      ];

      return people.create(items).then(data => {
        expect(data).to.not.be.empty;
        expect(data[0].name).to.equal('Gerald');
        expect(data[1].name).to.equal('Herald');
      });
    });
  });

  describe('Services don\'t call public methods internally', () => {
    // If any of the public methods are called the test fails
    let throwing = people.extend({
      find() {
        throw new Error('find method called');
      },
      get() {
        throw new Error('get method called');
      },
      create() {
        throw new Error('create method called');
      },
      update() {
        throw new Error('update method called');
      },
      patch() {
        throw new Error('patch method called');
      },
      remove() {
        throw new Error('remove method called');
      }
    });

    it('find', () => people.find.call(throwing));

    it('get', () => people.get.call(throwing, _ids.Doug));

    it('create', () => people.create.call(throwing, {
        name: 'Bob',
        age: 25
      })
      // .remove isn't tested here
      .then(bob => people.remove(bob[idProp].toString()))
    );

    it('update', () =>
      people.update.call(throwing, _ids.Doug, { name: 'Dougler' })
    );

    it('patch', () =>
      people.patch.call(throwing, _ids.Doug, { name: 'PatchDoug' })
    );

    it('remove', () => people.remove.call(throwing, _ids.Doug));
  });
}
