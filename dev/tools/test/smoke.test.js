'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const { loadDocument } = require('../src/loader');
const { assertOpenApi3 } = require('../src/validator');
const { optimize } = require('../src/optimizer');
const { standardize } = require('../src/standardizer');
const { toYaml } = require('../src/emitter');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const REAL_FILES = [
  {
    label: 'resources 6.1',
    input: path.join(REPO_ROOT, 'api-specifications', 'resources', '6.1.json'),
    kind: 'resources',
    version: '6.1.0',
  },
  {
    label: 'descriptors 6.1',
    input: path.join(REPO_ROOT, 'api-specifications', 'descriptors', '6.1.json'),
    kind: 'descriptors',
    version: '6.1.0',
  },
];

/**
 * Recursively walks `node` and collects every "$ref" string found.
 */
function collectRefs(node, refs) {
  if (Array.isArray(node)) {
    for (const item of node) collectRefs(item, refs);
    return;
  }
  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string') {
        refs.push(value);
      } else {
        collectRefs(value, refs);
      }
    }
  }
}

/**
 * Resolves a local "#/a/b/c" JSON pointer against `doc`, returning true if
 * it points at something that actually exists.
 */
function refResolves(doc, ref) {
  if (!ref.startsWith('#/')) return true; // not a local ref; not our concern here
  const segments = ref
    .slice(2)
    .split('/')
    .map((s) => s.replace(/~1/g, '/').replace(/~0/g, '~'));
  let node = doc;
  for (const segment of segments) {
    if (node == null || typeof node !== 'object' || !(segment in node)) {
      return false;
    }
    node = node[segment];
  }
  return true;
}

for (const { label, input, kind, version } of REAL_FILES) {
  test(`smoke: ${label} raw export produces a valid, optimized spec`, { skip: !fs.existsSync(input) }, async () => {
    const raw = await loadDocument(input);
    assertOpenApi3(raw);

    const naiveStandardized = JSON.parse(JSON.stringify(raw));
    standardize(naiveStandardized, { kind, version });
    const naiveSize = Buffer.byteLength(JSON.stringify(naiveStandardized), 'utf8');

    const { doc: optimizedDoc } = optimize(raw, { minHoistCount: 3 });
    standardize(optimizedDoc, { kind, version });

    const yamlText = toYaml(optimizedDoc);

    // Output is valid YAML (js-yaml ignores the leading '#' license comment lines).
    const roundTripped = yaml.load(yamlText);
    assert.ok(roundTripped);

    // No servers key survives.
    assert.equal(Object.prototype.hasOwnProperty.call(roundTripped, 'servers'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(optimizedDoc, 'servers'), false);

    // info.title/info.version reflect what was requested.
    assert.equal(optimizedDoc.info.version, version);
    assert.ok(optimizedDoc.info.title.includes(version.split('.').slice(0, 2).join('.')));

    // At least one hoisted response and one hoisted parameter exist.
    assert.ok(
      Object.keys(optimizedDoc.components.responses || {}).length > 0,
      'expected at least one hoisted response component'
    );
    assert.ok(
      Object.keys(optimizedDoc.components.parameters || {}).length > 0,
      'expected at least one hoisted parameter component'
    );

    // No dangling $refs anywhere in the document.
    const refs = [];
    collectRefs(optimizedDoc, refs);
    const dangling = refs.filter((ref) => !refResolves(optimizedDoc, ref));
    assert.deepEqual(dangling, [], `found dangling $refs: ${dangling.join(', ')}`);

    // Meaningful byte-size reduction vs. a naive (standardized-but-unoptimized) dump.
    const optimizedSize = Buffer.byteLength(JSON.stringify(optimizedDoc), 'utf8');
    assert.ok(
      optimizedSize < naiveSize,
      `expected optimized size (${optimizedSize}) < naive size (${naiveSize})`
    );
  });
}
