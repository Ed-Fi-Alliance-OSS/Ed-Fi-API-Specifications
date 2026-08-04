# Ed-Fi Alliance Internal Work Process

Expanding on the [evolution](../README.md#an-evolving-standard) section of the main readme, internally we will follow this process for developing and refining the Ed-Fi Data Standard:

## Intake

Ed-Fi Alliance staff, contractors, and (potentially) community members log ideas and suggestions for improvements as GitHub Issues in the [Technology Roadmap](https://github.com/Ed-Fi-Alliance-OSS/Ed-Fi-Technology-Roadmap) repository and attach them to the [Product Roadmap](https://github.com/orgs/Ed-Fi-Alliance-OSS/projects/2) project, with label `data-standard`. They should have Status = `Proposed` until the item has been reviewed and further refined.

## Initial Review

Ed-Fi product / program management staff will provide an initial / cursory review of the issue:

1. Review the labels, adding states as needed (e.g. if impacting Texas, add label `community-tx`) and adding `breaking` where a proposal is expected to require a breaking change to the Data Standard.
1. Assign an initial Priority. Currently, this is an anecdotal / gut feel prioritization based on the anticipated number of community members impacted and the importance of the change.
1. If immediately rejected, change the status to `Rejected`. Be sure to add a comment explaining the rationale.
1. Add label `jira-ds` when ready to automate copying the issue to Jira.

## Deep Review

When requested by product / program management, a staff person, contractor, or community member will provide a deeper review:

1. Change Status to 'Reviewing`.
1. Refine and rewrite the Issue, adding more detail to the Background, Opportunity, Proposal, and Implementation Notes sections as needed to clarify the problem. Expected level of detail: just enough to explain the situation to a broad audience and to set the groundwork for more detailed requirements gathering, analysis, and design. This is _not_ expected to be a full-fledged design.
1. During or after this refinement, the item can be rejected. Be sure to add a comment explaining the rationale.
1. Optionally, the Data Standard team may begin drafting an Request for Comments (RFC) document at this time (more detail below).
1. When product / program management decides that the Issue _will be accepted_ into an upcoming release:
   1. Change the status to `Accepted`.
   1. Assign a Parent to the Issue, selecting the expected Data Standard release version.
   1. If circumstances change, the item can always be moved to another status, with rationale provided.

## RFC Development

Detailed requirements and designs for Accepted issues will be described in a Request for Comments (RFC) document in this Ed-Fi-API-Specifications repository.

1. Product / program management will assign to a staff, contractor, or community member.
1. Assigned personnel will research the topic through conversations with education organizations, vendors, and more.
1. From that research, we begin writing the RFC as a markdown document, creating a _draft_ pull request (PR).
1. Internally, team members can comment on the draft PR, helping ready it for a broader community conversation.
1. When ready for community conversation, whether asynchronous or in a workgroup meeting, copy the draft RFC into a [Discussion](https://github.com/Ed-Fi-Alliance-OSS/Ed-Fi-Technology-Roadmap/discussions) in the Technology Roadmap repository.
    1. A Discussion is a better place community conversations than the pull request.
    1. The Discussion can be revised as needed based on feedback.
    1. Leave the PR in the draft state and do not merge. While the Discussion is being revised, continued maintenance of the draft PR is not necessary - can come back to the RFC pull request later.
1. Once feedback has been received and community consensus has been reach:
   1. Close the discussion.
   1. Copy the revised RFC document back to the draft pull request.
1. Continue editing the RFC draft PR as needed while developing the Data Standard UDM updates.
1. Once the design is "final", change the status in the RFC "frontmatter" and merge the pull request.
      1. This should truly be the final design - merging the pull request is tantamount to publishing a design document that others will want to rely on. Further clarification can be added if necessary, but the data model in the published RFC needs to match what is published in the Data Standard release.

## Data Standard Release

Use the RFC to help build the Data Standard release documentation.
