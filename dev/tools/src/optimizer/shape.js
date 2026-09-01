'use strict';

/**
 * Produces a stable, key-order-independent string representation of a
 * JSON-compatible value, suitable for deep-equality grouping (e.g. via a
 * Map keyed on this string).
 *
 * Object keys are sorted recursively so that two objects with the same
 * key/value pairs in different insertion order canonicalize identically.
 * Array order is NOT changed, because array order is semantically
 * meaningful in OpenAPI documents (e.g. `required` lists, `enum` values).
 *
 * @param {*} value
 * @returns {string}
 */
function canonicalKey(value) {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const sortedKeys = Object.keys(value).sort();
    const result = {};
    for (const key of sortedKeys) {
      result[key] = canonicalize(value[key]);
    }
    return result;
  }
  return value;
}

/**
 * Looks for an existing component in `components` (a plain object such as
 * doc.components.responses or doc.components.parameters) whose canonical
 * shape matches `shapeCanonicalKey`. Returns its name, or null if none
 * matches. Used to avoid creating duplicate components for a shape that's
 * already represented under a different name.
 *
 * @param {object} components
 * @param {string} shapeCanonicalKey
 * @returns {string|null}
 */
function findReusableComponentName(components, shapeCanonicalKey) {
  for (const [name, value] of Object.entries(components)) {
    if (canonicalKey(value) === shapeCanonicalKey) {
      return name;
    }
  }
  return null;
}

module.exports = { canonicalKey, findReusableComponentName };
