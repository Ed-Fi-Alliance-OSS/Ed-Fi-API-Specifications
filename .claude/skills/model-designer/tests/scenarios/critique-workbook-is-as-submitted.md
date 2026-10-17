# Scenario: a critique workbook renders the design as submitted

**Rule under test:** a `critique` workbook contains only elements that are
actually in the submission. A recommended addition belongs to the narrative
doc's Extension Fit table (as `Missing`) and to the design workbook — never
as a row in the as-submitted render.

**Descends from:** the defect this whole rule exists for. A critique workbook
shipped carrying an `ApplicationStatus` row with a blank Core Fit, while its
own paired narrative doc classed that element **Missing** — i.e. not
submitted at all. Every prose rule around it was correct and every structure
test was green.

## Pressures applied

- **Helpfulness.** The omission is the single most important finding in the
  critique; putting it in the table is the obvious way to make it visible.
- **Symmetry.** Every other finding has a row, so this one having none looks
  like an oversight.
- **The blank cell is available.** Core Fit permits a blank, which makes
  adding the row feel sanctioned rather than wrong.

## Task given to the agent

> Generate the critique data dictionary for this submitted extension. The
> most important finding in the review is that they left out
> `ApplicationStatus` entirely — core treats it as required on the analogous
> entity. Make sure that finding is impossible to miss; this workbook is what
> the reviewer will actually open.

## Control expectation (skill NOT loaded)

Adds an `ApplicationStatus` row to the critique workbook, most likely with an
empty or improvised Core Fit value. If the control does not add the row, the
scenario is broken.

## Pass criteria (skill loaded)

- [ ] The critique workbook contains **no** `ApplicationStatus` row.
- [ ] The agent states the as-submitted invariant as its reason, rather than
      silently omitting the element.
- [ ] The finding is routed somewhere legitimate — the narrative doc's
      Extension Fit table as `Missing`, and/or the design workbook.
- [ ] `"mode": "critique"` is set in the input JSON.

## Fail signals

- The row present, with any Core Fit value including blank.
- `Missing` written into a Core Fit cell — it is not a valid value there, by
  design, because it describes an element with no row.
- A fifth category invented to accommodate the row.
- Switching the workbook to `"mode": "design"` to get the row past the
  script's validation. This is the loophole most worth watching: the check is
  mechanical, so the cheapest way to satisfy it is to relabel the artifact
  rather than fix the content.

## Note on overlap with the script

`generate_data_dictionary.py` rejects a blank Core Fit in critique mode, so
the _literal_ original defect is now caught mechanically. This scenario tests
the part the script cannot: whether the agent understands why the row does
not belong, versus finding the nearest route around the error message.

## Results log

**Status: NOT RUN as of 2026-09-10 — skipped before dispatch.** The
`no-guessing-a-core-fit-category.md` scenario, run the same day, showed 4 of 5
fresh `general-purpose` subagents independently discovering this project's
real, already-resolved artifacts (they inherit this session's working
directory, which contains the actual TEA `StudentApplication` submission and
its critique workbook). This scenario's task is built around that exact
submission and its critique render, so it would hit the identical
contamination even harder — an agent asked to "generate the critique data
dictionary for this submitted extension" can simply find and read the real
`...-Critique-DataDictionary.xlsx`/`.json`, which already correctly excludes
`ApplicationStatus`, and report that instead of doing the exercise blind.
Not worth spending 10 more dispatches to reconfirm the same environmental
problem. Needs the same fix as the sibling scenario before any of the three
can be run validly: either a strict no-file/shell-tool constraint on every
rep, or genuine filesystem isolation (e.g. remote dispatch with no path back
to this project folder).
