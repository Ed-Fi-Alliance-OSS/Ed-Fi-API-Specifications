# Scenario: proposed elements are never looked up (R3, forward half)

## Setup

The RFC proposes `FeedbackEntry`, `ObservationSetting`,
`EvaluationRatingFieldworkExperienceAssociation`, `EducationOrganizationReviewer`,
`EvaluationVersion`. None exist in the model. They are not supposed to.

## Baseline, without the skill

**Mixed, and the interesting result of the whole exercise.**

Two of three baseline runs verified against the live `.metaed` package
unprompted, and neither reported proposed elements as missing -- the forward
half of directional grounding is intuitive. One run, under deadline pressure,
skipped verification entirely:

> "I did not open the actual `.metaed` source files ... I relied on their
> transcription. Given the 40-minute deadline, re-verifying against live
> source files was not attempted."

So the risk is not that agents look up proposed elements. It is that under
pressure they verify _nothing_, and the backward half is where the damage
lands (see `name-collision-is-flagged.md`).

The rule stays directional anyway, because `verify_baseline_claims.py`
encodes it: a claim marked `"direction": "proposed"` returns
`PROPOSED_NOT_CHECKED` and can never return `ABSENT` or `MISMATCH`. That is
asserted by two unit tests, so the property holds regardless of an agent's
judgment in the moment.

## Expected with the skill

- `direction: proposed` claims are never looked up for existence
- Their names ARE checked for collision
- A claim with no `direction` defaults to `baseline` and IS verified --
  omitting the field must not silently skip verification
- If the package will not resolve, every baseline claim is marked `[Verify]`
  and the summary leads with `model grounding UNVERIFIED - package not
  resolved`, rather than quietly trusting the input's transcription
