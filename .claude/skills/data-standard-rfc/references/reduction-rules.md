# Reduction rules: need doc -> RFC

A DS-Need document is not a draft RFC. It is an internal analysis written for
reviewers who need provenance. An RFC is a public design document written for
implementers who need a decision. Getting from one to the other is a
**reduction**, and the reduction is where things go wrong.

Measured on `DS-Need_Performance-Evaluation_IIA-Obs-Feedback-v2.md` (662 lines)
against the three-RFC corpus:

| | DS-Need | RFC corpus |
|---|---|---|
| Inline `*(cite: ...)*` markers | 136 | 0 |
| `Internal only` sections | 3 | 0 |
| Use cases | 11, lettered A-K | 3, named and thematic |
| Competing model options | 2, both live | 1 resolved design |

---

## Section mapping

| DS-Need section | RFC destination |
|---|---|
| §0 Metadata | Header block; ticket goes in the PR body, not the RFC |
| §1.1 Gaps identified | `## Overview` (variant B: `### Problems`) |
| §1.2 Why the gap exists | `## Overview`, the middle paragraph |
| §2 Detailed use cases (A-K) | `## Use Cases`, **consolidated to three** |
| §3 Community benefits | Folded _into_ the Use Case paragraphs. **Not its own section.** |
| §4.1 Proposed changes | `## Model` prose + per-entity subsections |
| §4.2 Change detail table | `## Breaking Changes & Migration` |
| §4.3 Model sketch | `### Entity Relationship Overview`, **one diagram** |
| §5 Analysis performed | **Dropped.** No RFC has an artifacts-reviewed section. |
| §6 Internal only: Impact | **Dropped. See R1.** |
| §7 Proposed timeline | `## Timeline` |
| §8 Internal only: Decisions needed | Community-facing items -> `## Questions for the Community`. Internal asks dropped. |
| §9 Internal only: Appendix | Open questions -> `## Questions for the Community`. Rejected alternatives -> the relevant entity's prose rationale. Evidence lists dropped. |

---

## R1 — Internal-only content never leaks

Anything the source marks `Internal only`, and anything derived solely from
it, does not appear in the RFC. No exceptions.

**This is the rule that broke under pressure in testing**, so the specific
workarounds are named:

- Not when the request asks for "the full picture" or "all the detail"
- Not when the facts happen to be publicly available elsewhere
- Not because other RFCs name a state or a partner organization
- Not in softened form under a new heading
- Not "flagged for review" in a report while still present in the document —
  the document is what gets posted
- Not because the content is not _personally_ sensitive

**Why the "already public" argument fails:** an RFC is a formal Alliance
publication. Assembling scattered public facts into an Alliance-authored
document about who benefits and by how much is a new act of publication with
the Alliance's name on it. The source author marked the section internal;
that marking is a decision by someone with context you do not have. Overriding
it is theirs to do, not yours.

What the corpus actually does is narrower than "names states and vendors".
Verified across all three RFCs:

| Pattern | Example | Allowed? |
|---|---|---|
| Credit a **co-designer** of the model | RFC-28b: "designed collaboratively by Education Analytics, AEM Corp, Public Consulting Group (PCG), and the South Carolina Department of Education" | Yes |
| Name a **field implementation** that informed the design | RFC-29a: "Texas (TEA), currently on DS 4.x, extended the model with two entities ... It is the primary field implementation informing this RFC" | Yes |
| Attribute a **design decision** | RFC-29a: "TEA confirmed (March 2026) `AcademicSubject` should not be reused for this purpose" | Yes |
| Cite **survey evidence** for a design choice | RFC-29a: "other surveyed states reported no active use of `OpenStaffPosition`" | Yes |
| Adoption/benefit roster, funding figures, inferred third-party benefit | — | **No. Appears nowhere.** |

Two hard numbers: **zero dollar figures** across all three RFCs, and RFC-29a
states its own naming principle as keeping the entity name "**agnostic**
(rather than 'StaffRequisition') to align with field usage and **avoid
state-specific framing**."

So the test is not "is this party named anywhere in the corpus" but a
**two-part** test, and both parts must hold:

1. **Role** — did they contribute to, or evidence, the _design_? Co-designer,
   field implementation that informed it, source of a design decision, survey
   respondent. Not "will benefit from it".
2. **Provenance** — is that contribution documented _outside_ the input's
   internal-only sections?

Part 2 is what keeps part 1 from becoming a loophole. A vendor listed only in
an internal-only impact roster cannot be promoted to "co-designer" on the
strength of that roster. If §0 or the body documents them as a co-developer,
crediting them is the RFC-28b pattern; if the only mention is in the
internal-only section, they do not appear.

Naming a co-designer is attribution. Listing who will benefit and by how much
is impact analysis, and it belongs in the roadmap ticket.

**If the request explicitly asks for impact content:** say that it belongs in
the internal roadmap ticket or the DSWG briefing rather than the RFC, produce
the RFC without it, and offer the impact material as a separate internal
document. Do not resolve the conflict by including it.

### The stop-list check

After generating, verify R1 held:

1. Extract distinctive terms from the input's internal-only sections — proper
   nouns, dollar figures, vendor names, program names, acronyms.
2. Assert the stop-list is **non-empty**. A zero-length stop-list means the
   section parsing failed, and a grep against nothing passes vacuously.
3. Grep the output for every term **with word boundaries**:
   `grep -cE '\bTEA\b'`, not `grep -ci TEA`.
4. Report the stop-list size alongside the result, so a reader can see the
   check had something to check.
5. Read every hit before acting on it.

**Steps 3 and 5 exist because of a real false positive.** A case-insensitive
substring grep for `TEA` reported six hits in a clean RFC — all of them inside
`ins`**`tea`**`d` and `Co`**`tea`**`ching`. A short acronym will collide with
ordinary English constantly. An unread hit count is not a result: it will
either raise a false alarm, or mask a genuine leak inside a pile of noise you
have learned to ignore.

---

## R2 — No silent citation promotion

136 markers become 0. The apparatus goes; the epistemic status must not
silently improve.

For each claim that carried only a `*(cite: ...)*` pointing at an internal
document or an in-session analysis, choose one:

1. **Restate as design rationale** — argue it from the model.
   "Anchoring feedback to the rating occurrence preserves which plan was in
   effect when the feedback was given."
2. **Attribute in prose**, the RFC-29a pattern.
   "TEA confirmed (March 2026) that `AcademicSubject` should not be reused for
   this purpose."
3. **Move it to a community question**, if it is really an assumption.
   "Is `School Category` sufficient for this need?"
4. **Drop it.**

Never option 5: delete the marker and keep the sentence as a flat assertion.

**The specific trap from testing:** a need doc may cite its own in-session
analysis (`*(cite: this session's verification)*`). Those are the _least_
established claims in the document, not the most. Treating them as equal in
authority to document-sourced claims, then stripping the marker, promotes an
unreviewed inference into an Alliance publication. Verify it against the model
(R3), attribute it, or drop it.

---

## R3 — Directional grounding

Verify claims that point backward at the current model. Never look up claims
that point forward at the proposed one.

| Claim shape | Action |
|---|---|
| "existing field, unchanged" · "retained" · "renamed from X" · "relocated from Y" · "deprecate Z" · "the current key is K" · any `Type` or `Required` value for an existing field | **Verify** |
| "new entity / field / descriptor / common" | **Never look up for existence** |
| A proposed name that already exists | **Flag as a collision** |

Use the scripts; they encode the directionality so it cannot be got wrong by
hand:

```bash
python scripts/resolve_model_package.py
python scripts/verify_baseline_claims.py --dump-entity EvaluationRating
python scripts/verify_baseline_claims.py --claims claims.json
python scripts/verify_baseline_claims.py --collisions FeedbackEntry,ObservationSetting
```

A claim with no `direction` defaults to `baseline` and **is** verified.
Marking something `proposed` to skip verification is the one way to defeat
this rule.

**When the package will not resolve:** mark every baseline claim `[Verify]`
and make `model grounding UNVERIFIED - package not resolved` the first line of
the run summary. Do not quietly proceed on the need doc's transcription.

### Why this matters even when the need doc is right

In testing, a need doc's nine current-key claims were all correct. Grounding
still earned its place, because the same run surfaced four defects the doc did
_not_ have right — two name collisions, one omitted existing field, and one
field present in the diagrams that exists nowhere in the model. Baseline
verification is insurance against a wrong migration table, and it doubles as
a defect finder for the input.

---

## R4 — One design, explicit forks

A need doc may carry competing options. An RFC presents one design.

- Pick one, with the human. Never both.
- The discarded option either disappears, or becomes a numbered
  `Questions for the Community` item — RFC-29a's treatment of
  `OpenStaffPositionEvent` ("Deprecation ... is **proposed** to the community
  ... The model retains it until the community decides").
- Never reproduce two ER diagrams. One `### Entity Relationship Overview`.
- A genuinely undecidable fork is a question, not a pair of chapters.

Presenting both options with both diagrams looks even-handed and is actually a
failure to design: it hands the reader the analysis instead of a proposal.

---

## Use-case consolidation

The corpus is **exactly three** named, thematic use cases, one substantive
paragraph each. In testing, unconstrained runs produced five and eleven.

Recipe:

1. Group the source's cases by the **capability** they unlock, not by the
   field they touch.
2. Name each group for that capability, in title case, no letters or numbers.
3. Write one paragraph per group: what the capability is, why the current model
   cannot support it, what the proposed model changes about that.
4. Propose the grouping to the human before drafting.

For Performance Evaluation's A-K, a defensible grouping:

| Theme | Source cases |
|---|---|
| Observation Context and Conferencing | A, B, C |
| Structured Feedback and Action Steps | D, E, J |
| Evaluation Metadata Reuse and Grain | F, G, H, I, K |

Three paragraphs, not eleven. Detail that does not fit belongs in the entity
prose under `## Model`, where it is about the model rather than about a tool.
