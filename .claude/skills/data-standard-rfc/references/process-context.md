# Where RFC Development sits in Ed-Fi governance

Condensed from `dev-docs/internal-work-process.md` in
`Ed-Fi-Alliance-OSS/Ed-Fi-API-Specifications`. Read the live file if the
details matter — this is orientation, not a substitute.

```
Intake            log a GitHub Issue in Ed-Fi-Technology-Roadmap,
                  label `data-standard`, Status = Proposed
       |
Initial Review    product/program mgmt: labels, priority, `jira-ds`
       |
Deep Review       refine Background / Opportunity / Proposal /
                  Implementation Notes. Status = Reviewing -> Accepted,
                  parented to a DS release version
       |
RFC Development   <-- THIS SKILL
       |
Community         copy the draft RFC into a GitHub Discussion in
Discussion        Ed-Fi-Technology-Roadmap; revise there
       |
Finalize RFC      copy revisions back to the PR, set final Status,
                  merge
       |
DS Release        RFC feeds the release documentation
```

## What the process says about RFC Development

Verbatim points that constrain this skill:

- "Detailed requirements and designs for **Accepted** issues will be described
  in a Request for Comments (RFC) document in this Ed-Fi-API-Specifications
  repository." — the issue should already be Accepted; an RFC is not the place
  to argue for acceptance.
- "From that research, we begin writing the RFC as a markdown document,
  creating a **draft** pull request (PR)." — hence `gh pr create --draft`.
- "Internally, team members can comment on the draft PR, helping ready it for
  a broader community conversation." — the PR is the internal review venue.
- "When ready for community conversation ... copy the draft RFC into a
  Discussion in the Technology Roadmap repository." — a **human** decision
  about timing. This skill stops before it.
- "Leave the PR in the draft state and do not merge." — never merge, never
  mark ready for review without being asked.
- "Once the design is 'final', change the status in the RFC 'frontmatter' and
  merge the pull request. This should truly be the final design — merging the
  pull request is tantamount to publishing a design document that others will
  want to rely on."

That last sentence is the reason R1-R4 are strict. The merged RFC is what the
community builds against.

## Where the pieces live

| Thing | Location |
|---|---|
| Published RFCs | `RFC/` in `Ed-Fi-API-Specifications` |
| RFC index | `RFC/README.md` |
| Draft RFCs under internal review | open PRs on `Ed-Fi-API-Specifications` |
| Community discussion | Discussions in `Ed-Fi-Technology-Roadmap`, label `RFC` |
| Intake issues | Issues in `Ed-Fi-Technology-Roadmap`, label `data-standard`, on the Product Roadmap project |
| Older RFCs not yet migrated | Confluence, `rc` space, page 712278041 |
| Data Standard Workgroup | Confluence, `GOV` space, page 263127121 |

`RFC/README.md` states drafts open for comment "will be posted as GitHub
Discussions ... and will be shared with the Data Standard Work Group for
feedback."

## Implication for tone

The audience is implementers and vendors deciding whether and how to adopt,
not internal reviewers deciding whether to fund. So:

- Argue from the model, not from who asked
- State decisions, not deliberations
- Put genuinely open items in `Questions for the Community` rather than
  hedging throughout
