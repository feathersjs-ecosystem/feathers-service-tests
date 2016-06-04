/*jshint expr: true*/

import { expect } from 'chai';

export default function common(people, _ids, errors, idProp = 'id') {
  describe('extend', () => {
    it('extends and uses extended method', done => {
      let now = new Date().getTime();
      let extended = people.extend({
        create(data) {
          data.time = now;
          return this._super.apply(this, arguments);
        }
      });

      extended.create({ name: 'Dave' }).then(data => {
        return extended.remove(data[idProp]);
      }).then(data => {
        expect(data.time).to.equal(now);
        done();
      }).catch(done);
    });
  });

  describe('get', () => {
    it('returns an instance that exists', done => {
      people.get(_ids.Doug).then(data => {
        expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
        expect(data.name).to.equal('Doug');
        done();
      }).catch(done);
    });

    it('returns NotFound error for non-existing id', done => {
      people.get('568225fbfe21222432e836ff').catch(error => {
        expect(error instanceof errors.NotFound).to.be.ok;
        expect(error.message).to.equal('No record found for id \'568225fbfe21222432e836ff\'');
        done();
      });
    });
  });

  describe('remove', () => {
    it('deletes an existing instance and returns the deleted instance', done => {
      people.remove(_ids.Doug).then(data => {
        expect(data).to.be.ok;
        expect(data.name).to.equal('Doug');
        done();
      }).catch(done);
    });

    it('deletes multiple instances', done => {
      people.create({ name: 'Dave', age: 29, created: true }).then(() => {
        return people.create({ name: 'David', age: 3, created: true });
      }).then(() => {
        return people.remove(null, { query: { created: true } });
      }).then(data => {
        expect(data.length).to.equal(2);
        let names = data.map(person => person.name);
        expect(names.indexOf('Dave')).to.be.above(-1);
        expect(names.indexOf('David')).to.be.above(-1);
        done();
      }).catch(done);
    });
  });

  describe('find', () => {
    beforeEach(done => {
      people.create({
        name: 'Bob',
        age: 25
      }).then(bob => {
        _ids.Bob = bob[idProp].toString();

        return people.create({
          name: 'Alice',
          age: 19
        });
      }).then(alice => {
        _ids.Alice = alice[idProp].toString();
        done();
      }).catch(done);
    });

    afterEach(done => {
      people.remove(_ids.Bob).then(() => {
        return people.remove(_ids.Alice);
      }).then(() => done()).catch(done);
    });

    it('returns all items', done => {
      people.find().then(data => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(3);
        done();
      }).catch(done);
    });

    it('filters results by a single parameter', done => {
      var params = { query: { name: 'Alice' } };

      people.find(params).then(data => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(1);
        expect(data[0].name).to.equal('Alice');
        done();
      }).catch(done);
    });

    it('filters results by multiple parameters', done => {
      var params = { query: { name: 'Alice', age: 19 } };

      people.find(params).then(data => {
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(1);
        expect(data[0].name).to.equal('Alice');
        done();
      }).catch(done);
    });

    describe('special filters', ()  => {
      it('can $sort', done => {
        var params = {
          query: {
            $sort: {name: 1}
          }
        };

        people.find(params).then(data => {
          expect(data.length).to.equal(3);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Bob');
          expect(data[2].name).to.equal('Doug');
          done();
        }).catch(done);
      });

      it('can $limit', done => {
        var params = {
          query: {
            $limit: 2
          }
        };

        people.find(params).then(data => {
          expect(data.length).to.equal(2);
          done();
        }).catch(done);
      });

      it('can $skip', done => {
        var params = {
          query: {
            $sort: {name: 1},
            $skip: 1
          }
        };

        people.find(params).then(data => {
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Bob');
          expect(data[1].name).to.equal('Doug');
          done();
        }).catch(done);
      });

      it('can $select', done => {
        var params = {
          query: {
            name: 'Alice',
            $select: ['name']
          }
        };

        people.find(params).then(data => {
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Alice');
          expect(data[0].age).to.be.undefined;
          done();
        }).catch(done);
      });

      it('can $or', done => {
        var params = {
          query: {
            $or: [
              { name: 'Alice' },
              { name: 'Bob' }
            ],
            $sort: {name: 1}
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Bob');
          done();
        }).catch(done);
      });

      it.skip('can $not', done => {
        var params = {
          query: {
            age: { $not: 19 },
            name: { $not: 'Doug' }
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Bob');
          done();
        }, done);
      });

      it('can $in', done => {
        var params = {
          query: {
            name: {
              $in: ['Alice', 'Bob']
            },
            $sort: {name: 1}
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Bob');
          done();
        }).catch(done);
      });

      it('can $nin', done => {
        var params = {
          query: {
            name: {
              $nin: ['Alice', 'Bob']
            }
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Doug');
          done();
        }).catch(done);
      });

      it('can $lt', done => {
        var params = {
          query: {
            age: {
              $lt: 30
            }
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          done();
        }).catch(done);
      });

      it('can $lte', done => {
        var params = {
          query: {
            age: {
              $lte: 25
            }
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          done();
        }).catch(done);
      });

      it('can $gt', done => {
        var params = {
          query: {
            age: {
              $gt: 30
            }
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          done();
        }).catch(done);
      });

      it('can $gte', done => {
        var params = {
          query: {
            age: {
              $gte: 25
            }
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          done();
        }).catch(done);
      });

      it('can $ne', done => {
        var params = {
          query: {
            age: {
              $ne: 25
            }
          }
        };

        people.find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(2);
          done();
        }).catch(done);
      });

      it.skip('can $populate', done => {
        // expect(service).to.throw('No table name specified.');
        done();
      });
    });

    it.skip('can handle complex nested special queries', done => {
      var params = {
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

      people.find(params, (error, data) => {
        expect(!error).to.be.ok;
        expect(data).to.be.instanceof(Array);
        expect(data.length).to.equal(2);
        done();
      });
    });

    describe('paginate', function() {
      before(() => {
        people.paginate = { default: 1, max: 2 };
      });

      after(() => {
        people.paginate = {};
      });

      it('returns paginated object, paginates by default and shows total', done => {
        people.find().then(paginator => {
          expect(paginator.total).to.equal(3);
          expect(paginator.limit).to.equal(1);
          expect(paginator.skip).to.equal(0);
          expect(paginator.data[0].name).to.equal('Doug');
          done();
        }).catch(done);
      });

      it('paginates max and skips', done => {
        people.find({ query: { $skip: 1, $limit: 4 } }).then(paginator => {
          expect(paginator.total).to.equal(3);
          expect(paginator.limit).to.equal(2);
          expect(paginator.skip).to.equal(1);
          expect(paginator.data[0].name).to.equal('Bob');
          expect(paginator.data[1].name).to.equal('Alice');
          done();
        }).catch(done);
      });
    });
  });

  describe('update', () => {
    it('replaces an existing instance', done => {
      people.update(_ids.Doug, { name: 'Dougler' }).then(data => {
        expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
        expect(data.name).to.equal('Dougler');
        expect(!data.age).to.be.ok;
        done();
      }).catch(done);
    });

    it('returns NotFound error for non-existing id', done => {
      people.update('568225fbfe21222432e836ff', { name: 'NotFound' }).then(done, error => {
        expect(error).to.be.ok;
        expect(error instanceof errors.NotFound).to.be.ok;
        expect(error.message).to.equal('No record found for id \'568225fbfe21222432e836ff\'');
        done();
      });
    });
  });

  describe('patch', () => {
    it('updates an existing instance', done => {
      people.patch(_ids.Doug, { name: 'PatchDoug' }).then(data => {
        expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
        expect(data.name).to.equal('PatchDoug');
        expect(data.age).to.equal(32);
        done();
      }).catch(done);
    });

    it('patches multiple instances', done => {
      people.create({ name: 'Dave', age: 29, created: true }).then(() => {
        return people.create({ name: 'David', age: 3, created: true });
      }).then(() => {
        return people.patch(null, { age: 2 }, { query: { created: true } });
      }).then(data => {
        expect(data[0].age).to.equal(2);
        expect(data[1].age).to.equal(2);
        done();
      }).catch(done);
    });

    it('returns NotFound error for non-existing id', done => {
      people.patch('568225fbfe21222432e836ff', { name: 'PatchDoug' }).then(done, error => {
        expect(error).to.be.ok;
        expect(error instanceof errors.NotFound).to.be.ok;
        expect(error.message).to.equal('No record found for id \'568225fbfe21222432e836ff\'');
        done();
      });
    });
  });

  describe('create', () => {
    it('creates a single new instance and returns the created instance', done => {
      people.create({
        name: 'Bill',
        age: 40
      }).then(data => {
        expect(data).to.be.instanceof(Object);
        expect(data).to.not.be.empty;
        expect(data.name).to.equal('Bill');
        done();
      }).catch(done);
    });

    it('creates multiple new instances', done => {
      let items = [
        {
          name: 'Gerald',
          age: 18
        },
        {
          name: 'Herald',
          age: 18
        }
      ];

      people.create(items).then(data => {
        expect(data).to.not.be.empty;
        expect(data[0].name).to.equal('Gerald');
        expect(data[1].name).to.equal('Herald');
        done();
      }).catch(done);
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

    it('find', () => {
      return people.find.call(throwing);
    });

    it('get', () => {
      return people.get.call(throwing, _ids.Doug);
    });

    it('create', () => {
      return people.create.call(throwing, {
        name: 'Bob',
        age: 25
      }).then(bob => {
        // .remove isn't tested here
        return people.remove(bob[idProp].toString());
      });
    });

    it('update', () => {
      return people.update.call(throwing, _ids.Doug, { name: 'Dougler' });
    });

    it('patch', () => {
      return people.patch.call(throwing, _ids.Doug, { name: 'PatchDoug' });
    });

    it('remove', () => {
      return people.remove.call(throwing, _ids.Doug);
    });
  });
}
