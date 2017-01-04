import { expect } from 'chai';
import request from 'request-promise';

export default function (idProp = 'id', url = 'http://localhost:3030/todos') {
  let firstId;

  it('POST', () => {
    let body = { text: 'first todo', complete: false };

    return request.post({ url, json: true, body })
      .then(todo => {
        let body = { text: 'second todo', complete: false };

        firstId = todo[idProp];
        expect(todo[idProp]).to.exist;
        expect(todo.text).to.equal('first todo');

        return request.post({ url, json: true, body });
      })
      .then(todo => {
        let body = { text: 'third todo', complete: false };

        expect(todo.text).to.equal('second todo');

        return request.post({ url, json: true, body });
      })
      .then(todo => expect(todo.text).to.equal('third todo'));
  });

  describe('GET /', () => {
    it('GET / with default pagination', () => {
      return request({
        url,
        json: true,
        qs: { $sort: { text: 1 } }
      }).then(page => {
        expect(page.total).to.equal(3);
        expect(page.limit).to.equal(2);
        expect(page.skip).to.equal(0);
        expect(page.data.length).to.equal(2);
        expect(page.data[0].text).to.equal('first todo');
        expect(page.data[1].text).to.equal('second todo');
      });
    });

    it('GET / with skip', () => {
      return request({
        url,
        json: true,
        qs: { $skip: 2, $sort: { text: 1 } }
      }).then(page => {
        expect(page.total).to.equal(3);
        expect(page.limit).to.equal(2);
        expect(page.skip).to.equal(2);
        expect(page.data.length).to.equal(1);
        expect(page.data[0].text).to.equal('third todo');
      });
    });

    it('GET / with filter', () => {
      return request({
        url,
        json: true,
        qs: { text: 'second todo' }
      }).then(page => {
        expect(page.total).to.equal(1);
        expect(page.limit).to.equal(2);
        expect(page.skip).to.equal(0);
        expect(page.data.length).to.equal(1);
        expect(page.data[0].text).to.equal('second todo');
      });
    });
  });

  it('GET /id', () => {
    return request({ url: `${url}/${firstId}`, json: true })
      .then(todo => {
        expect(todo[idProp]).to.equal(firstId);
        expect(todo.text).to.equal('first todo');
      });
  });

  it('PATCH', () => {
    return request.patch({
      url: `${url}/${firstId}`,
      json: true,
      body: { complete: true }
    }).then(todo => {
      expect(todo[idProp]).to.equal(firstId);
      expect(todo.text).to.equal('first todo');
      expect(todo.complete).to.be.ok;
    });
  });

  it('DELETE /id', () => {
    return request.post({
      url,
      json: true,
      body: { text: 'to delete', complete: false }
    }).then(todo =>
      request.del({ url: `${url}/${todo[idProp]}`, json: true })
        .then(todo => expect(todo.text).to.equal('to delete'))
    );
  });
}
