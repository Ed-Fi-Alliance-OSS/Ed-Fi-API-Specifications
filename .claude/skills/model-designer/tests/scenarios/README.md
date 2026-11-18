# Behavioural Scenarios

Everything in `test_skill_structure.py` asserts that SKILL.md and the spec
_say_ something. Nothing in it tests whether an agent reading them _does_ the
right thing. Those are different failures, and the second one is the one that
has actually shipped defects here: the `ApplicationStatus` row went into an
as-submitted critique workbook while every prose rule around it was correct
and every structure test was green.

These scenarios cover that gap. Each targets a rule that has genuinely been
violated in this skill's history — not a hypothetical.

## How to run one

1. **Run the control first.** Dispatch a fresh-context agent with the
   scenario's Task and _without_ the skill loaded. If it does not exhibit the
   failure, the scenario is not testing anything — fix the scenario or delete
   it. A scenario whose control passes is worse than no scenario, because it
   reports success for free.
2. **Run the treatment.** Same Task, same fresh context, with the skill
   loaded.
3. **5+ reps per arm.** Single samples lie. Variance is itself a signal: if
   five treatment reps produce five different interpretations, the wording
   isn't binding yet — tighten the form before adding words.
4. **Read every flagged match by hand.** Scoring by grep overstates both
   failure and success; a scenario that quotes the forbidden phrase in order
   to reject it looks identical to one that commits the error.
5. Record the date, the model, and the observed rationalisations verbatim in
   the scenario file's Results log. Rationalisations are the raw material for
   the next revision of the rule.

## Why these are markdown, not `unittest`

They need a fresh-context agent per rep, which the Python suite cannot
dispatch. `test_scenarios.py` asserts these files exist and stay well-formed;
it does not and cannot assert that an agent passes them. Treat a green suite
as "the scenarios are intact," never as "the scenarios pass."

## Scenario index

| File | Rule under test | Real failure it descends from |
| --- | --- | --- |
| `whole-model-search-before-new-to-core.md` | Extension Fit Mapping: grep the whole model before recording "New to core" | `SchoolYear` was labelled "New to core" after checking only TPDM `Application`; it is a long-established core enumeration on ~20 entities |
| `no-guessing-a-core-fit-category.md` | An honest blank or `[Verify]` beats a guessed category | Two wrong guesses in a row at `SchoolChoice`'s shape before it was left `[Verify]` |
| `critique-workbook-is-as-submitted.md` | A critique workbook contains only submitted elements | `ApplicationStatus` got a row in the as-submitted workbook its own doc classed Missing |
| `no-default-values-at-design-time.md` | Default descriptor values stay out of a design doc unless the user raises them | Unprompted default-value `[Verify]` items on five new descriptors across the 2026-09 Intervention batch docs, all removed by the author |
