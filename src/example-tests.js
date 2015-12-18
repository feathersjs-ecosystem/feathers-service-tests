/*jshint expr: true*/

import { expect } from 'chai';
import request from 'request-promise';

export default function(idProp = 'id', url = 'http://localhost:3030/todos') {
  let firstId;

  it('POST', done => {
    let body = { text: 'first todo', complete: false };

    request.post({ url, json: true, body }).then(todo => {
      let body = { text: 'second todo', complete: false };

      firstId = todo[idProp];
      expect(todo[idProp]).to.exist;
      expect(todo.text).to.equal('first todo');

      return request.post({ url, json: true, body });
    }).then(todo => {
      let body = { text: 'third todo', complete: false };

      expect(todo.text).to.equal('second todo');

      return request.post({ url, json: true, body });
    }).then(todo => {
      expect(todo.text).to.equal('third todo');
      done();
    }).catch(done);
  });

  describe('GET /', () => {
    it('GET / with default pagination', done => {
      request({ url, json: true }).then(page => {
        expect(page.total).to.equal(3);
        expect(page.limit).to.equal(2);
        expect(page.skip).to.equal(0);
        expect(page.data.length).to.equal(2);
        expect(page.data[0].text).to.equal('first todo');
        expect(page.data[1].text).to.equal('second todo');
        done();
      }).catch(done);
    });

    it('GET / with skip', done => {
      request({
        url,
        json: true,
        qs: { $skip: 2 }
      }).then(page => {
        expect(page.total).to.equal(3);
        expect(page.limit).to.equal(2);
        expect(page.skip).to.equal(2);
        expect(page.data.length).to.equal(1);
        expect(page.data[0].text).to.equal('third todo');
        done();
      }).catch(done);
    });

    it('GET / with filter', done => {
      request({
        url,
        json: true,
        qs: { text: 'second todo' }
      }).then(page => {
        expect(page.total).to.equal(1);
        expect(page.limit).to.equal(2);
        expect(page.skip).to.equal(0);
        expect(page.data.length).to.equal(1);
        expect(page.data[0].text).to.equal('second todo');
        done();
      }).catch(done);
    });
  });

  it('GET /id', done => {
    request({ url: `${url}/${firstId}`, json: true }).then(todo => {
      expect(todo[idProp]).to.equal(firstId);
      expect(todo.text).to.equal('first todo');
      done();
    }).catch(done);
  });

  it('PATCH', done => {
    request.patch({
      url: `${url}/${firstId}`,
      json: true,
      body: { complete: true }
    }).then(todo => {
      expect(todo[idProp]).to.equal(firstId);
      expect(todo.text).to.equal('first todo');
      expect(todo.complete).to.be.ok;
      done();
    }).catch(done);
  });

  it('DELETE /id', done => {
    request.post({
      url,
      json: true,
      body: { text: 'to delete', complete : false }
    }).then(todo => {
      return request.del({ url: `${url}/${todo[idProp]}`, json: true }).then(todo => {
        expect(todo.text).to.equal('to delete');
        done();
      });
    }).catch(done);
  });
}
