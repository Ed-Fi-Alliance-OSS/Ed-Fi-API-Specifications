Product: Ed-Fi Data Standard
Affects: Ed-Fi Data Standard v7.0
Obsoletes: --
Obsoleted By: --
Status: Draft and Incomplete (only proposal 1 included on 9/16)
Author: Ed-Fi DS team

September 16, 2026

### **Synopsis**
This RFC covers two proposals:

1. Replace the free-text GenerationCodeSuffix string property in Name with a constrained GenerationCode descriptor. This change would improve data consistency by limiting values to an approved set of generation codes, such as Jr., Sr., and III.
2. Add an EducationOrganization reference to the keys of Contact and StudentContactAssociation, to solve contact overwrite.

Proposal 1 is described in this RFC as of 9/16/2026.  Proposal 2 will be added shortly.

### **Overview**

1. Name.GenerationCodeSuffix: The Ed-Fi Data Standard currently represents an individual’s generational suffix using the Optional GenerationCodeSuffix property, which is a free-text string. This allows source systems to submit a wide range of values, including inconsistent formats, abbreviations, spelling variations, or other values.
For example, systems may submit values such as: Jr, Jr., Junior, III, or 3rd.

**Problem**: `GenerationCodeSuffix`  is part of a person's **legal name**, which must stay aligned across state agency's Unique ID system (the same UID across student→staff), enrollment, and assessment systems. Free-text values can break this alignment (e.g., JR vs JUNIOR).

This issue is tracked in Product Roadmap #102 

### **Proposal(s)**

1. Replace the existing optional GenerationCodeSuffix string property with an optional GenerationCode descriptor. 
This will affect all Name and OtherName attributes.  The GenerationCode descriptor will be an optional array containing a single value.

**Implementation Notes:**
1. Adopting the GenerationCode descriptor in Name and OtherName could require substantial cleanup in source systems. If implemented, the Ed-Fi DS Team will follow the standard deprecation strategy:

- Introduce GenerationCodeDescriptor (optional) in Data Standard 7.0.
- Deprecate GenerationCodeSuffix in Data Standards 7 and 8, and remove it in Data Standard 9, providing a four-year transition period.

### **Impact**

As a benefit, improved name consistency would facilitate downstream matching across assessment, enrollment, and other systems that rely on legal-name data.

**Initial Vendor Feedback**
On 9/15/2026, the SIS-SIG (Special Interest Group) reviewed this request.  The response was that this change is manageable but would require implementation work. The field's optional status reduces the immediate impact, but the mapping expectations still need to be clear.

- Vendors supporting a single suffix value did not identify significant concerns with transitioning to a descriptor-based approach.
- Systems that store suffixes as free text may need to implement translation logic to map locally entered values to approved descriptor values.
- Variations in formatting, punctuation, abbreviations, and nonstandard suffix values may require additional data-cleanup and mapping activities.
- Because the field is optional, the overall impact is expected to be limited; however, clear guidance on descriptor mapping and allowable values would be important for successful implementation.

### **Questions to the Community**

The Ed-Fi DS team is requesting community feedback on the following questions:

1.1 Would your organization accept replacing GenerationCodeSuffix with a GenerationCode descriptor that contains a single controlled value?

1.2 What challenges would prevent your organization from replacing GenerationCodeSuffix with a single descriptor?
