# openapi-build

A CLI that converts a raw OpenAPI 3 export from the Ed-Fi ODS/API platform
into the official published Ed-Fi API Specification YAML. It automates the
manual process described in
[`dev/docs/FROM-SWAGGER-TO-OPENAPI.md`](../docs/FROM-SWAGGER-TO-OPENAPI.md):
hoisting repeated response/parameter shapes into `components`, standardizing
`info.title`/`info.description`/`info.version`, and dropping the dev-only
`servers` key.

## Prerequisites

- Node.js (see the engine requirements of the dependencies in `package.json`)
- Run `npm install` in this directory (`dev/tools`) before first use.

## Usage

```shell
node ./src/cli.js <input-file> --kind <resources|descriptors> --data-standard-version <X.Y.Z> [options]
```

or, via the npm script:

```shell
npm run convert -- <input-file> --kind <resources|descriptors> --data-standard-version <X.Y.Z> [options]
```

### Required arguments

| Argument | Description |
| --- | --- |
| `<input-file>` | Path to the raw OpenAPI 3 JSON export from the ODS/API. |
| `--kind <kind>` | Either `resources` or `descriptors`. |
| `--data-standard-version <version>` | Data Standard version, e.g. `6.1.0`. |

### Options

| Option | Description |
| --- | --- |
| `--out <path>` | Explicit output path. Defaults to `api-specifications/{resources\|descriptors}/{resources-api\|descriptor-api}-{major.minor}.yaml` at the repo root. |
| `--min-hoist-count <n>` | Minimum number of occurrences required to hoist a repeated shape into `components`. Default `3`. |
| `--dry-run` (alias `--report-only`) | Run the full pipeline and print the report, but don't write the output file. |
| `--force` | Allow overwriting an existing output file. |
| `--verbose` | Print every individual hoist/skip decision instead of a truncated summary. |
| `--validate` | Run `@apidevtools/swagger-parser` against the emitted YAML as a warn-only sanity check. |

## Sample runs

Preview what would happen, without writing anything:

```shell
node ./src/cli.js /path/to/raw-export.json --kind resources --data-standard-version 6.1.0 --dry-run
```

Convert a Resources export and write it to the default location
(`api-specifications/resources/resources-api-6.1.yaml`):

```shell
node ./src/cli.js /path/to/raw-export.json --kind resources --data-standard-version 6.1.0
```

Convert a Descriptors export, overwriting an existing output file, with the
full per-item hoist/skip report:

```shell
node ./src/cli.js /path/to/descriptors-export.json --kind descriptors --data-standard-version 6.1.0 --force --verbose
```

Write to an explicit path and sanity-check the result with swagger-parser:

```shell
node ./src/cli.js /path/to/raw-export.json --kind resources --data-standard-version 6.1.0 --out ./out/resources-api-6.1.yaml --validate
```

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success. |
| `1` | Usage error (missing/invalid arguments, input file not found, output already exists without `--force`). |
| `2` | Input format error (e.g. the input is Swagger 2.0 instead of OpenAPI 3, or is missing required top-level keys). |
| `3` | Unexpected error. |

## Testing

Tests use [Jest](https://jestjs.io/):

```shell
npm test
```
