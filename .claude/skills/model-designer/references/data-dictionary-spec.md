# Data Dictionary Workbook Spec

Column, layout and content conventions for the workbook produced by
`scripts/generate_data_dictionary.py`. `SKILL.md`'s Output Artifacts section
owns _when_ a workbook is generated; this file owns _what goes in it_. The
script enforces the parts that can be enforced, so a violation here is a
`ValueError`, not a review comment.

## Input shape and mode

The input JSON is an object, not a bare list of entities:

```json
{ "mode": "design", "entities": [ ... ] }
```

`"mode"` is required and is exactly one of `design` or `critique`. It lives in
the JSON rather than in a command-line flag on purpose: the `.xlsx` is a
render and the JSON is the source, so a later session regenerating from the
JSON alone gets the same validation. A flag would let the check pass
vacuously the first time someone forgot to pass it.

## The two modes render different things

- **`design`** — what the design _recommends_. Every element that should
  exist gets a row, including ones the source extension never had.
- **`critique`** — the submitted design **as submitted**. Every row is an
  element that is actually in the submission. An element the submission does
  **not** contain must not have a row here, however strongly the design
  recommends adding it — that recommendation belongs to the narrative doc's
  Extension Fit table (as a `Missing` row) and to the design workbook.

**A blank Core Fit is invalid in critique mode and the script rejects it.**
Every submitted element is classifiable, so a blank almost always means the
element is not in the submission and the row should not be there. Delete the
row, or give it a real category. `[Verify]` remains legal in both modes and
means something different: the element _is_ submitted, but its shape could
not be resolved.

This is not hypothetical. A critique workbook shipped with an
`ApplicationStatus` row carrying a blank Core Fit while its own narrative doc
classed that element **Missing** — i.e. not submitted at all. The blank was
the tell, and nothing had written the rule down.

## Columns

The workbook is **seven columns**: the reference workbook's six, plus
**Core Fit**. Core Fit is a deliberate, reasoned divergence from the
reference's shape — do not "correct" it back out to match the reference.
It answers the one question none of the other six can: _is this element
already in the Ed-Fi core model, or is it net new and would have to be
created?_ That is the first thing a reviewer needs to know per row, and
it isn't derivable from the other columns.

**There is still no Status/change-tracking column.** An earlier revision
added one (with New/Changed/Deprecated/Unchanged fill colors) for
critique-mode output; it was removed because it didn't add value the
paired narrative markdown doc (change-detail table, verdicts) doesn't
already cover better. Core Fit is **not** that column returning: Status
tracked how the _design_ changed between drafts; Core Fit measures the
design against _core_. They overlap only on the word "new" — do not
collapse them, and do not re-add Status.

Core Fit applies in **both modes**, not just critique. In design mode it
is the signal for which recommended elements are net-new work.

**Column content conventions** (verified against that same reference
workbook — don't invent variants):

- **UML Datatype** — exactly one of `String`, `Number`, `Date`,
  `Reference`. Every reference kind (descriptor, domain entity, common,
  inline common, enumeration) is `Reference`; booleans are `Number`
  (matches the reference workbook's own convention, e.g.
  `HighlyQualifiedTeacher`); the specific kind goes in **Other**, not
  here.
- **Other** — `MetaEd DSL Type: <type>` where `<type>` is the actual
  MetaEd keyword: `descriptor`, `domain entity`, `common`, `inline
  common`, `enumeration`, `date`, `bool`, `shared string`, `shared
  decimal`, `shared integer`. A `common`/`domain entity`/`descriptor`
  reference that's a collection still just says `common`/etc. here —
  the "collection" part belongs in **Cardinality**, not **Other** (the
  reference workbook never writes "common collection" in this column).
  Append `\nSQL Recommended DataType: <TYPE>` on its own line only when
  you have a real, cited length/precision (from the actual `.metaed`
  shared-type definition or the source extension's own declared SQL
  type) — never invent a VARCHAR length.

  **Reuse provenance.** Whenever an element reuses an existing core
  concept under a _role name_ or a _different name_, the reader cannot
  tell what to reuse or how it is meant to be used from the element's
  own name — `Guardian` does not say "this is core's `Name` common."
  Append these lines, in this order, only where they apply:
  - `Core Source: <CoreName> (<MetaEd kind>)` — the core element to
    reuse. Qualify with its parent when the bare name is ambiguous
    (`Application.WithdrawDate (date)`,
    `Name.GenerationCodeSuffix (shared string)`).
  - `Role Name: <Name>` — mirrors MetaEd's `role name` keyword, used on
    references and descriptors. Verified core example, in
    `Association/StudentSchoolAssociation.metaed`: `EntryGradeLevel` is
    declared `descriptor GradeLevel ... role name Entry`, so the
    original name is `GradeLevel` and the role name is `Entry`.
  - `Named: <Name>` — mirrors MetaEd's _other_ rename keyword, used on
    shared strings (`Common/Name.metaed`:
    `shared string LastSurname named MaidenName`). Do not conflate it
    with `Role Name`; they are different DSL constructs.
  Every core name written here must come from a direct read of the
  `.metaed` source, never from a narrative doc's prose or from memory.

  **Do not add a `Renamed From:` line** recording what the element was
  called in the source extension or issue sketch. A revision of this
  skill did, and it was removed: these three keys state durable facts
  about the _core model_ (`Guardian` is core's `Name` under role name
  `Guardian`, and always will be), whereas a former draft name is
  change-tracking against a prior draft — the same axis as the deleted
  Status column, and it belongs in the narrative doc's change-detail
  table. It is redundant for reuse besides: `Core Source:` plus
  `Role Name:` already say exactly what to build.

**Commons get their own tab — never build the object inside `Other`.**
A common's internal shape is structured data; describing it as prose in
the referencing row's `Other` cell makes it unscannable and unusable.
Mark each one `"kind": "common"` in the input JSON and the script stacks
them all onto a single `Commons` tab, each as a block using the _same_
title band / documentation / header / rows layout as an entity sheet, so
the two never drift apart visually. The referencing row then carries only
its type, its `Core Source:` line, and `Structure: see Commons tab`.

- **Scope: new or restructured commons only.** A core common reused
  as-is (`Address`, `Telephone`, `ElectronicMail`, `Name`, `BirthData`)
  is already governed and unchanged — it keeps its one-line
  `Core Source:` reference and gets no block. Adding a block for every
  referenced common buries the ones that actually need review.
- A common whose shape is genuinely unknown still gets a block, with the
  uncertainty stated in its documentation row and **no property rows**.
  Do not populate its fields by inference to make the block look
  complete.
- The `Commons` tab is emitted only when there is at least one common to
  show; workbooks without one are unchanged.
- **Identity** — `Yes` if part of the entity's identity, otherwise
  **blank** (empty string). Never write `No` — the reference workbook
  never does.
- **Cardinality** — **blank** for identity elements (the reference
  workbook never writes "required" on an identity row — being part of
  the key already implies it). For everything else: `required`,
  `optional`, `required collection`, or `optional collection`.
- **Documentation** — the field's own plain business definition only.
  **Never** put review commentary, verdicts (Recommend/Caution/Reject),
  ticket numbers, GitHub issue links, or file-path references in this
  column — that reasoning lives in the narrative markdown doc
  (Extension Fit table, verdict table, Sources Consulted), not the
  spreadsheet. In critique mode, use the submitted entity's own
  documentation text verbatim, flaws and all — don't silently rewrite it
  with the fix. In design mode, write a clean forward-looking
  definition. **If you can't write an honest one-sentence definition
  without resorting to meta-commentary, leave the cell blank rather than
  filling it with process notes.**
- **Core Fit** — exactly one of the four Extension Fit Mapping
  categories defined above: `Maps cleanly`, `Partially maps`,
  `Established core concept, new placement`, `New to core`. The script
  validates this and raises on anything else, so the workbook can never
  drift from the narrative doc's Extension Fit table. Two escapes exist
  and only these two: leave it **blank** when the fit genuinely isn't
  determined, or write `[Verify]` when it's actively flagged unresolved
  per the Behavior Rules. Never invent a fifth category, and never
  guess a category to avoid a blank — an honest blank beats a wrong
  label, exactly as for Documentation.
  `Missing` is **not** valid here: it describes an element the design
  omits, which by definition has no row in this workbook. Missing
  elements are reported in the narrative doc's Extension Fit table only.

**Row heights are not set by this script for data rows** — Excel
autofits them. Do not add height calculation back. It was tried, and
measured against all 83 data rows of the reference workbook no
chars-per-width constant reproduces Excel's per-glyph font metrics:
every value either clipped text or over-padded. The clipping was a real
defect — a two-line `Other` cell (shared string + `SQL Recommended
DataType`) got 29.0pt where the reference gives 43.5pt, silently hiding
the SQL line.

Rows 1–4 of every block do carry explicit heights, for two different
reasons — don't collapse them into one:

- **Row 1 (title) and row 2 (documentation)** are merged across the full
  width, and Excel does not autofit merged cells.
- **Row 3 (blank spacer, 10.0pt) and row 4 (header, 14.5pt)** are not merged.
  They are fixed because they hold known, fixed-length content and the
  reference workbook sets them that way.

The merged documentation row is the one place the discredited estimator still
runs, so it is floored at `REFERENCE_MERGED_DOC_HEIGHT = 30.0` — the flat
value the reference workbook uses for every one of its merged documentation
rows, at text lengths from 73 to 337 characters. The estimator under-predicted
all eight of those (14.5 or 29.0 against 30.0), which had our own 119–123
character documentation banners rendering at half the reference height. The
floor is not a cap: a genuinely longer document still gets the larger
estimate, because over-padding only adds whitespace while under-padding hides
text.

## Regenerating over an open workbook

If the target `.xlsx` is open in Excel, the script fails with:

```text
PermissionError: [Errno 13] Permission denied: '...-DataDictionary.xlsx'
```

That is a file lock, not a permissions problem — close the workbook and
re-run. Do not go looking for an ACL or a read-only attribute. Excel does not
always leave a `~$`-prefixed owner file beside the workbook, so its absence
does not mean the file is free; confirm by opening the file `r+b`, which
fails with the same error while the lock is held.
