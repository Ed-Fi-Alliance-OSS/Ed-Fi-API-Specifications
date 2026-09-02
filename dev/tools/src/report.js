'use strict';

function formatBytes(n) {
  return `${n.toLocaleString('en-US')} bytes`;
}

function line(indent, text) {
  return `${'  '.repeat(indent)}${text}`;
}

function summarizeOrList(items, verbose, formatItem, noun) {
  const lines = [];
  if (items.length === 0) {
    lines.push(line(2, `(none)`));
    return lines;
  }
  if (verbose) {
    for (const item of items) {
      lines.push(line(2, formatItem(item)));
    }
  } else {
    const sampleCount = Math.min(items.length, 5);
    for (let i = 0; i < sampleCount; i += 1) {
      lines.push(line(2, formatItem(items[i])));
    }
    if (items.length > sampleCount) {
      lines.push(line(2, `... and ${items.length - sampleCount} more ${noun} (use --verbose to see all)`));
    }
  }
  return lines;
}

/**
 * Builds the human-readable text report printed to stdout after every run.
 *
 * @param {object} ctx
 * @param {string} ctx.inputPath
 * @param {string} ctx.outputPath
 * @param {boolean} ctx.dryRun
 * @param {string} ctx.kind
 * @param {string} ctx.version
 * @param {number} ctx.inputSizeBytes
 * @param {object|undefined} ctx.removedServers the servers array that was removed, if any
 * @param {object} ctx.changeQueriesReport result of changeQueries.js#stripChangeQueries
 * @param {object} ctx.optimizeReport result of optimizer/index.js#optimize
 * @param {number} ctx.yamlSizeBytes size in bytes of the final emitted YAML
 * @param {boolean} [ctx.verbose]
 * @returns {string}
 */
function buildReport(ctx) {
  const verbose = Boolean(ctx.verbose);
  const out = [];

  out.push('='.repeat(70));
  out.push('openapi-build report');
  out.push('='.repeat(70));
  out.push(`Input:  ${ctx.inputPath} (${formatBytes(ctx.inputSizeBytes)})`);
  out.push(
    `Output: ${ctx.outputPath} (${formatBytes(ctx.yamlSizeBytes)})${
      ctx.dryRun ? '  [dry run -- not written]' : ''
    }`
  );
  out.push('');

  out.push('Standardization');
  out.push('-'.repeat(70));
  out.push(line(1, `kind: ${ctx.kind}`));
  out.push(line(1, `info.title: ${ctx.title}`));
  out.push(line(1, `info.version: ${ctx.version}`));
  out.push(line(1, `info.description: ${ctx.description}`));
  if (ctx.removedServers) {
    out.push(line(1, `servers: removed (${JSON.stringify(ctx.removedServers)})`));
  } else {
    out.push(line(1, 'servers: (not present in input)'));
  }
  out.push('');

  out.push('Change Queries surface stripped');
  out.push('-'.repeat(70));
  const cq = ctx.changeQueriesReport;
  out.push(line(1, `paths removed (/deletes, /keyChanges): ${cq.pathsRemoved.length}`));
  out.push(
    ...summarizeOrList(cq.pathsRemoved, verbose, (p) => p, 'removed paths')
  );
  out.push(line(1, `parameters removed (MinChangeVersion/MaxChangeVersion/Use-Snapshot): ${cq.parametersRemoved}`));
  out.push(line(1, `responses repointed (NotFoundUseSnapshot -> NotFound): ${cq.responsesReplaced}`));
  out.push(line(1, `schemas removed (trackedChanges_*): ${cq.schemasRemoved.length}`));
  out.push('');

  const { responses, parameters, sizeBytes } = ctx.optimizeReport;

  out.push('Responses hoisted into components.responses');
  out.push('-'.repeat(70));
  out.push(
    ...summarizeOrList(
      responses.hoisted,
      verbose,
      (r) => `${r.name} (status ${r.statusCode}, ${r.count} occurrence${r.count === 1 ? '' : 's'}${r.reused ? ', reused existing component' : ''})`,
      'hoisted responses'
    )
  );
  out.push('');
  out.push(line(1, `Left inline (below --min-hoist-count threshold):`));
  out.push(
    ...summarizeOrList(
      responses.belowThreshold,
      verbose,
      (r) => `status ${r.statusCode}: ${r.count} occurrence${r.count === 1 ? '' : 's'}`,
      'left-inline responses'
    )
  );
  if (responses.fallbackNamings.length > 0) {
    out.push('');
    out.push(line(1, 'WARNING: numeric fallback names used (no distinguishing qualifier found):'));
    for (const f of responses.fallbackNamings) {
      out.push(line(2, `${f.name} (status ${f.statusCode}): ${f.reason}`));
    }
  }
  out.push('');

  out.push('Parameters hoisted into components.parameters');
  out.push('-'.repeat(70));
  out.push(
    ...summarizeOrList(
      parameters.hoisted,
      verbose,
      (p) =>
        `${p.name} (in: ${p.in}${p.method ? `, method: ${p.method}` : ''}, ${p.count} occurrence${p.count === 1 ? '' : 's'}${p.reused ? ', reused existing component' : ''})`,
      'hoisted parameters'
    )
  );
  out.push('');
  out.push(line(1, `Left inline (below --min-hoist-count threshold):`));
  out.push(
    ...summarizeOrList(
      parameters.belowThreshold,
      verbose,
      (p) => `${p.name} (in: ${p.in}): ${p.count} occurrence${p.count === 1 ? '' : 's'}`,
      'left-inline parameters'
    )
  );
  out.push('');
  out.push(
    line(
      1,
      'Skipped -- AMBIGUOUS (multiple distinct shapes found; safety rule protects per-resource variance):'
    )
  );
  out.push(
    ...summarizeOrList(
      parameters.ambiguous,
      verbose,
      (p) =>
        `${p.name} (in: ${p.in}): ${p.shapeCount} distinct shapes across ${p.totalCount} occurrences -- left fully inline`,
      'ambiguous parameters'
    )
  );
  out.push('');

  out.push('Size comparison');
  out.push('-'.repeat(70));
  out.push(line(1, `Standardized, unoptimized JSON: ${formatBytes(sizeBytes.before)}`));
  out.push(line(1, `Optimized JSON:                 ${formatBytes(sizeBytes.after)}`));
  const pctSaved = sizeBytes.before > 0 ? (100 * (1 - sizeBytes.after / sizeBytes.before)).toFixed(1) : '0.0';
  out.push(line(1, `Reduction: ${pctSaved}%`));
  out.push(line(1, `Final emitted YAML: ${formatBytes(ctx.yamlSizeBytes)}`));
  out.push('='.repeat(70));

  return out.join('\n');
}

module.exports = { buildReport };
