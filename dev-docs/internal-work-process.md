# Ed-Fi Alliance Internal Work Process

Expanding on the [evolution](../README.md#an-evolving-standard) section of the main readme, internally we will follow this process for developing and refining the Ed-Fi Data Standard:

1. Ideas and suggestions for improvements are logged as GitHub Issues.
   1. When we're ready to start working on an Issue, it is assigned to a member of the Ed-Fi Alliance staff or a community member who will take the lead on developing a Draft RFC for that Issue.
   2. Move the Issue from "Proposed" to "Reviewing".
   3. Create a Jira work item in the DATASTD project to track the work internally, copying from GitHub Issues. _This will be automated_.
2. Ed-Fi Alliance staff and/or community members develop Draft RFCs based on these Issues.
   1. The draft RFC can be in a draft pull request, allowing for discussion and iteration before it is finalized for the community.
   2. Do not merge the draft pull request.
3. Draft RFCs are discussed and iterated upon within the community and the Alliance.
   1. Once we are confident that the update _will_ be in an upcoming release: move to the "Accepted" column and assign it to a Release via the _parent_ feature. There is no need to assign to a Milestone.
4. Once consensus is reached, the RFC is published as a design in the repository.
   1. Copy any final edits from the Discussion into the draft pull request, and merge the pull request to publish the design in the repository.
5. The design is then implemented and integrated into the Ed-Fi Data Standard.
   1. Use the RFC to guide not only the implementation, but also the documentation updates, including Best Practices.
