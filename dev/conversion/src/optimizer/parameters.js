// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

'use strict';

const { canonicalKey, findReusableComponentName } = require('./shape');
const { HTTP_METHODS } = require('./responses');

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Turns a (possibly hyphenated) parameter name into a PascalCase identifier
// segment, e.g. "If-Match" -> "IfMatch", "Use-Snapshot" -> "UseSnapshot".
// Only used for the method-partitioned exception's component names -- the
// general hoisting path keeps hyphenated names as-is (see hoistParameters).
function pascalCaseName(name) {
  return String(name)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => capitalize(part))
    .join('');
}

function collectLocations(doc) {
  const locations = [];
  for (const pathItem of Object.values(doc.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue;

    if (Array.isArray(pathItem.parameters)) {
      pathItem.parameters.forEach((param, index) => {
        if (!param || typeof param !== 'object') return;
        if (Object.prototype.hasOwnProperty.call(param, '$ref')) return;
        locations.push({
          name: param.name,
          in: param.in,
          shape: param,
          container: pathItem.parameters,
          index,
          method: null,
        });
      });
    }

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== 'object') continue;
      if (!Array.isArray(operation.parameters)) continue;
      operation.parameters.forEach((param, index) => {
        if (!param || typeof param !== 'object') return;
        if (Object.prototype.hasOwnProperty.call(param, '$ref')) return;
        locations.push({
          name: param.name,
          in: param.in,
          shape: param,
          container: operation.parameters,
          index,
          method,
        });
      });
    }
  }
  return locations;
}

function groupByNameAndIn(locations) {
  const groups = new Map();
  const order = [];
  for (const loc of locations) {
    const key = `${loc.name}::${loc.in}`;
    if (!groups.has(key)) {
      groups.set(key, { name: loc.name, in: loc.in, locations: [] });
      order.push(key);
    }
    groups.get(key).locations.push(loc);
  }
  return { groups, order };
}

function groupByShape(locations) {
  const shapeMap = new Map();
  const order = [];
  for (const loc of locations) {
    const canon = canonicalKey(loc.shape);
    if (!shapeMap.has(canon)) {
      shapeMap.set(canon, { shape: loc.shape, locations: [] });
      order.push(canon);
    }
    shapeMap.get(canon).locations.push(loc);
  }
  return order.map((canon) => shapeMap.get(canon));
}

/**
 * Narrow, explicit exception to the general safety rule: if a (name, in)
 * group has exactly 2 distinct shapes, and those two shapes partition
 * *perfectly* by HTTP method (each shape's locations all share one method,
 * and the two methods differ, with zero path-level -- i.e. method-less --
 * locations involved), hoist both under method-qualified component names.
 *
 * Returns an array of two hoist-plan entries, or null if the shapes do not
 * cleanly partition by method (caller must then fall through to the
 * general ambiguous-skip rule -- this function must never guess a name).
 *
 * @param {string} name
 * @param {Array<{shape: object, locations: object[]}>} distinctShapes exactly 2 entries
 * @param {number} minHoistCount
 * @returns {Array<{shape: object, locations: object[], method: string, componentNameBase: string}>|null}
 */
function tryMethodPartitionedHoist(name, distinctShapes, minHoistCount) {
  if (distinctShapes.length !== 2) return null;

  const [a, b] = distinctShapes;

  // Any path-level (method === null) location means this shape isn't tied
  // to a single method, so a clean method partition is impossible.
  if (a.locations.some((l) => l.method === null)) return null;
  if (b.locations.some((l) => l.method === null)) return null;

  const methodsA = new Set(a.locations.map((l) => l.method));
  const methodsB = new Set(b.locations.map((l) => l.method));
  if (methodsA.size !== 1 || methodsB.size !== 1) return null;

  const [methodA] = methodsA;
  const [methodB] = methodsB;
  if (methodA === methodB) return null; // overlap -- not a clean partition

  if (a.locations.length < minHoistCount || b.locations.length < minHoistCount) {
    return null;
  }

  const pascal = pascalCaseName(name);
  return [
    { ...a, method: methodA, componentNameBase: `${pascal}${capitalize(methodA)}` },
    { ...b, method: methodB, componentNameBase: `${pascal}${capitalize(methodB)}` },
  ];
}

// Derives a component name for `baseName`, disambiguating collisions with
// names already in use. If `inLoc` is given (the general, non-method-
// partitioned hoist path), a collision is first resolved by appending the
// capitalized `in` value (e.g. "id" -> "idQuery"), since that's the most
// common source of same-name collisions (a path parameter and a query
// parameter sharing a name). Any further collision -- or a collision when
// `inLoc` is not given, such as for already method-qualified names -- falls
// back to a numeric suffix.
function deriveComponentName(baseName, existingNames, inLoc) {
  if (!existingNames.has(baseName)) return baseName;

  if (inLoc) {
    const inQualified = `${baseName}${capitalize(inLoc)}`;
    if (!existingNames.has(inQualified)) return inQualified;
    return numericFallback(inQualified, existingNames);
  }

  return numericFallback(baseName, existingNames);
}

function numericFallback(base, existingNames) {
  let i = 2;
  let candidate = `${base}${i}`;
  while (existingNames.has(candidate)) {
    i += 1;
    candidate = `${base}${i}`;
  }
  return candidate;
}

function applyHoist(componentsParameters, existingNames, componentNameBase, shape, locations, inLoc) {
  const canon = canonicalKey(shape);
  let finalName = findReusableComponentName(componentsParameters, canon);
  const reused = Boolean(finalName);

  if (!finalName) {
    finalName = deriveComponentName(componentNameBase, existingNames, inLoc);
    componentsParameters[finalName] = shape;
    existingNames.add(finalName);
  }

  for (const loc of locations) {
    loc.container[loc.index] = { $ref: `#/components/parameters/${finalName}` };
  }

  return { finalName, reused };
}

/**
 * Hoists inline parameters (from both path-item-level and operation-level
 * `parameters` arrays) into doc.components.parameters, grouped by the
 * (name, in) pair.
 *
 * SAFETY RULE (the core purpose of this module): within a (name, in)
 * group, only hoist if there is exactly one distinct shape document-wide
 * (by canonicalKey) and the group meets minHoistCount. If two or more
 * distinct shapes exist for the same (name, in) pair anywhere in the
 * document, none of that pair's occurrences are hoisted -- they are all
 * left fully inline and unchanged, and the group is reported as
 * "skipped -- ambiguous". This protects per-resource identity parameters
 * (e.g. educationOrganizationId) -- which legitimately vary in shape
 * across resources -- from being silently and incorrectly collapsed into
 * one shared, wrong component.
 *
 * The ONE exception is tryMethodPartitionedHoist above: exactly 2 shapes
 * that partition perfectly by HTTP method may be hoisted under
 * method-qualified names. Any other multi-shape case, including a 2-shape
 * case that does not cleanly partition by method, falls back to the
 * general safety rule.
 *
 * Mutates `doc` in place. Callers that need purity should clone first
 * (see optimizer/index.js).
 *
 * @param {object} doc
 * @param {{ minHoistCount?: number }} [opts]
 * @returns {object} report
 */
function hoistParameters(doc, opts = {}) {
  const minHoistCount = opts.minHoistCount ?? 3;

  if (!doc.components) doc.components = {};
  if (!doc.components.parameters) doc.components.parameters = {};
  const componentsParameters = doc.components.parameters;
  const existingNames = new Set(Object.keys(componentsParameters));

  const locations = collectLocations(doc);
  const { groups, order } = groupByNameAndIn(locations);

  const hoisted = [];
  const belowThreshold = [];
  const ambiguous = [];

  for (const key of order) {
    const group = groups.get(key);
    const distinctShapes = groupByShape(group.locations);

    if (distinctShapes.length === 1) {
      const only = distinctShapes[0];
      if (only.locations.length < minHoistCount) {
        belowThreshold.push({ name: group.name, in: group.in, count: only.locations.length });
        continue;
      }
      const { finalName, reused } = applyHoist(
        componentsParameters,
        existingNames,
        group.name,
        only.shape,
        only.locations,
        group.in
      );
      hoisted.push({
        name: finalName,
        in: group.in,
        count: only.locations.length,
        reused,
      });
      continue;
    }

    if (distinctShapes.length === 2) {
      const plan = tryMethodPartitionedHoist(group.name, distinctShapes, minHoistCount);
      if (plan) {
        for (const entry of plan) {
          const { finalName, reused } = applyHoist(
            componentsParameters,
            existingNames,
            entry.componentNameBase,
            entry.shape,
            entry.locations
          );
          hoisted.push({
            name: finalName,
            in: group.in,
            count: entry.locations.length,
            method: entry.method,
            reused,
          });
        }
        continue;
      }
    }

    // General safety rule: 2+ distinct shapes that did not qualify for the
    // narrow method-partition exception. Leave everything inline.
    ambiguous.push({
      name: group.name,
      in: group.in,
      shapeCount: distinctShapes.length,
      totalCount: group.locations.length,
    });
  }

  return { hoisted, belowThreshold, ambiguous };
}

module.exports = { hoistParameters, tryMethodPartitionedHoist, pascalCaseName };
