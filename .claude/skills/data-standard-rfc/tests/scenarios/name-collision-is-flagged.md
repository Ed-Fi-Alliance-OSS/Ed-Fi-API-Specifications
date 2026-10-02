# Scenario: name collisions and baseline claims (R3, backward half)

## Setup

The Performance Evaluation DS-Need proposes relocating
`PerformanceEvaluationType` to `EvaluationRating` as `EvaluationType`, folding
`PerformanceEvaluationRating` into `EvaluationRating`, and adding a
`FeedbackEntry` common. It also states current identities for nine entities in
its migration analysis.

## Baseline, without the skill

**Partially violated, and this is where directional grounding earned its
place.**

The need doc's nine current-key claims were all _correct_ -- verified against
`@edfi/ed-fi-model-6.1` (projectVersion 6.1.0), all nine CONFIRMED. So the
feared wrong-migration-table did not occur here.

But the same verification pass surfaced four real defects that the need doc
did have wrong, none of which any amount of careful prose reading would catch:

1. **`ActualDuration` collides.** It exists on BOTH `EvaluationRating` and
   `PerformanceEvaluationRating`. Folding the latter into the former
   (the breaking option) collides two distinct fields of the same name. The
   need doc does not flag this.
2. **`EvaluationRating.ActualDuration` is omitted** from the need doc's model
   sketch in both options, though it is a real pre-existing field.
3. **`EvaluationType` collides.** It already exists as a descriptor entity and
   as a property on `Evaluation`, `EvaluationObjective`, and
   `EvaluationElement`. Relocating `PerformanceEvaluationType` to
   `EvaluationRating` under that name collides.
4. **`EvaluationRatingType` exists nowhere.** It appears in both of the need
   doc's ER diagrams (lines 307 and 451, one marked `NEW`) with no supporting
   prose and no presence in any model tree.

The need doc gets one collision right by explicit reasoning -- it requires the
new common be `FeedbackEntry`, not `Feedback`, because `Feedback` is already a
core field on `EvaluationElementRating`. Verified: it is. That is the same
check, done by hand, for one of four cases.

The unpressured runs independently found the `EvaluationType` collision. The
pressured run found none, having skipped verification.

## Expected with the skill

- `--collisions` is run on every proposed name before drafting
- `Feedback` reports COLLISION; `FeedbackEntry`, `ObservationSetting`,
  `EducationOrganizationReviewer`, `EvaluationVersion` report clear
- Every `Type` and `Required` value for an existing field, and every
  current-key row in the migration table, comes from
  `verify_baseline_claims.py` -- never from the input's Mermaid diagrams
- A field appearing only in a diagram, with no prose and no model presence, is
  flagged for a human decision rather than silently kept or silently dropped
- Collisions found in the input are reported in the run summary, since the
  input is the thing that needs fixing
