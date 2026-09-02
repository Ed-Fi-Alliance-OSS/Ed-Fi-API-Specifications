#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

const { loadDocument } = require('./loader');
const { assertOpenApi3 } = require('./validator');
const { stripChangeQueries } = require('./changeQueries');
const { optimize } = require('./optimizer');
const { standardize, majorMinor } = require('./standardizer');
const { toYaml } = require('./emitter');
const { buildReport } = require('./report');
const { InputFormatError, UsageError } = require('./errors');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const VERSION_RE = /^\d+\.\d+\.\d+$/;

const KIND_CONFIG = {
  resources: { dir: 'resources', prefix: 'resources-api' },
  descriptors: { dir: 'descriptors', prefix: 'descriptor-api' },
};

function defaultOutputPath(kind, version) {
  const { dir, prefix } = KIND_CONFIG[kind];
  return path.join(REPO_ROOT, 'api-specifications', dir, `${prefix}-${majorMinor(version)}.yaml`);
}

function buildProgram() {
  const program = new Command();
  program
    .name('openapi-build')
    .description(
      'Converts a raw OpenAPI 3 export from the Ed-Fi ODS/API platform into the ' +
        'official published Ed-Fi API Specification YAML.'
    )
    .argument('<input-file>', 'path to the raw OpenAPI 3 JSON export')
    .requiredOption('--kind <kind>', 'resources or descriptors', (value) => {
      if (value !== 'resources' && value !== 'descriptors') {
        throw new Error('--kind must be "resources" or "descriptors"');
      }
      return value;
    })
    .requiredOption(
      '--data-standard-version <version>',
      'Data Standard version, e.g. 6.1.0',
      (value) => {
        if (!VERSION_RE.test(value)) {
          throw new Error('--data-standard-version must look like X.Y.Z, e.g. 6.1.0');
        }
        return value;
      }
    )
    .option('--out <path>', 'explicit output path (default derived from --kind/--data-standard-version)')
    .option('--min-hoist-count <n>', 'minimum occurrences required to hoist a shape', (value) => {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error('--min-hoist-count must be a positive integer');
      }
      return n;
    }, 3)
    .option('--dry-run', "run the pipeline and print the report, but don't write output")
    .option('--report-only', 'alias for --dry-run')
    .option('--force', 'allow overwriting an existing output file')
    .option('--verbose', 'print every individual hoist/skip decision')
    .option('--validate', 'run swagger-parser against the emitted YAML as a sanity check (warn-only)')
    .version(require('../package.json').version);

  return program;
}

/**
 * Runs the full CLI pipeline. Kept separate from main() so tests can invoke
 * it programmatically without spawning a subprocess and without it calling
 * process.exit() itself.
 *
 * @param {string[]} argv arguments, NOT including node/script (e.g. process.argv.slice(2))
 * @param {{ stdout?: (s: string) => void, stderr?: (s: string) => void }} [io]
 * @returns {Promise<number>} exit code
 */
async function run(argv, io = {}) {
  const stdout = io.stdout || ((s) => process.stdout.write(`${s}\n`));
  const stderr = io.stderr || ((s) => process.stderr.write(`${s}\n`));

  const program = buildProgram();
  program.exitOverride();

  let opts;
  let inputFile;
  try {
    program.parse(argv, { from: 'user' });
    opts = program.opts();
    opts.dryRun = Boolean(opts.dryRun || opts.reportOnly);
    [inputFile] = program.args;
  } catch (err) {
    // commander throws a CommanderError for --help/--version too; those
    // aren't failures.
    if (err && (err.code === 'commander.helpDisplayed' || err.code === 'commander.version')) {
      return 0;
    }
    stderr(`Usage error: ${err.message}`);
    return 1;
  }

  try {
    if (!inputFile) {
      throw new UsageError('Missing required <input-file> argument.');
    }
    if (!fs.existsSync(inputFile)) {
      throw new UsageError(`Input file not found: ${inputFile}`);
    }

    const outputPath = opts.out
      ? path.resolve(opts.out)
      : defaultOutputPath(opts.kind, opts.dataStandardVersion);

    if (!opts.dryRun && !opts.force && fs.existsSync(outputPath)) {
      throw new UsageError(
        `Output file already exists: ${outputPath}. Use --force to overwrite, or --dry-run to preview.`
      );
    }

    const rawDoc = await loadDocument(inputFile);
    // The file's actual size on disk, not a minified reserialization of the
    // parsed document -- a pretty-printed raw export would otherwise be
    // reported as dramatically smaller than it really is.
    const inputSizeBytes = fs.statSync(inputFile).size;

    // assertOpenApi3 throws InputFormatError -> exit code 2, caught below.
    assertOpenApi3(rawDoc);

    const removedServers = rawDoc.servers;

    const { report: changeQueriesReport } = stripChangeQueries(rawDoc);

    // Standardize a clone first, then optimize that standardized document,
    // so optimize()'s before/after sizes describe the "Standardized,
    // unoptimized" -> "Optimized" stages the report actually labels them as.
    const standardizedDoc = JSON.parse(JSON.stringify(rawDoc));
    standardize(standardizedDoc, { kind: opts.kind, version: opts.dataStandardVersion });

    const { doc: optimizedDoc, report: optimizeReport } = optimize(standardizedDoc, {
      minHoistCount: opts.minHoistCount,
    });

    const yamlText = toYaml(optimizedDoc);
    const yamlSizeBytes = Buffer.byteLength(yamlText, 'utf8');

    const reportText = buildReport({
      inputPath: inputFile,
      outputPath,
      dryRun: Boolean(opts.dryRun),
      kind: opts.kind,
      version: opts.dataStandardVersion,
      title: optimizedDoc.info.title,
      description: optimizedDoc.info.description,
      inputSizeBytes,
      removedServers,
      changeQueriesReport,
      optimizeReport,
      yamlSizeBytes,
      verbose: Boolean(opts.verbose),
    });
    stdout(reportText);

    if (!opts.dryRun) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, yamlText, 'utf8');
      stdout(`\nWrote ${outputPath}`);

      if (opts.validate) {
        await runOptionalValidation(outputPath, stdout, stderr);
      }
    } else if (opts.validate) {
      stdout('\n--validate skipped: --dry-run does not produce a file to validate.');
    }

    return 0;
  } catch (err) {
    if (err instanceof InputFormatError) {
      stderr(`Input format error: ${err.message}`);
      return 2;
    }
    if (err instanceof UsageError) {
      stderr(`Usage error: ${err.message}`);
      return 1;
    }
    stderr(`Unexpected error: ${err.stack || err.message}`);
    return 3;
  }
}

async function runOptionalValidation(outputPath, stdout, stderr) {
  let SwaggerParser;
  try {
    // Optional devDependency -- best-effort only, never fails the build.

    SwaggerParser = require('@apidevtools/swagger-parser');
  } catch (err) {
    stderr(err);
    stdout('\n--validate requested but @apidevtools/swagger-parser is not installed; skipping.');
    return;
  }

  try {
    await SwaggerParser.validate(outputPath);
    stdout('\n--validate: swagger-parser reported no issues.');
  } catch (err) {
    stdout(
      `\n--validate WARNING: swagger-parser reported issues (this does not fail the build; ` +
        `Ed-Fi's x-Ed-Fi-* vendor extensions can trip up strict validators):\n${err.message}`
    );
  }
}

async function main() {
  const code = await run(process.argv.slice(2));
  process.exitCode = code;
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Unexpected error: ${err.stack || err.message}\n`);
    process.exitCode = 3;
  });
}

module.exports = { run, buildProgram, defaultOutputPath };
