// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const { canonicalKey, findReusableComponentName } = require('./shape');

const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

// HTTP status code -> PascalCase reason phrase, used to derive component
// names for hoisted responses. Extend as new status codes appear in raw
// ODS/API exports.
const STATUS_NAME_MAP = {
  400: 'BadRequest',
  401: 'Unauthorized',
  402: 'PaymentRequired',
  403: 'Forbidden',
  404: 'NotFound',
  405: 'MethodNotAllowed',
  406: 'NotAcceptable',
  407: 'ProxyAuthenticationRequired',
  408: 'RequestTimeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'LengthRequired',
  412: 'PreconditionFailed',
  413: 'PayloadTooLarge',
  414: 'UriTooLong',
  415: 'UnsupportedMediaType',
  416: 'RangeNotSatisfiable',
  417: 'ExpectationFailed',
  422: 'UnprocessableEntity',
  423: 'Locked',
  428: 'PreconditionRequired',
  429: 'TooManyRequests',
  431: 'RequestHeaderFieldsTooLarge',
  500: 'Error',
  501: 'NotImplemented',
  502: 'BadGateway',
  503: 'ServiceUnavailable',
  504: 'GatewayTimeout',
};

// Ordered list of (pattern, suffix) used to derive a disambiguating
// qualifier from a response's description when the plain status-derived
// name is already taken by a different shape.
const DESCRIPTION_QUALIFIERS = [{ pattern: /snapshot/i, suffix: 'UseSnapshot' }];

function baseNameForStatus(statusCode) {
  return STATUS_NAME_MAP[Number(statusCode)] || `Status${statusCode}`;
}

function numericFallback(baseName, existingNames) {
  let i = 2;
  let candidate = `${baseName}${i}`;
  while (existingNames.has(candidate)) {
    i += 1;
    candidate = `${baseName}${i}`;
  }
  return { name: candidate, usedFallback: true, usedQualifier: false };
}

// Checks for a matching semantic qualifier *before* claiming the plain
// baseName. Otherwise, naming depends on discovery order: whichever shape
// (generic or snapshot-specific) is encountered first claims the plain
// name, and the other falls back to a numeric suffix -- e.g. reversing the
// order of two 404 shapes in the document would swap `NotFound` and
// `NotFound2`. Checking the qualifier first keeps a shape's derived name
// stable regardless of where it appears in the document.
function deriveName(baseName, shapeObj, existingNames) {
  const description = typeof shapeObj.description === 'string' ? shapeObj.description : '';
  const qualifier = DESCRIPTION_QUALIFIERS.find(({ pattern }) => pattern.test(description));

  if (qualifier) {
    const candidate = `${baseName}${qualifier.suffix}`;
    if (!existingNames.has(candidate)) {
      return { name: candidate, usedFallback: false, usedQualifier: true };
    }
    return numericFallback(baseName, existingNames);
  }

  if (!existingNames.has(baseName)) {
    return { name: baseName, usedFallback: false, usedQualifier: false };
  }

  return numericFallback(baseName, existingNames);
}

/**
 * Walks every HTTP-verb operation under doc.paths, groups inline non-200
 * response bodies by (statusCode, canonicalShape), and hoists any group
 * with at least `minHoistCount` occurrences into doc.components.responses,
 * replacing every occurrence with a $ref.
 *
 * Distinct shapes at the same status code are always hoisted separately
 * under distinct names -- never merged, never skipped.
 *
 * Mutates `doc` in place. Callers that need purity should clone first
 * (see optimizer/index.js).
 *
 * @param {object} doc
 * @param {{ minHoistCount?: number }} [opts]
 * @returns {object} report
 */
function hoistResponses(doc, opts = {}) {
  const minHoistCount = opts.minHoistCount ?? 3;

  if (!doc.components) doc.components = {};
  if (!doc.components.responses) doc.components.responses = {};
  const componentsResponses = doc.components.responses;

  // groupKey -> { statusCode, shape, locations: [{ container, key }] }
  const groups = new Map();
  const groupOrder = [];

  for (const pathItem of Object.values(doc.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') continue;
      const responses = operation.responses;
      if (!responses || typeof responses !== 'object') continue;

      for (const [statusCode, respObj] of Object.entries(responses)) {
        if (statusCode === '200') continue; // Success responses vary per endpoint; never touch.
        if (!respObj || typeof respObj !== 'object') continue;
        if (Object.prototype.hasOwnProperty.call(respObj, '$ref')) continue; // already hoisted

        const shapeCanon = canonicalKey(respObj);
        const groupKey = `${statusCode}::${shapeCanon}`;
        if (!groups.has(groupKey)) {
          groups.set(groupKey, { statusCode, shape: respObj, locations: [] });
          groupOrder.push(groupKey);
        }
        groups.get(groupKey).locations.push({ container: responses, key: statusCode });
      }
    }
  }

  const existingNames = new Set(Object.keys(componentsResponses));
  const hoisted = [];
  const belowThreshold = [];
  const fallbackNamings = [];

  for (const groupKey of groupOrder) {
    const group = groups.get(groupKey);
    if (group.locations.length < minHoistCount) {
      belowThreshold.push({
        statusCode: group.statusCode,
        count: group.locations.length,
        shape: group.shape,
      });
      continue;
    }

    const shapeCanon = canonicalKey(group.shape);
    let name = findReusableComponentName(componentsResponses, shapeCanon);
    let reused = Boolean(name);

    if (!name) {
      const baseName = baseNameForStatus(group.statusCode);
      const derived = deriveName(baseName, group.shape, existingNames);
      name = derived.name;
      if (derived.usedFallback) {
        fallbackNamings.push({
          name,
          statusCode: group.statusCode,
          reason:
            'No distinguishing qualifier could be derived from the description; ' +
            'fell back to a numeric suffix. Consider renaming manually.',
        });
      }
      componentsResponses[name] = group.shape;
      existingNames.add(name);
    }

    for (const loc of group.locations) {
      loc.container[loc.key] = { $ref: `#/components/responses/${name}` };
    }

    hoisted.push({
      name,
      statusCode: group.statusCode,
      count: group.locations.length,
      reused,
    });
  }

  return { hoisted, belowThreshold, fallbackNamings };
}

module.exports = {
  hoistResponses,
  STATUS_NAME_MAP,
  baseNameForStatus,
  HTTP_METHODS,
};
