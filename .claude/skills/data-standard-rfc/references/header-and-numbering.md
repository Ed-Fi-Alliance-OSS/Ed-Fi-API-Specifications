# Header block, status, numbering, and the PR

## Header block

Backslash line continuations. **Not** YAML frontmatter — no `---` fences.

```markdown
# Ed-Fi RFC 29b: Performance Evaluation Observation & Feedback (Performance Evaluation Domain)

Product: Ed-Fi Data Standard \
Affects: Ed-Fi Data Standard v7.0 \
Obsoletes: -- \
Obsoleted By: -- \
Status: Draft for community feedback \
Author: Steven Arnold (Ed-Fi Alliance)

September 3, 2026

## Synopsis
```

Rules observed across all three RFCs:

- Every line except the last ends with a space then `\`.
- `Author:` line has no trailing backslash.
- Empty fields are `--`, never blank or omitted. `Obsoletes` and
  `Obsoleted By` are `--` in all three current RFCs.
- The date is a bare `Month D, YYYY` line after a blank line, not part of the
  block.
- Author format: `Name (Ed-Fi Alliance)`. 29a currently has `--`; ask rather
  than guessing a name.

`RFC/README.md` describes this as "a header block identifying the affected
product, its status, and any RFCs that it obsoletes or is obsoleted by."

## Status vocabulary

Only these three values appear in the corpus:

| Status | Meaning |
|---|---|
| `Draft` | Early internal draft, not yet circulated |
| `Draft for community feedback` | Out for community comment |
| `Early Access` | Final design, published, may ship ahead of full release |

Per `dev-docs/internal-work-process.md`, status changes in the "frontmatter"
just before the PR is merged: "Once the design is 'final', change the status in
the RFC 'frontmatter' and merge the pull request."

Do not invent statuses such as `Accepted`, `Proposed`, or `Final`.

## Numbering

**The numbering rule is undocumented in the repository.** Do not present a
guess as convention.

Observable pattern — number = release batch, letter = item within the batch:

| RFC | Affects |
|---|---|
| 28a | DS 6.1 |
| 28b | DS 6.1 |
| 29a | DS 7.0 |

So a new DS 7.0 RFC is plausibly `29b`, and a new batch would start `30a`.
Both readings are defensible.

**Procedure:** enumerate live state, propose, then ask.

```bash
# Merged/published RFCs
gh api repos/Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications/contents/RFC \
  --jq '.[].name'

# In-flight RFCs -- open PRs claim numbers that are not in RFC/ yet
gh pr list --repo Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications \
  --state open --json number,title,headRefName
```

Checking open PRs matters: 29a exists only as PR #60, so `RFC/` alone would
make 29a look free.

Filename: `RFC-<NNx>_<Topic-In-Kebab-Or-Pascal>.md`. Observed:
`RFC-28b_Special-Education-Data-Model.md`,
`RFC-29a_OpenStaffPosition.md`,
`RFC-28a_Data-Standard-6.1-Enhancements.md`. Both kebab and Pascal appear;
match the closest existing example rather than imposing a rule.

## The TOC entry in RFC/README.md

**Part of the deliverable.** All three RFC pull requests modify this file.

Entries are grouped by DS version, "reverse ordered by Data Standard version",
newest first:

```markdown
- Data Standard 7.0
  - 29a | [OpenStaffPosition & Requisition Model Changes](./RFC-29a_OpenStaffPosition.md)
  - 29b | [Performance Evaluation Observation & Feedback](./RFC-29b_PerformanceEvaluation.md)
- Data Standard 6.1
  - 28a | Enhancements to Ed-Fi Data Standard 6.1 - _coming soon_
  - 28b | [Special Education Data Model (SEDM)](./RFC-28b_Special-Education-Data-Model.md)
```

Format: `- <NNx> | [<Title>](./<filename>)`. An RFC not yet merged is listed
as plain text with `- _coming soon_` instead of a link — that is how 28a
appears while its PR is open. A new draft PR should follow that pattern until
merged.

Add the DS-version heading if this is the first RFC for that version.

## Branch and pull request

Branch name follows the observed `DATASTD-2615-Open-Staff-Position-RFC`:

```
<TICKET>-<Topic-Words>-RFC
```

Ticket-first, hyphen-separated topic, `-RFC` suffix. Omit the ticket segment
only if there genuinely is no tracking ticket.

The PR is opened **as a draft** (`gh pr create --draft`), because
`internal-work-process.md` says: "we begin writing the RFC as a markdown
document, creating a _draft_ pull request (PR)" and later "Leave the PR in the
draft state and do not merge."

PR body should state the target DS version, the tracking ticket, and that the
RFC is pending community discussion. Merging is explicitly a human decision:
"merging the pull request is tantamount to publishing a design document that
others will want to rely on."
