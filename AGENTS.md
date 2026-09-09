# Agent Instructions

## File Header

All new code files (`*.js`, `*.ts`, `*.yaml`, `*.yml`) must have this license
header:

```text
SPDX-License-Identifier: Apache-2.0
Licensed to the Ed-Fi Alliance under one or more agreements.
The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
See the LICENSE and NOTICES files in the project root for more information.
```

### Third-party specifications

A specification that originates outside the Ed-Fi Alliance keeps the header of
the party that licenses it, rather than the Ed-Fi Alliance header above. Do not
rewrite an inherited header to match the default.

When adding such a file:

- Preserve the originating party's header exactly as it appears in the source.
- Add a section to `NOTICES.md` naming that party, linking the file, stating the
  license, and listing every way the file differs from its source.

`api-specifications/oneroster/oneroster-api-1.2.yaml` is the current example: it
is licensed by 1EdTech Consortium, Inc., so it carries the 1EdTech header, and
`NOTICES.md` records the attribution and the modifications.

## Formatting Rules

- Use `lf` style line endings
- Use two spaces instead of tab for indentation
- When editing a markdown file, follow the rules in `.markdownlint.yaml`
