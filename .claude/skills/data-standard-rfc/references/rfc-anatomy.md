# RFC anatomy

Derived from the live corpus in `Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications`,
read 2026-09-03:

| RFC | State | Lines | Variant |
|---|---|---|---|
| `RFC-28b_Special-Education-Data-Model.md` | merged, `Early Access` | 310 | reshape |
| `RFC-29a_OpenStaffPosition.md` | PR #60, `Draft for community feedback` | 239 | reshape |
| `RFC-28a_Data-Standard-6.1-Enhancements.md` | PR #57, `Draft` | 67 | enhancement list |

`RFC-29a` is the reference implementation: newest, richest, and the shape most
domain work takes.

> A local copy at `From Temp/SEDM Docs/documentation/RFC-28a.md` is **misnamed**
> — it holds RFC 28**b** content as an earlier 258-line draft. Always read
> conventions from the repository, never from a local copy.

---

## Variant A — model reshape (28b, 29a)

Use when the work involves new entities, identity changes, relocations,
renames, deprecations, or breaking migration.

```
# Ed-Fi RFC <NNx>: <Title> (<Domain> Domain)

<header block -- see header-and-numbering.md>

<Month D, YYYY>

## Synopsis
## Overview
## Use Cases
### <Named use case>            x3, thematic
## Model
### Entity Relationship Overview
### <Entity>                     one per entity
## Breaking Changes & Migration  omit only if genuinely non-breaking
## Questions for the Community
## Timeline
## How to Respond
```

Optional sections, all from 29a, include only when there is real content:
`### New Descriptors`, `### Naming Conventions`,
`### Design Principle: <name>`.

### Synopsis

Two paragraphs. The first is near-boilerplate; match the corpus:

> This Request for Comments (RFC) includes materials that describe proposed
> revisions to the Ed-Fi Data Standard. This draft material is intended to
> support review and comment; users of this material are advised that this
> work is still under development.

28b's variant adds "as well as support early usage" because its status is
`Early Access`. Match the wording to the status.

The second paragraph is one to three sentences: what this RFC does, in the
present tense. 28b: "RFC 28(b) merges the Special Education Data Model
(SEDM)... It introduces five new domain entities that model..."

### Overview

Two to four substantial paragraphs, no sub-headings in the reshape variant:

1. How the domain is represented today, named concretely (28b opens on
   `StudentSpecialEducationProgramAssociation`).
2. Why that representation is misaligned with how the domain actually works.
3. What the proposed model does differently, and what that enables.

Write about the _model_, not about the analysis that produced it. There is no
"artifacts reviewed" or "analysis performed" section in any RFC.

### Use Cases

**Exactly three, thematic, one substantive paragraph each** in both reshape
RFCs. Named for the capability, not lettered:

- 28b: IDEA Reporting and Compliance · Progress Monitoring · IEP Portability
- 29a: Tracking Positions Independently of Requisitions · Range-Based Grade
  Levels for Staffing · Staffing-Scoped Instructional Subjects

A need doc's granular, lettered use cases get **consolidated** into these. Do
not carry over an A–K list; see reduction-rules.md.

Each paragraph explains why the capability requires a model change — not what
a particular tool does, and not which vendor asked.

### Model

`### Entity Relationship Overview` holds a Mermaid `erDiagram`, followed by a
notation legend. 29a's, verbatim, is a good default:

> **Notation:** `I` = identity / key · `R` = required · `O` = optional ·
> `C` = collection (`RC`/`OC`) · flags: `NEW`, `DEPRECATE`, and inline notes
> for relocations/renames.

29a also cites its diagram source file by name
("Diagram is an exact match of `OpenStaffPosition - Current and Future
Comparison.mmd`"), then a sentence on the key cardinality in prose.

**Exactly one diagram.** If the design has competing options, resolve to one
before drafting — see rule R4.

Then one `### <EntityName>` subsection per entity, each with:

1. A prose paragraph: what the entity represents, what its identity is and
   why, what moved and what stayed. This is where design rationale belongs.
2. `**Identity**` table: `| Field | Type | Description |`
3. `**Properties**` table: `| Field | Type | Required | Description |`

An entity whose only change is a proposed deprecation gets a short prose
subsection with no tables (29a's `### OpenStaffPositionEvent`).

Type column vocabulary, as used in the corpus: `Reference`, `Descriptor`,
`Descriptor collection`, `Common`, `String`, `String (20)`, `Date`, `Decimal`,
`Boolean`, `Enumeration`. Get lengths and cardinality from the model, not from
the need doc — see reduction-rules.md R3.

Required column: `Required` or `Optional`, capitalized.

Descriptions carry change provenance inline: "Existing field, unchanged.",
"Renamed from `PositionControlNumber` and promoted to the identity.",
"New common type; replaces `OpenStaffPositionReason` (deprecated)."

### Breaking Changes & Migration

A key-change table, then a bullet list of every individual change:

```
| Entity | DS 6.0 key | Proposed DS 7.0 key |
```

Close with an interim note when one applies: 29a's "**Interim (DS 6.1):** the
elements/entity slated for change would be **flagged as deprecated in v6.1**
to give the community advance notice. No structural change occurs in 6.1."

Every current-state key in this table is a baseline claim. Verify all of them.

### Questions for the Community

A numbered list, each item a **bold lead-in** then the question. Real open
questions only — things the answer genuinely changes. 29a's four are a good
calibration: ed-org level, descriptor naming, a proposed deprecation, and a
scope boundary (candidate tracking in core vs. extensions).

This is where an unresolved design fork belongs (R4), and where an
internal-only "decisions needed" list gets converted into something
community-facing.

### Timeline

Two or three bullets: target release, and community milestones already reached
or scheduled. 29a: "introduced at DSWG June 2026; feedback window open now
toward finalization."

### How to Respond

Short paragraph asking for implementation context plus answers to the numbered
questions.

---

## Variant B — enhancement list (28a)

Use when the work is a set of small, additive, non-breaking changes with no
new entities and no identity changes.

```
## Synopsis
## Overview
### Problems
### Impact
## Use Cases
## Proposal
### 1. <Change stated as a full sentence>
#### 1.1 <Sub-change>
### 2. <Change>
## Implementation Notes
```

Notably shorter — 67 lines. `## Proposal` items are numbered and the heading
text is a complete statement of the change, e.g. "Add an Optional Reference to
the ResponsibleEducationOrganization in the
StudentEducationOrganizationResponsibilityAssociation (SEORA) and clarify
documentation...". No per-entity Identity/Properties tables.

---

## Choosing the variant

| Input has | Variant |
|---|---|
| New entities, identity changes, relocations, breaking migration | A |
| Only additive optional elements, no identity change | B |

Propose the variant with your reasoning and confirm it. Never pick silently.

---

## Sections that do NOT belong in an RFC

No RFC in the corpus contains any of these. They are the sections a need
document naturally supplies, and adding them is the most common structural
drift:

- Community Benefits / Adoption Impact / Risks & Tradeoffs
- "Analysis performed" or artifacts-reviewed lists
- Stakeholder rosters, vendor lists, funding figures
- Inline `*(cite: ...)*` markers — zero across all three RFCs
- Anything marked "Internal only" in the source
- An AI-authorship banner (disclose out-of-band; do not invent a convention)

Community benefit belongs _inside_ the Use Cases as capability, not as its own
section listing who gains.
