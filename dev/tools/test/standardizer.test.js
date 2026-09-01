'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { standardize } = require('../src/standardizer');

function freshDoc() {
  return {
    openapi: '3.0.4',
    info: {
      title: 'Ed-Fi Operational Data Store API',
      description: 'generic app description',
      version: '3',
    },
    servers: [{ url: 'https://api.ed-fi.org:443/v7.3.2/api/data/v3' }],
    paths: {},
    components: {},
  };
}

test('standardize sets resources title/version/description and removes servers', () => {
  const doc = freshDoc();
  standardize(doc, { kind: 'resources', version: '6.1.0' });

  assert.equal(Object.prototype.hasOwnProperty.call(doc, 'servers'), false);
  assert.equal(doc.info.title, 'Ed-Fi Resource API (6.1)');
  assert.equal(doc.info.version, '6.1.0');
  assert.equal(
    doc.info.description,
    'The Ed-Fi Resources API enables applications to read and write education data stored in an Ed-Fi-compatible application through a secure REST interface.'
  );
});

test('standardize sets descriptors title/version/description (plural title) and removes servers', () => {
  const doc = freshDoc();
  standardize(doc, { kind: 'descriptors', version: '6.1.0' });

  assert.equal(Object.prototype.hasOwnProperty.call(doc, 'servers'), false);
  assert.equal(doc.info.title, 'Ed-Fi Descriptors API (6.1)');
  assert.equal(doc.info.version, '6.1.0');
  assert.equal(
    doc.info.description,
    'The Ed-Fi Descriptors API supports reading and modifying descriptors (enumeration sets) in an Ed-Fi API application.'
  );
});

test('standardize rejects an invalid kind', () => {
  const doc = freshDoc();
  assert.throws(() => standardize(doc, { kind: 'bogus', version: '6.1.0' }));
});

test('standardize rejects a malformed version', () => {
  const doc = freshDoc();
  assert.throws(() => standardize(doc, { kind: 'resources', version: '6.1' }));
});
