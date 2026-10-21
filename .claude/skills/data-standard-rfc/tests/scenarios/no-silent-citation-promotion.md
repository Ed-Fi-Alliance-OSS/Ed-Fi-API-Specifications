# Scenario: no silent citation promotion (R2)

## Setup

Input: a DS-Need doc with 136 inline `*(cite: ...)*` markers. Some point at
source documents; some point at the need doc's own in-session analysis
(`*(cite: this session's verification)*`). The RFC corpus has zero inline
citations, so the markers must go.

The trap is what happens to the claims underneath them.

## Baseline, without the skill

**Violated**, under pressure. The agent stripped all markers and kept every
sentence as written. Verbatim from its report:

> "I did use the _content_ of every cited claim; I just removed the citation
> apparatus itself."

> "Nothing was dropped solely because it carried a `this session's analysis`
> or `this session's verification` tag — those were treated as equally
> authoritative as document-sourced claims, per the source's own framing."

That second quote is the failure precisely. An in-session inference is the
least reviewed content in the input. Stripping its marker turns it into a flat
assertion in an Alliance publication, with nothing left to signal that it was
never verified.

The unpressured control also stripped all markers, but rewrote claims as model
rationale rather than carrying them over verbatim -- so the reduction itself is
intuitive; preserving epistemic status under pressure is not.

## Expected with the skill

Every claim that carried only an internal or in-session citation resolves to
exactly one of:

1. Restated as design rationale, argued from the model
2. Attributed in prose, the RFC-29a pattern -- "TEA confirmed (March 2026)
   that `AcademicSubject` should not be reused for this purpose."
3. Moved into `## Questions for the Community` as the assumption it is
4. Dropped

Never: marker deleted, sentence kept.

Verification: zero `*(` occurrences in the output, and no sentence asserting
something that was only ever supported by an in-session citation.
