---
name: model-designer
description: Use when turning an Ed-Fi Data Standard need (a DS-Need doc or GitHub Issue draft) into a concrete model design, or when critiquing an existing design against current model conventions and historical governance precedent. Triggers on "design this need", a path to a DS-Need doc or GitHub Issue draft, "critique this design", or a request naming an Ed-Fi domain/use case to model.
---

# Model Designer

## Purpose

Turn an Ed-Fi Data Standard need into a concrete model design — entities,
associations, descriptors, attributes, cardinality, naming — grounded in
the current model, past model versions, house conventions, and historical
governance precedent. Also critiques an existing design someone else
drafted.

This sits downstream of two existing skills:

```text
DS Product Needs (produces a DS-Need doc)  ->  GitHub Issue draft (roadmap-facing)  ->  model-designer (this skill)  ->  review-model-pr (PR review)
```

Familiarity required: the Ed-Fi Data Standard's domain model (entities,
associations, descriptors, fields), governance process, and
`review-model-pr`'s house conventions.

## Paths

Every location the skill touches is resolved at runtime and referenced by
token everywhere else. None of them is one person's machine layout, so the
skill runs unchanged from a user's skills folder or a repo's
`.claude/skills/`.

| Token | Resolves to |
| --- | --- |
| `<EDFI_MODEL_PACKAGE_DIR>` | The path printed by `python scripts/resolve_model_package.py` — `$EDFI_MODEL_PACKAGE_PATH`, then known clone locations, then the newest MetaEd IDE extension bundle. Record the `projectVersion` it prints. |
| `<METAED_IDE_EXTENSIONS_DIR>` | `~/.vscode/extensions/ed-fialliance.vscode-metaed-ide-*/node_modules/@edfi` |
| `<DATA_DICTIONARY_SCRIPT>` | `scripts/generate_data_dictionary.py`, relative to this skill's folder |
| `<MODEL_DESIGNS_OUTPUT_DIR>` | `$EDFI_MODEL_DESIGNS_OUTPUT_DIR` |
| `<NEEDS_DOCS_DIR>` | `$EDFI_DS_NEEDS_DOCS_DIR` |
| `<GITHUB_ISSUE_DRAFTS_DIR>` | `$EDFI_GITHUB_ISSUE_DRAFTS_DIR` |

If the resolver fails, the current model cannot be read: every claim about it
gets `[Verify]` and the design doc opens with
`model grounding UNVERIFIED - package not resolved`.

If one of the three directory variables is unset, ask the user once for the
location and suggest setting the variable (for Claude Code, the `env` block of
`~/.claude/settings.json`). A user with no needs-doc or issue-draft folder
carries on without it: log that Sources Consulted row as
`UNVERIFIED — not configured`, never as "checked, nothing found".

`<METAED_IDE_EXTENSIONS_DIR>` carries a version glob on purpose: list the
`extensions` folder and match the `ed-fialliance.vscode-metaed-ide-*` prefix
rather than assuming a fixed version number.

## Modes

One skill, two entry points, sharing the same underlying steps (Step Flow
below):

- **Design mode** — triggered by "design this need," a path to a DS-Need
  doc or GitHub Issue draft, or a request naming a domain/use case. Works
  one confirmed use case or batch at a time (see Step 0).
- **Critique mode** — triggered by "critique this design" plus a
  pasted/attached design or an existing state extension (markdown,
  `.metaed` file(s), or a data-dictionary spreadsheet). Runs Step 2,
  Extension Fit Mapping, Steps 3-4 and Step 6 of the Step Flow, against
  what was submitted instead of drafting from scratch. Extension Fit
  Mapping sits between Steps 2 and 3 and is unnumbered, so the shorthand
  "Steps 2-4" would skip it.

## Step Flow (Design Mode)

Needs docs typically contain several use cases (e.g. a Staff-domain need doc
might have ten, A through J). Some belong in one design/model change
together; some don't. Resolve scope before drafting anything.

### Step 0 — Resolve Scope

- **Caller names a specific use case** (e.g. "design Use Case A from the
  Staff-TEA doc"): treat that use case as the unit of work and proceed
  through Steps 1-6 for it alone. During Step 3 (precedent check), also
  scan the doc's _other_ use cases for overlap — same entity/association
  touched, same root-cause gap, or a stated dependency between them — and
  suggest folding in any that look related (e.g. "Use Case F also touches
  `StaffEdOrgEmploymentAssociation` and shares this gap's root cause —
  want to design it together with this one?"). This is a suggestion,
  never an automatic merge — wait for a yes/no per suggestion before
  changing scope.
- **Caller points at an entire needs doc**: before drafting anything,
  analyze every use case in it for natural groupings — shared entity/
  association, shared root-cause gap, sequential/dependency relationships
  (e.g. one use case's design decision blocks or shapes another's) — and
  present a proposed **batching plan**: which use cases would be designed
  together vs. separately, and why. Ask the caller to confirm, adjust, or
  substitute their own grouping. Then work through the confirmed batches
  one at a time using Steps 1-6. Each batch gets its own artifact set — a
  batch may be one use case or several combined; the `[topic]` slug in
  output filenames reflects the batch, not necessarily a single use case
  name.

For each confirmed use case or batch, run Steps 1-6:

### Step 1 — Load Context

Read the use case's "what's missing in DS terms" and any candidate
entities/associations/descriptors already named in the source doc. Treat
any proposed approach already written there (e.g. a needs doc's
Section 4.1/4.2, or an Issue draft's "Proposal" section) as a
**suggestion from the source material, not a decision** — it came out
of stakeholder notes, not a model-design review. Step 3 and Step 4 below
apply to it exactly like any other candidate change; never draft it in
as-is without running it through precedent-checking first.

If the "what's happening today" section names or describes a current
state extension for this gap (a common `DS-Need` pattern — e.g. "TEA
uses a custom extension `StaffTypeSet`"),
ask whether they have the actual extension source
(a real `.metaed` file, or a data-dictionary spreadsheet) to attach, so
Extension Fit Mapping (below) can compare it precisely rather than
working from prose alone.

### Step 2 — Review Current Model

Read the actual `.metaed` source for the relevant entities/associations
from `<EDFI_MODEL_PACKAGE_DIR>` (subfoldered by kind:
`DomainEntity\`, `Association\`, `Descriptor\`, `Common\`, `Enumeration\`,
`Shared\`). Then check prior DS versions in the model packages bundled
with the MetaEd IDE vscode extension
(`<METAED_IDE_EXTENSIONS_DIR>`) to see how the shape has evolved release
to release.

### Extension Fit Mapping

Run this whenever a state extension is in play (attached in Step 1, or
provided directly as Critique mode's input) — skip it entirely when no
extension exists for this use case.

**Compare against the whole model, not just the one closest-analog entity
Step 2 read.** It is not enough to check whether the single most-similar
core entity has a matching field and, finding none, call the element "new
to core." The specific shared type, `common`, `descriptor`, or
`enumeration` the element depends on may already be long-established
_elsewhere_ in the model even when the one analog entity you happened to
read doesn't use it — and that is a materially different, much
lower-severity finding than genuine novelty. Concretely: before recording
"New to core" for anything, grep the specific type/field name across the
whole `package` tree — `DomainEntity/`, `Association/`, `Enumeration/`,
`Descriptor/`, `Common/`, `Shared/` — not just re-reading the one entity
from Step 2. Collapsing "this exact entity doesn't have it" into "the
model doesn't have it" is a real accuracy bug, not a wording nuance: it
overstates how novel and risky the element actually is, and a reviewer
who trusts the label will spend review time re-litigating something
already settled by precedent.

For each extension element, record one of:

- **Maps cleanly** — an existing core element already covers this.
- **Partially maps** — a core element covers part of it, but the
  extension's shape (cardinality, naming, or scope) differs; note the
  adjustment needed to align with `review-model-pr`'s conventions.
- **Established core concept, new placement** — the specific shared
  type/`common`/descriptor/enumeration this element depends on already
  exists and is used elsewhere in the current model, just not on the one
  entity used as the closest analog. This means the extension is applying
  a known, low-risk, already-governed pattern in a new spot — not
  inventing anything. Example: a candidate entity keys on a `SchoolYear`
  enumeration reference; the one core entity checked for comparison
  doesn't happen to key on `SchoolYear`, but `Enumeration/SchoolYear.metaed`
  is a long-established core type used as an identity element on roughly
  twenty other entities (`Session`, `Calendar`, `StudentSchoolAssociation`,
  ...) — that is this category, never "New to core."
- **New to core** — the concept does not exist **anywhere in the current
  model**, confirmed by the whole-model search described above, not just
  absence from the one analog entity. **This is a neutral finding, not a
  verdict** — plenty of legitimate, well-designed extension elements land
  here simply because they're genuinely new territory (a new state-specific
  descriptor with no core analog at all) — landing in this category does
  not itself imply a problem. Step 3/4 still forms an opinion on whether
  the specific shape is well-designed, exactly as it would for any other
  category; don't manufacture a criticism just because nothing existed to
  compare it to, and don't call it a "gap" — that word is already doing
  separate, more loaded work elsewhere in this pipeline (a DS-Need doc's
  numbered "Gaps," meaning a deficiency the community should fix). It is,
  however, a materially higher-novelty finding than "Established core
  concept, new placement" above — the two must never be collapsed into
  each other.
  Reserve "missing" for the one case that _is_ a real concern: an element
  the closest core analog treats as essential (e.g. required on the
  analogous core entity) that the submitted design omits entirely — call
  that out explicitly as **Missing**, not "New to core," so a reader can
  tell the two apart at a glance.

Fidelity depends on what's available: the real `.metaed` source gives a
precise, field-by-field comparison; a spreadsheet data dictionary gives
a structured but summarized one; a prose description (named in the
needs doc but never attached) gives the lowest-confidence mapping — flag
any element you can't resolve with `[Verify]` per the Behavior Rules
rather than inventing its shape.

### Step 3 — Check Precedent

For each candidate change (the source doc's own suggestion counts as one):

1. Check whether a Confluence domain-dossier page already exists for the
   domain: search the `DATASTDDEV` space, folder
   `https://edfi.atlassian.net/wiki/spaces/DATASTDDEV/folder/2664398901`,
   for a page titled `Domain: <DomainName>`. If found, use it as the
   primary precedent source — it already synthesizes Jira + RFC history
   for this domain.
2. If no dossier exists, search live:
   - **Tool: `acli`, not the Atlassian MCP connector.** Run Jira searches with
     `acli jira workitem search --jql "<query>" --json` — this matches the
     `jira` skill's house convention. Do not use the `mcp__claude_ai_Atlassian__*`
     tools for this even if they're already loaded in context: that connector's
     OAuth scopes on this account are Jira-only (`read:jira-work`/
     `write:jira-work`, verified via `getAccessibleAtlassianResources`), so it
     silently can't do the Confluence half of this step, and it duplicates a
     tool the account already has a working, authenticated CLI for. Confirm
     `acli jira auth status` shows authenticated before relying on results.
   - Jira query shape: `project in (DATASTD, MODL) AND text ~ "<domain name>"`,
     repeated with `text ~ "<key entity name>"` for each major entity from
     Step 2. Prioritize tickets with substantial descriptions/comment threads
     that explain WHY a design choice was made, not routine bug fixes.
   - Also search by the specific field or property name of each candidate
     change itself — not just the domain or entity name. A shared/common-type
     field (e.g. `GenerationCodeSuffix` inside `Common/Name.metaed`) belongs
     to no single domain and will never surface from a domain- or
     entity-scoped search alone; searching only "StudentApplication" or
     "Application" misses a ticket that's actually about
     `GenerationCodeSuffix`.
   - Confluence RFC space: search among descendants of
     `https://edfi.atlassian.net/wiki/spaces/rc/pages/712278041/Ed-Fi+Data+Standard+Request+for+Comments+RFC`
     using the domain name, key entity names, and the same field/property
     names, plus a general CQL search in case a relevant RFC isn't nested
     under that page. **`acli confluence` has no search/CQL command as of this
     writing** — only `acli confluence page view` for a page you already have
     the ID/URL for — and it needs its own separate login
     (`acli confluence auth login`, browser or API-token flow) independent of
     `acli jira auth`. Run `acli confluence auth status` first; if
     unauthenticated, do not silently skip this row — log it as
     `[Verify — Confluence not authenticated/searchable with current tooling]`
     in Sources Consulted, the same as any other unreachable source, rather
     than reporting "checked, nothing found."
   - GitHub product backlog: not every roadmap item has a Jira ticket, and
     some exist only as a community-facing GitHub Issue — run
     `gh search issues "<query>" --repo Ed-Fi-Alliance-OSS/Ed-Fi-Technology-Roadmap`
     repeated for the domain name, each key entity name, and each field/
     property name, same as the Jira search above. Treat an open issue with
     a substantial description the same as an open Jira ticket for citation
     purposes.
3. Check `review-model-pr`'s checklist as binding house convention —
   naming (singular entity names, no "Information" suffix), key/identity
   ordering (Student key before EducationOrganization), deprecation
   discipline (deprecate, don't delete), the slowly-changing-dimension
   prohibition (no BeginDate/EndDate pairs on demographic/identity
   entities without a clear calendar-based reason), and shared-string
   reuse — not just PR-review nitpicks.
4. Check `<NEEDS_DOCS_DIR>` and `<GITHUB_ISSUE_DRAFTS_DIR>` for prior
   related asks from other
   states/stakeholders.

Keep a running log of every search performed in this step and its outcome.
Include searches that found nothing relevant — a null result is itself
useful information for a reviewer, not something to omit.
This log becomes the design doc's Sources Consulted section (see Output
Artifacts), so a reviewer can see exactly what was checked rather than
trusting the verdicts blindly.

### Step 4 — Form an Opinion Per Proposed Change

Give each candidate change a verdict of **Recommend**, **Caution**, or
**Reject**, grounded in a specific citation — a Jira ticket, a GitHub product-backlog issue,
an RFC, a named convention rule from Step 3, or a prior need doc. For example:
"Reject: adds a BeginDate/EndDate pair to a demographic entity, conflicting
with the SCD prohibition, with no prior ticket overriding it" or
"Recommend: mirrors DATASTD-1481's precedent for converting free text to a
descriptor."

If Step 3 turns up an open, unresolved ticket proposing this same or a
closely related change, name it explicitly in the citation regardless of
verdict — this matters most on a Caution or Reject, where leaving it out
makes the verdict read as a closed door when it isn't. For example:
"Reject against today's model — but note: DATASTD-1481 is open and
proposes this exact change; flag for consideration rather than treating
as settled."

**When the source doc's own suggested approach earns a Caution or
Reject** — it conflicts with a convention, a prior governance decision, or
existing precedent — push back explicitly before proceeding: state the
conflict plainly and cite the specific precedent it contradicts. The user
has final say and can override, but the override must be an
explicit choice they make after seeing the conflict, never a silent
pass-through of the source doc's wording. Stop and wait for the user's
response before drafting the change — do not state the conflict and
continue in the same turn. If they do not respond to the conflict, treat
the change as unresolved and do not include it. Record which happened
(adopted the pushback, or user overrode with reason) in the design doc's
change-detail table (see Output Artifacts) so the override is visible to
later reviewers.

### Step 5 — Draft the Design Interactively

Present entities, associations, descriptors, attributes, cardinality,
identity, and naming section by section, asking for confirmation before
moving on: one topic at a time, numbered options when presenting choices,
confirm your interpretation before finalizing each section. Never fabricate
a specific Ed-Fi entity, DS version number, state name, or vendor name — if
uncertain, use a placeholder and flag it with `[Verify]`.

### Step 6 — Generate Artifacts

Once the use case or batch's design is confirmed: generate the design doc by default
(see Output Artifacts); generate the data dictionary and `.metaed` only if the user
explicitly asked for them. Then return to Step 1 for the
next confirmed use case or batch, if any remain.

### Critique Mode Entry Point

When triggered in critique mode, skip Steps 0-1 and 5 entirely. Take the
submitted design or an existing state extension (markdown, `.metaed`
file(s), or a data-dictionary spreadsheet) as the set of candidate
changes directly, then run Step 2 (review current model — to see what
the submission would actually change), Extension Fit Mapping (when the
input is an extension rather than a new design proposal), Step 3 (check
precedent), and Step 4 (form an opinion, including mandatory pushback)
against it. Produce the same default artifacts as Design mode,
but as an annotated review — verdicts/comments plus an ER diagram
contrasting the submission against the current model — rather than a
from-scratch draft.

## Output Artifacts

Saved to `<MODEL_DESIGNS_OUTPUT_DIR>\[topic]\` —
**one subfolder per design topic**, not one flat folder holding every design
ever produced. Create the subfolder if it doesn't exist.

The topic folder holds the whole unit of work: the **source input** the design
was built from (a state's extension export, e.g.
`TEA_Student_Application.txt`) alongside every artifact produced from it — the
design doc, the critique doc, the workbooks and their `.json` inputs. Keeping
the export in one tree and the design in another is what made it hard to tell,
months later, which source a given design was actually built on.

`[topic]` is a short folder name for the design subject. It does not have to
match the `[topic]` slug in the filenames exactly — the worked example is
`application\`, holding the `StudentApplication` design.
**Confirm the folder name with the user** when creating it, the same as for a
new `.metaed` filename.

**Generated by default:**

1. `DS-Design_[Domain]_[topic].md` — narrative design doc: entities/
   associations/descriptors touched, the change-detail table (Add /
   Update / Deprecate, breaking vs. non-breaking, and — per Step 4 —
   whether each item was a Recommend/Caution/Reject and whether the user
   overrode a Caution/Reject), and a Mermaid ER diagram (using `erDiagram`)
   of the affected domain. Follow `references\mermaid-er-example.md` for
   diagram conventions — do not rely on node/attribute color styling; use
   inline comments and a legend instead.
   Also always includes the Sources Consulted section below — this is the
   reasoning trail, always generated with the doc, never on-request-only.

### Sources Consulted

Populated from Step 3's search log. One row per source actually checked
per candidate change, including a source that turned up nothing:

| Candidate Change | Source Checked | Query / Search Run | Result |
|---|---|---|---|

Sources to log: the domain-dossier lookup, Jira, the Confluence RFC
space, the GitHub product backlog, local Needs Docs/GitHub Issues, and
the `review-model-pr` conventions checked. A row reading "none found"
is exactly as important as a row citing a ticket — it tells a reviewer
what was actually searched, not just what was found.

When Extension Fit Mapping ran (see Step Flow), the design doc also
gets a dedicated subsection:

### Extension Fit

Open with a two- or three-line reminder covering both: (a) "New to core" is
a neutral Fit value, not a defect flag, and (b) "New to core" and
"Established core concept, new placement" are not interchangeable — the
first means the concept is absent from the whole model, the second means
it's well-precedented elsewhere and just wasn't on the one entity compared
against. See Extension Fit Mapping above for the exact wording. Both
distinctions are easy to blur on a skim, so restate them inline rather than
relying on the reader to remember the step definition.

| Extension Element | Maps to Core (or "— none in core") | Fit | Recommended Adjustment |
|---|---|---|---|

One row per extension element, using the verdict from Extension Fit
Mapping (Maps cleanly / Partially maps / Established core concept, new
placement / New to core / Missing) in the "Fit" column. For an
"Established core concept, new placement" row, name the specific core
type/entity where the concept is already established (e.g. "`SchoolYear`
enumeration — established via `Session`, `Calendar`, ~20 others") so a
reviewer doesn't have to take the classification on faith. For a "New to
core" row where the shape is sound, say so plainly in the Recommended
Adjustment column (e.g. "Not a defect — no core analog anywhere; no
conflict found") rather than leaving it blank or reaching for a criticism.
For "Partially maps," a flawed element in either "new placement" or "new to
core," or a "Missing" row, give a concrete recommendation for how to adjust
or add it to fit core convention.

**Generated only on explicit request** (the design doc above is the
primary deliverable — an initial analysis/critique pass should not
produce more than that unasked):

1. `DS-Design_[Domain]_[topic]-DataDictionary.xlsx` — one sheet per
   entity/association touched. Build it by writing a JSON file matching
   the `entities` shape documented in
   `scripts\generate_data_dictionary.py`, then running:
   `python "<DATA_DICTIONARY_SCRIPT>" <input.json> "<MODEL_DESIGNS_OUTPUT_DIR>\[topic]\DS-Design_[Domain]_[topic]-DataDictionary.xlsx"`
   — expand both tokens from ## Paths, and note the `[topic]` subfolder.
   Do not write the `.xlsx` by hand or with ad hoc code — always go through
   this script so column shape and layout/styling stay consistent across
   every design doc this skill ever produces. Layout and styling (fonts,
   fills, borders, column widths, freeze panes) match the Intervention
   domain's reference data dictionary — that fidelity lives in the
   script itself, not something to reproduce by hand per run.

   **Save the input JSON beside the workbook**, same filename stem with a
   `.json` extension — never only in a scratchpad. The `.xlsx` is a render,
   not the source; when the JSON was left in a temp folder it was lost
   between sessions, and the next change had to be made by reverse-
   engineering content back out of the spreadsheet. Regenerating from the
   saved JSON is the supported path for every later edit.

   The workbook is **seven columns**: the reference workbook's six, plus
   **Core Fit** — a deliberate, reasoned divergence from the reference's
   shape; do not "correct" it back out. Column conventions, the Commons tab,
   reuse provenance, row-height rules and the design/critique mode contract
   are specified in `references\data-dictionary-spec.md`. Read it before
   writing the input JSON — the script enforces much of it and will raise
   rather than emit a workbook that violates it.

   The input JSON carries a required `"mode"` of `design` or `critique`.
   A critique workbook renders a design **as submitted**; an element the
   submission does not contain must not have a row in it.
2. `.metaed` files, named after the actual entity/association/descriptor
   they represent (not the topic), placed under a matching subfolder
   (`DomainEntity\`, `Association\`, `Descriptor\`, etc.):
   - **New** entity/association/descriptor -> one full file,
     `<EntityName>.metaed`. Confirm the exact name with the user at
     creation time — the name IS the filename and matters for review.
   - **Update** to an existing entity -> not a full file (would clobber
     the real one) — a snippet file, `<EntityName>.update.metaed`,
     showing only the added/changed elements, with a one-line note on
     where they go in the existing file.

Critique mode produces the same default artifact (the doc only) as
Design mode, but as an annotated review — verdicts/comments plus an ER
diagram contrasting the submission against the current model — rather
than from-scratch drafts. `.xlsx` and `.metaed` both stay on-request-only
in critique mode too — an initial critique of a problematic existing
extension does not need a data dictionary generated unasked.

## Reference Materials

Pointers, not duplicated content — read these live each time rather than
relying on memory, since they change independently of this skill:

- Current model: `<EDFI_MODEL_PACKAGE_DIR>`
- Prior DS versions: the MetaEd IDE vscode extension's bundled model
  packages (see Step 2)
- House conventions: `review-model-pr`'s checklist (binding style rules,
  not just PR-review nitpicks)
- Historical precedent: live Jira (`DATASTD`, `MODL`) via `acli jira workitem
  search --jql` (not the Atlassian MCP connector — see Step 3) + the
  Confluence RFC space + the GitHub product backlog (`gh search issues`, repo
  `Ed-Fi-Alliance-OSS/Ed-Fi-Technology-Roadmap`); existing Confluence
  `domain-dossier` pages (`DATASTDDEV` space, folder `2664398901`), checked
  first before a fresh live search. Confluence access via `acli` is
  currently view-only for a known page — no working live search tool for
  Confluence exists in this environment yet; see Step 3 for how to log that
  gap rather than skip it silently.
- Local precedent: `<NEEDS_DOCS_DIR>` and `<GITHUB_ISSUE_DRAFTS_DIR>`

## Explicitly Out of Scope

- Editing files in the real `Ed-Fi-Model` repo directly — output is drafts
  in `Model Designs\`, not a PR.
- Generating the GitHub Issue draft itself — that step already exists
  upstream in this pipeline (produced manually or by another skill before
  this one runs).
- Automating Confluence dossier _page creation_ — this skill only _reads_
  existing dossiers/precedent; publishing a new dossier stays with the
  separate `domain-dossier` skill.

## Behavior Rules

- Always be collaborative and conversational — guide the user step by
  step, one topic at a time.
- Use only the source material provided (the needs doc/Issue draft) plus
  the live model/Jira/Confluence lookups in Steps 2-3 to answer. Do not
  draw on outside knowledge for facts about the Ed-Fi model.
- Never fabricate a specific Ed-Fi entity, DS version number, state name,
  or vendor name. If uncertain, use a placeholder and flag it with
  `[Verify]`.
- For every claim in the design doc, cite the specific source it came from
  (a needs-doc passage, a Jira ticket, an RFC, a convention rule) — this
  mirrors `DS Product Needs`'s citation discipline.
- If the user is unsure about something, offer to leave the field blank
  with a placeholder and move on rather than guessing.
- Default descriptor values (the value set a descriptor ships with) are set
  later in the pipeline, not at design time. When the user has not
  mentioned default values for a descriptor, define the descriptor (its
  name, its documentation, and the `Examples include:` list that
  documentation needs under review-model-pr §3) and stop there. Do not add
  a default-values open item, a `[Verify]` on its values, an implementation
  note that it needs defaults, or a question to the user about its values.
  When the user raises default values for a descriptor, they are in scope
  for that descriptor.

## Red Flags

Three rules in this skill get skipped under pressure by an agent that knows
them perfectly well. These are the thoughts that precede each skip. Treat any
of them as a stop signal, not a conclusion — they are self-checks for the
moment of rationalising, so they are written as the thought, not the rule.

**Completeness pressure — the strongest one.** An unfilled cell in an
otherwise finished table reads as unfinished work, and the pull to close it is
real:

- "One blank cell will look like I missed it."
- "It's obviously one of these two candidates."
- "A best guess is more useful to the reviewer than nothing."
- "The requester already told me which one it is."
- "I'll fill it in now and flag it in the narrative doc."

All of these mean: write `[Verify]` if the element is submitted but its shape
is unresolved, or leave it blank if the fit is genuinely undetermined, and say
what you would need to resolve it. An honest gap is a finding. A guess is a
fabrication that a reviewer cannot tell apart from a verified value. This has
already cost two wrong answers in a row on `SchoolChoice` — first core's
`SchoolChoiceBasis` descriptor, then core's `bool SchoolChoice`, both wrong,
both confidently offered.

**Novelty from a single comparison:**

- "The closest analog doesn't have it, so it's new."
- "I already read that entity; grepping the whole tree is overkill for eleven
  elements."

Both mean: grep the whole `package` tree before writing "New to core."
`SchoolYear` was called new to core on exactly this reasoning; it is a core
enumeration used as an identity element on roughly twenty entities.

**Invented precision:**

- "VARCHAR(50) is a sensible length for this."

Means: cite the length from the `.metaed` shared type or the extension's own
declared SQL type, or omit the `SQL Recommended DataType` line entirely.
