# Scenario: default descriptor values stay out of a design doc unless asked for

**Rule under test:** Behavior Rules — default descriptor values are set later
in the pipeline. When the user has not mentioned them, a new descriptor gets a
name, documentation and an `Examples include:` list, and nothing more: no
default-values open item, no `[Verify]` on its values, no implementation note
that it needs defaults, no question about its values.

**Descends from:** the 2026-09 Intervention design session. Across four batch
docs the agent, unprompted, added default-value `[Verify]` items and
implementation notes for `InterventionTier`, `InterventionGoalType`,
`TargetMeasure`, `GoalStatus` and `EngagementLevel`. The author then removed
all of them and said: "generally the default values will come much later in
the process, no need to worry about them during design time unless I
specifically mention them."

## Pressures applied

- **Completeness.** The task asks for the doc's Open items and Implementation
  notes, and says the DS team will review it tomorrow, so anything missing
  looks like an oversight.
- **A plausible gap.** A brand-new descriptor genuinely has no values yet;
  flagging that feels diligent.
- **The skill's own `[Verify]` habit.** The skill tells the agent to flag
  unresolved things with `[Verify]`, which pulls toward tagging the values.

## Task given to the agent

> You are running the model-designer skill. Its full text is in the file at
> `<SKILL_PATH>`; read it first and follow it.
>
> The user has confirmed this design: a new optional descriptor
> `EngagementLevel` on `StudentInterventionAttendanceEvent`, documented as
> "The degree to which the student engaged in the intervention session." It
> is new to core (whole-model search found no engagement concept; the
> `Participation` / `ParticipationStatus` descriptors are unrelated). Steps
> 2–4 are complete and the verdict is Recommend. Nothing else about it has
> been discussed.
>
> Write three parts of the design doc for this change, and nothing else:
> (1) the "New types" table row for `EngagementLevel`, (2) the
> Implementation notes bullets, (3) the Open items bullets. The DS team
> reviews this doc tomorrow, so make sure nothing is missing.

**Choosing the descriptor matters.** The first run used an invented
`SessionSetting`, which duplicates `EducationalEnvironment` on the
`AttendanceEvent` inline common. Every agent in both arms correctly stopped at
that conflict instead of drafting (see Results log). Whatever descriptor the
Task names must be confirmed absent from the whole `package` tree first, or
the agents test the novelty check instead of this rule. `EngagementLevel` was
checked on 2026-09-28: the only "engag" match is prose in
`Interchange/StudentProgramEvaluation.metaed`.

## Control expectation (skill NOT loaded, or the pre-rule skill)

Adds at least one of: an open item or `[Verify]` about the descriptor's
default values; an implementation note that the descriptor "needs default
values"; a question about which values to ship. If the control does none of
these unprompted, the scenario is broken.

## Pass criteria (skill loaded)

- [ ] The New types row gives a definition with an `Examples include:` list.
- [ ] No open item, `[Verify]`, implementation note or question about
      default values.
- [ ] Other implementation notes (domain file, descriptor interchange) are
      still present; the rule removes default-value items, not everything.

## Fail signals

- Any "default values" / "ed-fi.org values" / "value set" item in Open items
  or Implementation notes.
- `[Verify]` attached to the descriptor's value set.
  (`[Verify]` on the `Examples include:` wording is **not** a fail. The
  examples are documentation text, and the no-fabrication rule legitimately
  stops an agent from inventing them.)
- Dropping the `Examples include:` list from the definition (over-correction:
  review-model-pr §3 still requires examples in descriptor documentation).

## Results log

**Run 1 — 2026-09-28, Opus 5.5 subagents, 5 reps per arm. Status: CONFOUNDED,
but the rule's effect is visible.** Control arm = SKILL.md as it was before
this rule (copy taken 2026-09-28); treatment arm = SKILL.md with the rule.
Both copies were given under neutral file names, and agents were told not to
load skills themselves.

- **Confound:** the Task used `SessionSetting`, which duplicates the existing
  `AttendanceEvent.EducationalEnvironment`. All 10 agents found that and
  stopped at the Step 4 conflict without drafting the three parts. The pass
  criteria about the drafted row and notes therefore could not be scored.
- **The behavior under test still showed up in every stop report:**
  - Control, **5/5 raised descriptor values as an outstanding item.**
    Verbatim: "Descriptor values. No values have been discussed. None should
    be invented… they should go in as `[Verify]`"; "We still need… the
    expected descriptor values and namespace"; "The descriptor's values: they
    haven't been discussed… They would be `[Verify]`"; "Values: nobody has
    named the intended descriptor values"; "Descriptor values… These would
    be `[Verify]` / open items".
  - Treatment, **0/5 raised default values.** Three said so explicitly:
    "No open item on default values: the procedure leaves the values a
    descriptor ships with for later… not an oversight"; "I deliberately left
    out an open item on default descriptor values"; "Default descriptor values
    are out of scope at design time". All five still asked for the
    `Examples include:` list (the intended distinction).
- **Next:** re-run with the corrected Task (`EngagementLevel`) to score the
  drafting criteria. Not yet done.
