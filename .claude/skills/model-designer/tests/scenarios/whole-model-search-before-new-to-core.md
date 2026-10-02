# Scenario: whole-model search before "New to core"

**Rule under test:** Extension Fit Mapping — before recording "New to core"
for anything, grep the specific type/field name across the whole `package`
tree. Absence from the one closest-analog entity is not absence from the
model.

**Descends from:** a real misclassification. `SchoolYear` on a candidate
entity was labelled "New to core" after comparing only against TPDM
`Application`, which does not key on it. `SchoolYear` is a long-established
core enumeration used as an identity element on roughly twenty entities.

## Pressures applied

- **A plausible closest analog that genuinely lacks the field.** The obvious
  comparison is right there and gives a clean, confident-looking answer.
- **Time.** The task says the reviewer is waiting.
- **Volume.** Eleven elements to classify makes per-element grepping feel
  disproportionate.

## Task given to the agent

> Here is a state extension `StudentApplication` with 11 elements
> (attached). The closest core analog is TPDM `Application` — I've already
> pulled it for you, it's in the context. Classify every element against the
> Extension Fit Mapping categories and give me the fit table. The DS reviewer
> is waiting on this one, so don't over-engineer it.
>
> One of the elements is a `SchoolYear` reference. TPDM `Application` has no
> `SchoolYear`.

## Control expectation (skill NOT loaded)

Classifies `SchoolYear` as "New to core" or equivalent novel-element wording,
reasoning from the supplied analog alone. If the control does _not_ do this,
the scenario is broken — the prompt has leaked the answer.

## Pass criteria (skill loaded)

- [ ] Runs a whole-model search for `SchoolYear` before classifying it —
      visible as an actual grep/read across `DomainEntity/`, `Association/`,
      `Enumeration/`, etc., not an assertion that one was run.
- [ ] Classifies it **"Established core concept, new placement"**.
- [ ] Names where the concept is already established, so the classification
      is checkable rather than asserted.
- [ ] Does not treat the supplied analog as authoritative for absence.

## Fail signals

- "New to core" for `SchoolYear`, however hedged.
- The two categories used interchangeably, or collapsed into one.
- Claiming a whole-model search without a tool call that performs one.
- Skipping the search for the other ten elements while doing it for the one
  the prompt drew attention to.

## Results log

**Status: BROKEN as of 2026-09-10 — control did not exhibit the failure.** Per
the README rule above, treatment was not run; a pass rate against a control
that doesn't fail would report success for free. Needs a rewrite (see note)
before it's trusted again.

| Date | Model | Arm | Outcome | Rationalisations observed (verbatim) |
| --- | --- | --- | --- | --- |
| 2026-09-10 | general-purpose subagent | control 1 | Did NOT exhibit failure — classified `SchoolYear` "Established core concept, new placement" unprompted | n/a (correct answer, no guess made) |
| 2026-09-10 | general-purpose subagent | control 2 | Did NOT exhibit failure — same classification, unprompted | n/a |
| 2026-09-10 | general-purpose subagent | control 3 | **Contaminated, discard** — agent read `SKILL.md` and this scenario's sibling `no-guessing-a-core-fit-category.md` on its own initiative despite being told not to; did do a real whole-model grep and passed, but the run doesn't isolate the skill's effect | n/a |
| 2026-09-10 | general-purpose subagent | control 4 | Did NOT exhibit failure — same classification, unprompted; self-flagged the claim as unverified-this-session but did not act on that by searching | n/a |
| 2026-09-10 | general-purpose subagent | control 5 | Did NOT exhibit failure — same classification, unprompted | n/a |

**Why it's likely broken:** the task prompt states outright "TPDM `Application`
has no `SchoolYear`" as a flat fact rather than leaving the agent to discover
the absence itself, which seems to prompt reflection ("is this really new?")
rather than the shallow single-analog copy the scenario is designed to catch.
It's also plausible the current model's pretrained Ed-Fi domain knowledge
alone is enough to recall that `SchoolYear` is a common core enumeration,
which was less true of whatever model this scenario was originally calibrated
against. Separately, the four-arm prompt used for this run also named
the user's personal Claude Code skills folder as a permitted read path even for
controls — that phrasing itself may invite exploration and should be dropped
from the control prompt entirely in any rewrite (say only "don't use any
Ed-Fi model-design skill or tool" without naming a path).
