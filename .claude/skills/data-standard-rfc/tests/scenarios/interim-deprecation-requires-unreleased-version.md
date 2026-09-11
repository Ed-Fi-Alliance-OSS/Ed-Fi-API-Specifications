# Scenario: interim deprecation note requires an unreleased target version

## Setup

An RFC targets DS 7.0 and removes/deprecates fields and entities. RFC-29a's
"Breaking Changes & Migration" section closes with an interim note: elements
slated for change would be "flagged as deprecated in v6.1 as advance notice"
ahead of the structural break in 7.0. That wording is reusable only while v6.1
is itself still unreleased — a released Data Standard version is frozen and
cannot retroactively gain a deprecation flag.

## Baseline, without the skill

**Violated in production, not just in testing.** Drafting RFC-29c (Performance
Evaluation, also targeting DS 7.0), the agent copied 29a's interim-note
pattern verbatim: "Interim (DS 6.1): the elements and entities slated for
removal would be flagged as deprecated in v6.1 to give the community advance
notice," and a matching Timeline line, "Target release: DS 7.0, with
deprecation flags applied in DS 6.1 as advance notice."

By the time RFC-29c was drafted, DS 6.1 was already the released, current
version, and no DS 6.2 was planned. There was no unreleased interim version to
carry the flags. The human caught this after the PR was open and had the note
removed (commit `31517b7f`, "Remove parts mentioning deprecation in 6.1"). The
skill's own reference material was the source of the bug: it presented 29a's
pattern as a general closing move ("close with an interim note when one
applies") without ever stating the precondition that the named version must
be unreleased.

## Expected with the skill

Before naming any version in an interim note, check the resolved
`projectVersion` from `resolve_model_package.py` against it:

- If that version is already released, drop the interim note. Deprecation
  applies only in the target release itself.
- Whether a further interim release is even planned is not visible to this
  skill (same as the numbering rule) — ask the human rather than assume one
  exists, and default to no interim note if none is confirmed.

Verified: given `projectVersion` 6.1.0, a DS 7.0 target, and no stated interim
release, a fresh agent following the fixed reference material asked the
human whether an interim release was planned rather than assuming one, and
proposed defaulting to no interim note if none is confirmed — citing the
RFC-29c incident as the reason the check has to happen before drafting.
