---
name: data-standard-rfc
description: Use when writing, drafting or revising an Ed-Fi Data Standard RFC (Request for Comments), when turning a DS-Need document or a model design into an RFC, or when asked for "RFC 29b", "an RFC for <domain>", or to open the RFC pull request on Ed-Fi-API-Specifications.
---

# Ed-Fi Data Standard RFC

## Overview

Produces an Ed-Fi Data Standard RFC from a **DS-Need document** or
**`model-designer` output**, then opens it as a draft PR on
`Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications`.

**Core principle: an RFC is a public Alliance publication, and the input is
not.** A need doc is internal analysis with provenance markers, internal-only
impact sections, granular use cases and unresolved options. Turning it into an
RFC is a _reduction_, and the reduction is the whole job. Copying is failure.

## Where this sits

```
DS Product Needs -> model-designer -> [ data-standard-rfc ] -> Community Discussion -> merge
   (need doc)        (model design)        (this skill)         (human-driven)      (human)
```

This skill does **not** design the model. If the input has no model decisions
in it, stop and route to `model-designer`. It also does not run the community
discussion — it stops at the draft PR.

## When NOT to use

- Designing or critiquing a model -> `model-designer`
- Producing the need document -> `DS Product Needs`
- Reviewing a model pull request -> `review-model-pr`

## The four rules

Read `references/reduction-rules.md` before drafting. In brief:

| | Rule |
|---|---|
| **R1** | Internal-only content never leaks. No exceptions. |
| **R2** | No silent citation promotion — restate, attribute, question, or drop. |
| **R3** | Directional grounding: verify backward-facing claims; never look up proposed ones. |
| **R4** | One design. A live fork becomes a numbered community question, never a second chapter. |

Plus one shaping rule: **exactly three named, thematic use cases.**

## Workflow

### 1. Read the corpus, not your memory

Conventions come from the live repository every run. A local copy of an RFC on
disk may be stale or misnamed.

```bash
gh api repos/Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications/contents/RFC --jq '.[].name'
gh pr list --repo Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications --state open \
  --json number,title,headRefName
```

`RFC-29a` is the reference implementation. See `references/rfc-anatomy.md`.

### 2. Resolve the model package

```bash
python scripts/resolve_model_package.py
```

Record the printed `projectVersion` — it goes in the run summary. If this
fails, R3 degrades: every baseline claim gets `[Verify]` and the summary leads
with `model grounding UNVERIFIED - package not resolved`.

### 3. Settle the blocking decisions (default mode)

Ask these together, once, before drafting. Propose a value for each; never
assume one.

1. **RFC number + letter** — from live state. The numbering rule is
   undocumented; see `references/header-and-numbering.md`. Ask.
2. `Affects:` target DS version
3. `Status:` — `Draft` / `Draft for community feedback` / `Early Access`
4. `Author:`
5. **Structural variant** — reshape or enhancement-list
6. **Model option**, if the input carries competing ones (R4)
7. **Use-case consolidation** — propose the grouping to three

On `--draft`, skip this round and emit one pass with `[Decision needed]`
markers at each of the seven points instead.

### 4. Ground the baseline claims

```bash
python scripts/verify_baseline_claims.py --dump-entity <Entity>
python scripts/verify_baseline_claims.py --claims claims.json
python scripts/verify_baseline_claims.py --collisions <NewName1>,<NewName2>
```

Every `Type` and `Required` value for an existing field, and every
current-key row in the migration table, comes from this — not from the input's
diagrams.

### 5. Draft

Follow `references/rfc-anatomy.md` exactly. Header block per
`references/header-and-numbering.md`.

### 6. Check R1 held

Build a stop-list from the input's internal-only sections, **assert it is
non-empty**, then grep the output for every term. A grep against an empty
stop-list passes without checking anything.

### 7. Write the outputs

- `RFC/RFC-<NNx>_<Topic>.md`
- `RFC/README.md` TOC entry — part of the deliverable, not optional
- Branch `<TICKET>-<Topic>-RFC`, then `gh pr create --draft`

### 8. Report

State, always: model version grounded against (or `UNVERIFIED`) · sections
generated · every `[Verify]` and `[Decision needed]` left · internal-only
sections excluded, with stop-list size · baseline mismatches and name
collisions found.

## Rationalizations — every one of these was observed under pressure

| Excuse | Reality |
|--------|---------|
| "The request asked for the full picture, so I included the impact section" | The request asked for a good RFC. Impact analysis is not part of one. Produce it separately. |
| "Those facts are already public information" | Assembling public facts into an Alliance publication is a new act of publication. Not your call to make. |
| "Other RFCs name states and vendors" | They credit design _contributors_ and attribute design _decisions_. None publish adoption rosters, funding figures, or inferred vendor benefit. |
| "It's program information, not personal data" | The bar is the author's internal-only marking, not a privacy category. |
| "I flagged the override in my report" | The document is what gets posted. A flag elsewhere does not unpublish it. |
| "I kept every claim, I just removed the citation markers" | That is the promotion. A claim that had only an internal citation cannot become a flat assertion. |
| "In-session analysis is as authoritative as the source documents" | It is the least reviewed content in the input. Verify, attribute, or drop it. |
| "The deadline meant no time to verify against the model" | The scripts take seconds. A wrong migration table outlives the deadline. |
| "The source authors verified it, so I can rely on their transcription" | In testing that transcription had two name collisions, one omitted field, and one field that exists nowhere. |
| "Presenting both options is more even-handed" | It hands the reader the analysis instead of a proposal. Resolve it, or make it a numbered question. |
| "Each source use case deserves its own subsection" | The corpus is three. Detail belongs in the entity prose under `## Model`. |
| "The workgroup needs to see the risks and tradeoffs" | Then brief them. The RFC has `Questions for the Community` for genuinely open items. |

## Red flags — stop and re-read the rules

- You are about to write a section called Adoption Impact, Community Benefits,
  Risks & Tradeoffs, Stakeholders, or Analysis Performed
- A dollar figure, district count, or vendor list is in your draft
- You are writing "benefit is inferred" about a named third party
- The draft has two ER diagrams, or an "Option A / Option B" heading
- Use case subsections are lettered, or number more than three
- A `Type` or `Required` value came from a Mermaid diagram
- You typed a `[Verify]` and then removed it without running the script
- You are recording a rule violation in a report rather than not committing it

**Each of these means: stop, re-read `references/reduction-rules.md`, and fix
the document — not the report.**

## Modes

| Mode | Behavior |
|---|---|
| default | Blocking-decision round, then draft in one pass |
| `--draft` | No blocking round; one pass with `[Decision needed]` markers |
| `revise` | Update an existing RFC post-discussion: preserve the header block, bump `Status:`, leave an existing TOC entry alone |

## Reference files

| File | Contents |
|---|---|
| `references/rfc-anatomy.md` | Both structural variants, section by section; sections that must not appear |
| `references/header-and-numbering.md` | Header block, status vocabulary, numbering, TOC entry, branch and PR |
| `references/reduction-rules.md` | Section mapping, R1-R4 in full, use-case consolidation recipe |
| `references/process-context.md` | Where RFC Development sits in Ed-Fi governance |
