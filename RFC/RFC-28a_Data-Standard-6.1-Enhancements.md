# Ed-Fi Request for Comment 28a: Enhancements to Ed-Fi Data Standard 6.1

Product: Ed-Fi Data Standard \
Affects: Ed-Fi Data Standard v6.1 \
Obsoletes: -- \
Obsoleted By: -- \
Status: Published \
Author: Maria Ragone (Ed-Fi Alliance)

March 12, 2026

## Synopsis

In Data Standard v6.1, a series of non-breaking changes are being introduced to:

1. Support more detailed Special Education event tracking (via the "Early Access" Special Education Data Model, SEDM)
2. Reduce complexity introduced by state-specific variations
3. Address other state-driven requirements

This RFC focuses only on the changes intended to reduce complexity and improve general support (benefits 2 and 3). To review the SEDM model design, please read [Data Standard Draft RFC 28b - Special Education Data Model](./RFC-28b_Special-Education-Data-Model.md).

The Ed-Fi Alliance welcomes comments, questions, and concerns from the community regarding the proposals described below.

## Overview

### Problems

1. The Reporting EducationOrganization cannot write a record for other responsible EdOrg due to authorization constraints, **and it has no way to reference the districts that have alternate responsibility**. The limitation is significant for states, as it **impacts funding** determinations. **The current Data Standard model does not adequately support scenarios where districts with residency or other responsibilities do not record that data in the StudentEducationOrganizationResponsibilityAssociation (SEORA)**, creating a gap in state funding support.

2. The Data model does not explicitly support identification of a Primary address, creating a level of ambiguity when states need to distinguish different addresses used for different communications or reporting purposes. The current data standard indicates which contact is primary, but there is no clear relationship to the Primary address. This issue is particularly troublesome where two addresses are Primary. Some states also use the Validated concept to support downstream logic.

### Impact

To address the potential lack of records for a ResponsibleEdOrg, many states have extended either the SEORA, the StudentEducationOrganizationAssociation (SEOA), or the StudentSchoolAssociation (SSA), adding complexity to the Data Standard. Due to the absence of a common standard, SIS vendors must support state-specific customizations. These extensions are typically named AlternateEdOrg responsibility, campus of residency, transportation EdOrg and others.

## Use Cases

As a district I have a responsibility to provide services like residency, accountability, funding, special ed, transportation to a student. I am not reporting or writing the data about that student to the state. The reporting district writes the data to the state. Reporting District writes the responsibility details of the alternative education organization.

As a state, I am able to identify the student's Primary address(es) and differentiate which addresses are used for different levels of communications.

## Proposal

Clarified proposals for SEORA enhancement discussed in Ed-Fi Data Standard governance (DSWG, and SEA meeting):

### 1. Add an Optional Reference to the ResponsibleEducationOrganization in the StudentEducationOrganizationResponsibilityAssociation (SEORA) and clarify documentation to indicate that the ResponsibilityDescriptor refers to the Responsible EdOrg

#### 1.1 Deprecate the Residency Descriptor in the StudentSchoolAssociation

The Reporting EdOrg can indicate the alternate responsibilities for a single student record.

Considerations:

- When the Reporting EdOrg and the Responsible EdOrg are the same, **it is advised that the Responsible EdOrg still be populated**, to ensure consistent use of the Responsibility Descriptor.
- This approach preserves the use of SEORA for responsibility modeling, and the SEOA for other data reporting.
- This implementation does not introduce authorization changes, as the Reporting EdOrg continues to create the record in the SEOA.

### 2. Add a Primary Residency descriptor to the Address Common

## Implementation Notes

Please indicate your comments, questions or suggestions regarding each proposal number.

In addition, your responses to the below questions are greatly appreciated:

- **Proposal 1:** Would you prefer ResponsibleEdOrg be required in the SEORA (possible implementation in DS v7.0)?
- **Proposal 1.1:** Would you be impacted by removing StudentSchoolAssociation.ResidencyDescriptor in Data Standard v8.0?
