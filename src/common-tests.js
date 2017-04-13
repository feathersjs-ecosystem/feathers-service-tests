/* eslint-disable no-unused-expressions */

import { expect } from 'chai';

function common (app, errors, serviceName = 'people', idProp = 'id') {
  describe(`Common tests, ${serviceName} service with` +
      ` '${idProp}' id property`, () => {
    const _ids = {};

    beforeEach(() =>
      app.service(serviceName).create({
        name: 'Doug',
        age: 32
      }).then(data => (_ids.Doug = data[idProp]))
    );

    afterEach(() =>
      app.service(serviceName).remove(_ids.Doug).catch(() => {})
    );

    it('sets `id` property on the service', () =>
      expect(app.service(serviceName).id).to.equal(idProp)
    );

    it('sets `events` property from options', () =>
      expect(app.service(serviceName).events.indexOf('testing'))
        .to.not.equal(-1)
    );

    describe('extend', () => {
      it('extends and uses extended method', () => {
        let now = new Date().getTime();
        let extended = app.service(serviceName).extend({
          create (data) {
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
        return app.service(serviceName).get(_ids.Doug).then(data => {
          expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
          expect(data.name).to.equal('Doug');
          expect(data.age).to.equal(32);
        });
      });

      it('supports $select', () => {
        return app.service(serviceName).get(_ids.Doug, {
          query: { $select: [ 'name' ] }
        }).then(data => {
          expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
          expect(data.name).to.equal('Doug');
          expect(data.age).to.not.exist;
        });
      });

      it('returns NotFound error for non-existing id', () => {
        return app.service(serviceName).get('568225fbfe21222432e836ff')
          .catch(error => {
            expect(error instanceof errors.NotFound).to.be.ok;
            expect(error.message).to.equal('No record found for id \'568225fbfe21222432e836ff\'');
          });
      });
    });

    describe('remove', () => {
      it('deletes an existing instance and returns the deleted instance', () => {
        return app.service(serviceName).remove(_ids.Doug).then(data => {
          expect(data).to.be.ok;
          expect(data.name).to.equal('Doug');
        });
      });

      it('deletes an existing instance supports $select', () => {
        return app.service(serviceName).remove(_ids.Doug, {
          query: { $select: [ 'name' ] }
        }).then(data => {
          expect(data).to.be.ok;
          expect(data.name).to.equal('Doug');
          expect(data.age).to.not.exist;
        });
      });

      it('deletes multiple instances', () => {
        return app.service(serviceName).create({ name: 'Dave', age: 29, created: true })
          .then(() => app.service(serviceName).create({
            name: 'David',
            age: 3,
            created: true
          }))
          .then(() => app.service(serviceName).remove(null, {
            query: { created: true }
          }))
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
        return app.service(serviceName).create({
          name: 'Bob',
          age: 25
        }).then(bob => {
          _ids.Bob = bob[idProp].toString();

          return app.service(serviceName).create({
            name: 'Alice',
            age: 19
          });
        }).then(alice => (_ids.Alice = alice[idProp].toString()));
      });

      afterEach(() =>
        app.service(serviceName)
          .remove(_ids.Bob)
          .then(() => app.service(serviceName)
          .remove(_ids.Alice))
      );

      it('returns all items', () => {
        return app.service(serviceName).find().then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(3);
        });
      });

      it('filters results by a single parameter', () => {
        const params = { query: { name: 'Alice' } };

        return app.service(serviceName).find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Alice');
        });
      });

      it('filters results by multiple parameters', () => {
        const params = { query: { name: 'Alice', age: 19 } };

        return app.service(serviceName).find(params).then(data => {
          expect(data).to.be.instanceof(Array);
          expect(data.length).to.equal(1);
          expect(data[0].name).to.equal('Alice');
        });
      });

      describe('special filters', () => {
        it('can $sort', () => {
          const params = {
            query: {
              $sort: {name: 1}
            }
          };

          return app.service(serviceName).find(params).then(data => {
            expect(data.length).to.equal(3);
            expect(data[0].name).to.equal('Alice');
            expect(data[1].name).to.equal('Bob');
            expect(data[2].name).to.equal('Doug');
          });
        });

        it('can $sort with strings', () => {
          const params = {
            query: {
              $sort: { name: '1' }
            }
          };

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params)
            .then(data => expect(data.length).to.equal(2));
        });

        it('can $limit 0', () => {
          const params = {
            query: {
              $limit: 0
            }
          };

          return app.service(serviceName).find(params)
            .then(data => expect(data.length).to.equal(0));
        });

        it('can $skip', () => {
          const params = {
            query: {
              $sort: {name: 1},
              $skip: 1
            }
          };

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
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

          return app.service(serviceName).find(params).then(data => {
            expect(data).to.be.instanceof(Array);
            expect(data.length).to.equal(2);
          });
        });
      });

      it('can $gt and $lt and $sort', () => {
        const params = {
          query: {
            age: {
              $gt: 18,
              $lt: 30
            },
            $sort: { name: 1 }
          }
        };

        return app.service(serviceName).find(params).then(data => {
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Bob');
        });
      });

      it('can handle nested $or queries and $sort', () => {
        const params = {
          query: {
            $or: [
              { name: 'Doug' },
              {
                age: {
                  $gte: 18,
                  $lt: 25
                }
              }
            ],
            $sort: { name: 1 }
          }
        };

        return app.service(serviceName).find(params).then(data => {
          expect(data.length).to.equal(2);
          expect(data[0].name).to.equal('Alice');
          expect(data[1].name).to.equal('Doug');
        });
      });

      describe('paginate', function () {
        beforeEach(() =>
          (app.service(serviceName).paginate = { default: 1, max: 2 })
        );

        afterEach(() => (app.service(serviceName).paginate = {}));

        it('returns paginated object, paginates by default and shows total', () => {
          return app.service(serviceName)
            .find({ query: { $sort: { name: -1 } } })
            .then(paginator => {
              expect(paginator.total).to.equal(3);
              expect(paginator.limit).to.equal(1);
              expect(paginator.skip).to.equal(0);
              expect(paginator.data[0].name).to.equal('Doug');
            });
        });

        it('paginates max and skips', () => {
          const params = {
            query: {
              $skip: 1,
              $limit: 4,
              $sort: { name: -1 }
            }
          };

          return app.service(serviceName).find(params).then(paginator => {
            expect(paginator.total).to.equal(3);
            expect(paginator.limit).to.equal(2);
            expect(paginator.skip).to.equal(1);
            expect(paginator.data[0].name).to.equal('Bob');
            expect(paginator.data[1].name).to.equal('Alice');
          });
        });

        it('$limit 0 with pagination', () => {
          return app.service(serviceName).find({ query: { $limit: 0 } })
            .then(paginator => expect(paginator.data.length).to.equal(0));
        });

        it('allows to override paginate in params', () => {
          return app.service(serviceName)
            .find({ paginate: { default: 2 } })
            .then(paginator => {
              expect(paginator.limit).to.equal(2);
              expect(paginator.skip).to.equal(0);

              return app.service(serviceName)
                .find({ paginate: false })
                .then(results => expect(results.length).to.equal(3));
            });
        });
      });
    });

    describe('update', () => {
      it('replaces an existing instance, does not modify original data', () => {
        const originalData = { [idProp]: _ids.Doug, name: 'Dougler' };
        const originalCopy = Object.assign({}, originalData);

        return app.service(serviceName).update(_ids.Doug, originalData)
          .then(data => {
            expect(originalData).to.deep.equal(originalCopy);
            expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
            expect(data.name).to.equal('Dougler');
            expect(!data.age).to.be.ok;
          });
      });

      it('replaces an existing instance, supports $select', () => {
        const originalData = {
          [idProp]: _ids.Doug,
          name: 'Dougler',
          age: 10
        };

        return app.service(serviceName).update(_ids.Doug, originalData, {
          query: { $select: [ 'name' ] }
        }).then(data => {
          expect(data.name).to.equal('Dougler');
          expect(data.age).to.not.exist;
        });
      });

      it('returns NotFound error for non-existing id', () => {
        return app.service(serviceName)
          .update('568225fbfe21222432e836ff', { name: 'NotFound' })
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

        return app.service(serviceName).patch(_ids.Doug, originalData)
          .then(data => {
            expect(originalData).to.deep.equal(originalCopy);
            expect(data[idProp].toString()).to.equal(_ids.Doug.toString());
            expect(data.name).to.equal('PatchDoug');
            expect(data.age).to.equal(32);
          });
      });

      it('updates an existing instance, supports $select', () => {
        const originalData = { [idProp]: _ids.Doug, name: 'PatchDoug' };

        return app.service(serviceName).patch(_ids.Doug, originalData, {
          query: { $select: [ 'name' ] }
        }).then(data => {
          expect(data.name).to.equal('PatchDoug');
          expect(data.age).to.not.exist;
        });
      });

      it('patches multiple instances', () => {
        const service = app.service(serviceName);
        const params = {
          query: { created: true }
        };

        return service.create({
          name: 'Dave',
          age: 29,
          created: true
        }).then(() =>
          service.create({
            name: 'David',
            age: 3,
            created: true
          })
        ).then(() =>
          service.patch(null, {
            age: 2
          }, params
        )).then(data => {
          expect(data.length).to.equal(2);
          expect(data[0].age).to.equal(2);
          expect(data[1].age).to.equal(2);
        }).then(() => service.remove(null, params));
      });

      it('patches multiple instances and returns the actually changed items', () => {
        const service = app.service(serviceName);
        const params = {
          query: { age: { $lt: 10 } }
        };

        return service.create({
          name: 'Dave',
          age: 8,
          created: true
        }).then(() =>
          service.create({
            name: 'David',
            age: 4,
            created: true
          })
        ).then(() =>
          service.patch(null, {
            age: 2
          }, params
        )).then(data => {
          expect(data.length).to.equal(2);
          expect(data[0].age).to.equal(2);
          expect(data[1].age).to.equal(2);
        }).then(() => service.remove(null, params));
      });

      it('patches multiple, returns correct items', () => {
        const service = app.service(serviceName);

        return service.create([{
          name: 'Dave',
          age: 2,
          created: true
        }, {
          name: 'David',
          age: 2,
          created: true
        }, {
          name: 'D',
          age: 8,
          created: true
        }
        ]).then(() =>
          service.patch(null, {
            age: 8
          }, { query: { age: 2 } }
        )).then(data => {
          expect(data.length).to.equal(2);
          expect(data[0].age).to.equal(8);
          expect(data[1].age).to.equal(8);
        }).then(() => service.remove(null, {
          query: { age: 8 }
        }));
      });

      it('returns NotFound error for non-existing id', () => {
        return app.service(serviceName)
          .patch('568225fbfe21222432e836ff', { name: 'PatchDoug' })
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

        return app.service(serviceName).create(originalData).then(data => {
          expect(originalData).to.deep.equal(originalCopy);
          expect(data).to.be.instanceof(Object);
          expect(data).to.not.be.empty;
          expect(data.name).to.equal('Bill');
        });
      });

      it('creates a single new instance, supports $select', () => {
        const originalData = {
          name: 'William',
          age: 23
        };

        return app.service(serviceName).create(originalData, {
          query: { $select: [ 'name' ] }
        }).then(data => {
          expect(data.name).to.equal('William');
          expect(data.age).to.not.exist;
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

        return app.service(serviceName).create(items).then(data => {
          expect(data).to.not.be.empty;
          expect(Array.isArray(data)).to.equal(true);
          expect(typeof data[0][idProp]).to.not.equal('undefined');
          expect(data[0].name).to.equal('Gerald');
          expect(typeof data[1][idProp]).to.not.equal('undefined');
          expect(data[1].name).to.equal('Herald');
        });
      });
    });

    describe('Services don\'t call public methods internally', () => {
      let throwing;

      before(() => {
        throwing = app.service(serviceName).extend({
          get store () {
            return app.service(serviceName).store;
          },

          find () {
            throw new Error('find method called');
          },
          get () {
            throw new Error('get method called');
          },
          create () {
            throw new Error('create method called');
          },
          update () {
            throw new Error('update method called');
          },
          patch () {
            throw new Error('patch method called');
          },
          remove () {
            throw new Error('remove method called');
          }
        });
      });

      it('find', () => app.service(serviceName).find.call(throwing));

      it('get', () =>
        app.service(serviceName).get.call(throwing, _ids.Doug)
      );

      it('create', () => app.service(serviceName)
        .create.call(throwing, {
          name: 'Bob',
          age: 25
        })
      );

      it('update', () =>
        app.service(serviceName).update.call(throwing, _ids.Doug, {
          name: 'Dougler'
        })
      );

      it('patch', () =>
        app.service(serviceName).patch.call(throwing, _ids.Doug, {
          name: 'PatchDoug'
        })
      );

      it('remove', () =>
        app.service(serviceName).remove.call(throwing, _ids.Doug)
      );
    });
  });
}

export default common;
