# Ed-Fi RFC 30c: Individual Graduation Plan — StudentGraduationPlan (Graduation Domain)

| | |
| --- | --- |
| **Product** | Ed-Fi Data Standard |
| **Target Release** | Ed-Fi Data Standard 6.2 |
| **Affects** | Ed-Fi Data Standard (Graduation Domain), Ed-Fi Resources API |
| **Obsoletes** | — |
| **Obsoleted By** | — |
| **Status** | DRAFT — Request for Comment |
| **Author** | Sayee Srinivasan, Ed-Fi Alliance |
| **Date** | November 18, 2026 |

## Synopsis

This Request for Comment (RFC) proposes a standard way to capture student-level Individual Graduation Plan (IGP) data in Ed-Fi.

The proposal **extends the existing Ed-Fi `GraduationPlan` instead of building a separate model**. It adds one new association entity, `StudentGraduationPlan`, which ties a `Student` to an existing `GraduationPlan` and carries the plan-level accountability data. Meeting, participant, plan-choice, and goal details are inline common collections on that one entity, not separate resources.

Two states drive this proposal:

- **South Carolina**, where IGP data can come from a Student Information System (SIS) or a College and Career Guidance System. South Carolina plans to start with data from the SIS, which writes to the Palmetto Collaborative; from there the data flows to the State Data System. The current mapping uses generic student indicators as a placeholder for IGP data, which gives the plan no structure of its own.
- **Indiana**, which already collects a state-level graduation plan record through an Ed-Fi extension whose shape closely matches this proposal.

This model is proposed for inclusion in **Ed-Fi Data Standard 6.2**.

## Feedback

Please comment on this discussion. Comments from SEAs, LEAs, SIS vendors, and College and Career Guidance System vendors are all in scope.

## 1. Background and Problem Statement

### 1.1 South Carolina context

South Carolina's Palmetto Pathways initiative uses Individual Graduation Plans to help counselors plan each student's high school path from student interest and progress. The state needs student-specific IGP accountability data to reach the State Data System. That data is mostly metadata about the IGP: the student's selected major, CTE cluster, postsecondary plan, and information about the meeting held with the student.

IGP data can come from two kinds of source systems: a Student Information System (SIS) or a College and Career Guidance System. South Carolina initially plans to receive the data from the SIS, which writes IGP data to the Palmetto Collaborative; from there it flows to the State Data System. **The model therefore gives every source system a clear, dedicated place to send the IGP, separate from the student demographic data these systems already send.**

### 1.2 Where the data lives today

The current SCDE mapping uses the `studentIndicators` collection of `StudentEducationOrganizationAssociation` as a potential placeholder for IGP data, with indicator names such as `IGP_Primary`, `IGP_Attendance`, `IGP_Participation`, `IGP_Cluster`, `IGP_Major`, and `IGP_Postsecondary_Plan`. The `studentIndicators` collection is on `StudentEducationOrganizationAssociation` in both Data Standard 5.x and 6.x. In 6.x, demographic data moved to a separate `StudentDemographic` entity, but the indicators did not move.

### 1.3 The problem

There are two problems with that location.

**No real structure for the plan.** Indicators can hold the values, but the IGP becomes a set of loosely related flags rather than a plan. There is no clean way to express that a meeting produced the plan, who attended, which choices belong to which plan, or which plan is primary.

**IGP data is placed in a large shared record.** `StudentEducationOrganizationAssociation` carries a wide range of other student data, far beyond IGP scope; in 5.x this includes demographics. Because Ed-Fi API writes replace the whole resource, including its collections, IGP data mapped there can only be updated by resending the entire record. It is also at risk if more than one system writes the same record, since each write can overwrite the other. The community identified this write-conflict risk.

### 1.4 Options evaluated

| Option | Approach | Concern raised |
| --- | --- | --- |
| A | GET the `StudentEducationOrganizationAssociation` record, stitch IGP indicators into `studentIndicators`, POST it back | Fragile: only safe if every process writing that record coordinates the same way; otherwise one write overwrites another |
| B | Write IGP data to the existing `/graduationPlan` resource | Most accountability data has no natural home there; extended properties would still be needed |
| C | Build a custom extension modeled for South Carolina's IGP | SCDE is committed to core endpoints; registering extensions across state ODS instances is a large lift |

This RFC combines the strengths of B and C. It builds on `GraduationPlan` (B) and adds a purpose-built structure (C), but as part of the core Data Standard (6.2), so that no state has to carry a private extension.

## 2. Legal and Policy Basis

### South Carolina

South Carolina's Education and Economic Development Act (EEDA), codified at S.C. Code Title 59, Chapter 59, requires the IGP:

| Section | What it covers | Model element |
| --- | --- | --- |
| § 59-59-140 | The IGP itself and its required contents | `StudentGraduationPlan` |
| § 59-59-110 | Declared area of academic focus (major) by end of grade 10 | `PlanChoice` (type = Major) |
| § 59-59-90 | Preferred cluster of study selected in grade 8 | `PlanChoice` (type = Career Cluster) |

Source: [South Carolina Education and Economic Development Act](https://www.scstatehouse.gov/code/t59c059.php). Implementing regulations (for example, R.43-234 and Diploma Pathways provisions) change more often than the statute and should be confirmed against current SCDE guidance.

### Indiana

Under IC 20-30-4-2, every Indiana student develops a graduation plan by the end of grade 8, with counselor and parent consultation. See [Section 10](#10-indiana-needs-policy-and-existing-extension).

## 3. Use Cases

| # | Use case |
| --- | --- |
| UC1 | **Record a student's graduation plan.** As an agency receiving IGP data from a source system (an SIS or a College and Career Guidance System), I need a structure that ties a student to the existing `GraduationPlan` and records plan-level facts (school year, active period, primary or alternative, finalized or not) without relying on student indicators. |
| UC2 | **Record IGP meetings.** I need to record the meeting(s) at which the plan was created, reviewed, amended, or finalized, so meeting context stays with the plan. A plan can have many meetings. |
| UC3 | **Record who participated.** I need to capture who took part in each meeting and how, optionally referencing the specific `Staff` member or `Contact`. |
| UC4 | **Record student goals.** As a counselor using an SIS or a College and Career Guidance System, I need to record goal statements (career, academic, postsecondary) as goals, not flatten them into a plan-level field. |
| UC5 | **Record structured plan choices.** I need to record selections such as career cluster, major, postsecondary plan, academy, CTE plan, seal, scholarship, or local opportunity, kept separate from goals. At least one choice is required. |
| UC6 | **Support a primary plan and alternatives.** I need to identify a student's primary plan and send alternatives, so students pursuing more than one diploma pathway are represented. |
| UC7 | **Meet a state's accountability collection.** As an SEA, I need the same structure to carry what I report at the state level (at minimum: student, school year, plan type, graduation school year, begin and end dates), whether the full plan is reported or only an indicator. |
| UC8 | **Send IGP data separately from demographic data.** As a source system (an SIS or a College and Career Guidance System), I need to send IGP data to its own resource, separate from student demographic data, so IGP updates don't require resending a larger shared record and aren't at risk from other systems' writes. |

## 4. Design Approach

1. **Extend, don't duplicate.** Ed-Fi's `GraduationPlan` already models graduation requirements (credits by subject, course, and credit category, plus required assessments and certifications). It is identified by `EducationOrganization`, `GraduationPlanType`, and `GraduationSchoolYear` and works as a plan template. This RFC reuses it unchanged and individualizes it for a student.
2. **One new entity.** `StudentGraduationPlan` is the only new resource. That keeps the footprint small: one resource to send, query, and authorize.
3. **Inline collections, not new entities.** Meeting (with Participant), PlanChoice, and PlanGoal are common-type collections that serialize inside the `StudentGraduationPlan` resource, the same way `CohortYear` serializes inside `StudentEducationOrganizationAssociation`.
4. **The plan is the anchor.** Meetings, participants, choices, and goals all hang off the plan. The meeting is context for the plan, not its parent.
5. **A resource of its own.** Because IGP data has its own resource, whichever system produces the plan can write it without touching `StudentEducationOrganizationAssociation` (UC8).
6. **Follows the Special Education Data Model.** The structure mirrors the Special Education Data Model (Early Access in Data Standard 6.1): a student plan (`StudentIEP`) with meetings recorded at the plan level (`IDEAEvent`) and goals that carry an identifier, details, a type, and an optional achievement period (`StudentIEPGoal`).

## 5. Proposed Model

### 5.1 Diagrams

The following entity-relationship diagrams use GitHub-supported Mermaid syntax. Each entity shows all of its elements.

#### Current Model Mapping

Today, IGP data has no entity of its own. The current mapping uses the student indicators on `StudentEducationOrganizationAssociation` as a potential placeholder for IGP data, and `GraduationPlan` holds only the plan's requirements.

```mermaid
---
config:
  layout: elk
---
erDiagram
    Student ||--o{ StudentEducationOrganizationAssociation : "has"
    GraduationPlan

    Student {
        string StudentUniqueId "I"
        object Name "R"
        object OtherName "OC"
        object BirthData "R"
        reference Person "O"
    }

    StudentEducationOrganizationAssociation["StudentEducationOrganizationAssociation (DS 6.1)"] {
        reference Student "I"
        reference EducationOrganization "I"
        string ProfileThumbnail "O"
        object CohortYear "OC"
        object StudentIndicator "OC - potential placeholder for IGP data in the current mapping (IGP_Primary, IGP_Attendance, IGP_Participation, IGP_Cluster, IGP_Major, IGP_Postsecondary_Plan)"
        string LoginId "O"
        descriptor PrimaryLearningDeviceAwayFromSchool "O"
        descriptor PrimaryLearningDeviceAccess "O"
        descriptor PrimaryLearningDeviceProvider "O"
        boolean InternetAccessInResidence "O"
        descriptor BarrierToInternetAccessInResidence "O"
        descriptor InternetAccessTypeInResidence "O"
        descriptor InternetPerformanceInResidence "O"
        object DisplacedStudent "OC"
    }

    GraduationPlan["GraduationPlan (DS 6.1)"] {
        descriptor GraduationPlanType "I"
        reference EducationOrganization "I"
        SchoolYear GraduationSchoolYear "I"
        boolean IndividualPlan "O"
        object TotalRequiredCredits "R"
        object CreditsBySubject "OC"
        object CreditsByCourse "OC"
        object CreditsByCreditCategory "OC"
        object RequiredAssessment "OC"
        object RequiredCertification "OC"
    }
```

> [!NOTE]
> Elements are taken from the Data Standard 6.1 XSD. In 5.x, `StudentEducationOrganizationAssociation` also carries demographic elements (for example, `Sex`, `Race`, `Address`, `Telephone`), and `StudentIndicator` is in the same place.
> **Notation:** `I` = identity / natural key · `R` = required · `O` = optional · `C` = array/collection · `object` = custom object ("common" in MetaEd).

#### Proposed Model (DS 6.2)

```mermaid
---
config:
  layout: elk
---
erDiagram
    Student ||--o{ StudentGraduationPlan : "has"
    GraduationPlan ||--o{ StudentGraduationPlan : "individualized as"
    StudentGraduationPlan ||--o{ Meeting : "embeds"
    Meeting ||--o{ Participant : "embeds"
    StudentGraduationPlan ||--|{ PlanChoice : "embeds at least one"
    StudentGraduationPlan ||--o{ PlanGoal : "embeds"
    Staff |o--o{ Participant : "optionally identifies"
    Contact |o--o{ Participant : "optionally identifies"

    Student {
        string StudentUniqueId "I"
        object Name "R"
        object OtherName "OC"
        object BirthData "R"
        reference Person "O"
    }

    GraduationPlan {
        descriptor GraduationPlanType "I"
        reference EducationOrganization "I"
        SchoolYear GraduationSchoolYear "I"
        boolean IndividualPlan "O"
        object TotalRequiredCredits "R"
        object CreditsBySubject "OC"
        object CreditsByCourse "OC"
        object CreditsByCreditCategory "OC"
        object RequiredAssessment "OC"
        object RequiredCertification "OC"
    }

    Staff {
        string StaffUniqueId "I"
        object Name "R"
        object OtherName "OC"
        date BirthDate "O"
        descriptor HighestCompletedLevelOfEducation "O"
        decimal YearsOfPriorProfessionalExperience "O"
        decimal YearsOfPriorTeachingExperience "O"
        string LoginId "O"
        boolean HighlyQualifiedTeacher "O"
        object Recognition "OC"
        reference Credential "OC"
        reference Person "O"
        descriptor HighlyQualifiedAcademicSubject "OC"
        object EducatorResearch "O"
        reference EducatorPreparationProgram "OC"
        reference OpenStaffPosition "O"
    }

    Contact {
        string ContactUniqueId "I"
        object Name "R"
        object OtherName "OC"
        descriptor Sex "O"
        object GenderIdentity "O"
        object Address "OC"
        object InternationalAddress "OC"
        object Telephone "OC"
        object ElectronicMail "OC"
        string LoginId "O"
        object Language "OC"
        reference Person "O"
        descriptor HighestCompletedLevelOfEducation "O"
    }

    StudentGraduationPlan {
        reference Student "🟩 I - NEW"
        reference GraduationPlan "🟩 I - NEW"
        SchoolYear SchoolYear "🟩 I - NEW"
        date BeginDate "🟩 I - NEW"
        date EndDate "🟩 O - NEW"
        string PlanName "🟩 R - NEW"
        descriptor PlanDesignation "🟩 R - NEW (Primary or Alternative)"
        date FinalizedDate "🟩 O - NEW"
        string PlanNarrative "🟩 O - NEW"
        object Meeting "🟩 OC - NEW"
        object PlanChoice "🟩 RC - NEW (at least one)"
        object PlanGoal "🟩 OC - NEW"
    }

    Meeting["Meeting (object)"] {
        descriptor MeetingType "🟩 I - NEW"
        date MeetingDate "🟩 I - NEW"
        string MeetingNarrative "🟩 O - NEW"
        object Participant "🟩 OC - NEW"
    }

    Participant["Participant (object)"] {
        descriptor ParticipantType "🟩 I - NEW"
        descriptor ParticipationMethod "🟩 O - NEW"
        reference Staff "🟩 O - NEW"
        reference Contact "🟩 O - NEW"
    }

    PlanChoice["PlanChoice (object)"] {
        descriptor PlanChoiceType "🟩 I - NEW"
        string PlanChoiceName "🟩 I - NEW"
        descriptor ChoiceStatus "🟩 O - NEW"
    }

    PlanGoal["PlanGoal (object)"] {
        string GoalIdentifier "🟩 I - NEW"
        descriptor PlanGoalType "🟩 R - NEW"
        string GoalDetails "🟩 R - NEW"
        object GoalAchievementPeriod "🟩 O - NEW (BeginDate, EndDate)"
    }
```

> [!NOTE]
> `Student`, `GraduationPlan`, `Staff`, and `Contact` are existing entities and are not changed by this RFC; all of their Data Standard 6.1 elements are shown. `StudentGraduationPlan` is the only new entity. `Meeting`, `Participant`, `PlanChoice`, and `PlanGoal` are objects ("common" in MetaEd) embedded in the `StudentGraduationPlan` resource, not separate resources. In the identity column of an object, `I` means the element that makes a row unique within its parent collection.
> **Notation:** `I` = identity / natural key · `R` = required · `O` = optional · `C` = array/collection · `RC` = required collection (at least one) · `object` = custom object ("common" in MetaEd) · 🟩 = new.

A student has **0..*** graduation plans. Each `StudentGraduationPlan` references one `GraduationPlan`, carries at least one `PlanChoice`, and may carry any number of meetings and goals.

### 5.2 StudentGraduationPlan (the one new entity)

The data dictionary uses the same notation as the diagrams: `I` = identity · `R` = required · `O` = optional · `OC` = optional collection · `RC` = required collection (at least one) · `Object` = custom object ("common" in MetaEd).

| Element | Type | Card. | Definition |
| --- | --- | --- | --- |
| Student | Reference | I | The student the plan is for. |
| GraduationPlan | Reference | I | The existing Ed-Fi `GraduationPlan` being individualized. Brings `EducationOrganization`, `GraduationPlanType` (the diploma pathway), and the plan's `GraduationSchoolYear`, which is why `StudentGraduationPlan` does not carry its own graduation school year. |
| SchoolYear | SchoolYear | I | The school year in which the plan is active. |
| BeginDate | Date | I | Date the plan becomes active or is identified. Distinguishes revisions within the same school year. When a plan is amended, the amended plan is a new record with a new `BeginDate`. |
| EndDate | Date | O | Date the plan ends or is replaced. When a plan is amended, the prior record is ended by setting its `EndDate`. |
| PlanName | String | R | Human-readable name of the plan. |
| PlanDesignation | Descriptor | R | Whether this is the student's Primary or an Alternative plan. |
| FinalizedDate | Date | O | Date the plan was finalized. A plan without a `FinalizedDate` is not yet final. |
| PlanNarrative | String | O | Free-text narrative for the plan. |
| Meeting | Object | OC | Meetings about the plan. See 5.3. |
| PlanChoice | Object | RC | Structured selections in the plan; at least one is required. See 5.5. |
| PlanGoal | Object | OC | Student goal statements. See 5.6. |

**Identity:** `Student` + `GraduationPlan` + `SchoolYear` + `BeginDate`.

### 5.3 Meeting (object, OC)

| Element | Type | Card. | Definition |
| --- | --- | --- | --- |
| MeetingType | Descriptor | I | Type of meeting (initial planning, review, amendment, finalization). |
| MeetingDate | Date | I | Date the meeting occurred. |
| MeetingNarrative | String | O | Narrative notes about the meeting. |
| Participant | Object | OC | Who took part in the meeting. See 5.4. |

A plan can have many meetings. Each is unique within the plan by `MeetingType` + `MeetingDate`.

### 5.4 Participant (object on Meeting, OC)

| Element | Type | Card. | Definition |
| --- | --- | --- | --- |
| ParticipantType | Descriptor | I | Role of the participant (e.g., Parent/Step-Parent/Guardian, Other Representative, Counselor, Student). |
| ParticipationMethod | Descriptor | O | How the participant took part (e.g., In Person, Telephone, Online). |
| Staff | Reference | O | The specific Ed-Fi `Staff` member, when known (e.g., the counselor). |
| Contact | Reference | O | The specific Ed-Fi `Contact`, when known (e.g., the parent or guardian). |

Attendance can be reported **by role alone**, which is how IGP attendance is recorded today. The `Staff` and `Contact` references are optional and only used when an implementation wants to name the individual.

Participants are identified by `ParticipantType` alone. Two parents at one meeting are distinguished by type (for example, `Mother` and `Father`). Source systems are not asked to invent participant identifiers that they do not have.

### 5.5 PlanChoice (object, RC)

| Element | Type | Card. | Definition |
| --- | --- | --- | --- |
| PlanChoiceType | Descriptor | I | Kind of choice (Career Cluster, Major, Postsecondary Plan, Academy, …). |
| PlanChoiceName | String | I | The selected or recommended value (e.g., Health Science, Sports Medicine, Four-Year College). |
| ChoiceStatus | Descriptor | O | Status of the choice (Selected, Recommended, …). |

Every plan carries at least one choice. Within a plan, each choice is unique by `PlanChoiceType` + `PlanChoiceName`. This allows more than one choice of the same type. In practice a student is expected to have only one choice per `PlanChoiceType`; the composite key future-proofs the model.

### 5.6 PlanGoal (object, OC)

The existing Data Standard 6.1 `Goal` entity and `GoalTypeDescriptor` were considered and not reused. Their definitions and data elements are oriented to educators rather than students, and `Goal` is identified by a person identifier, which is not a concept on the student side. The new object is therefore named `PlanGoal` (with `PlanGoalType`) to avoid a name collision. Generalizing the data model for both student and educator contexts, across `Goal`, `StudentIEPGoal`, and the IGP goal, should be examined for a future breaking release of the Data Standard.

Goal follows the Special Education Data Model's `StudentIEPGoal` (Early Access in Data Standard 6.1), which identifies a goal with `IEPGoalIdentifier` and describes it with `IEPGoalDetails`, `IEPGoalType`, and an optional `GoalAchievementPeriod`.

| Element | Type | Card. | Definition |
| --- | --- | --- | --- |
| GoalIdentifier | String | I | Identifier for the goal within the plan. Allows more than one goal of the same type. |
| PlanGoalType | Descriptor | R | Career, academic, or postsecondary goal. |
| GoalDetails | String | R | The goal statement (e.g., "Veterinarian"). |
| GoalAchievementPeriod | Object | O | A `Period` object: the time period for which the goal is applicable or effective, with `BeginDate` (required) and `EndDate` (optional). Same structure as `StudentIEPGoal.GoalAchievementPeriod`. |

### 5.7 Reused: GraduationPlan (Ed-Fi core, unchanged)

`GraduationPlan` is reused as-is. No changes are proposed. Its Data Standard 6.1 elements are:

| Element | Type | Card. | Definition (from Ed-Fi Data Standard 6.1) |
| --- | --- | --- | --- |
| GraduationPlanType | Descriptor | I | The type of academic plan the student is following for graduation. |
| EducationOrganization | Reference | I | The education organization defining the plan. |
| GraduationSchoolYear | SchoolYear | I | The school year the student is expected to graduate. |
| IndividualPlan | Boolean | O | An indicator of whether the graduation plan is tailored for an individual. |
| TotalRequiredCredits | Object | R | A `Credits` object: the total number of credits required for graduation under this plan (`Credits`, plus optional `CreditType` and `CreditConversion`). |
| CreditsBySubject | Object | OC | The total credits required in a subject to graduate (`AcademicSubject`, `Credits`). |
| CreditsByCourse | Object | OC | The total credits required by taking a specific course, or one or more from a set of courses (`CourseSetName`, `Course` references, `Credits`, optional `WhenTakenGradeLevel`). |
| CreditsByCreditCategory | Object | OC | The total credits required based on the credit category (`CreditCategory`, `Credits`). |
| RequiredAssessment | Object | OC | The assessments and associated required score and performance level needed to satisfy graduation requirements. |
| RequiredCertification | Object | OC | The title or reference to the certification(s) required for graduation. |

### 5.8 Reused: Student, Staff, and Contact (Ed-Fi core, unchanged)

These entities are reused as-is; no changes are proposed. `StudentGraduationPlan` references `Student`, and `Participant` optionally references `Staff` and `Contact`. Their Data Standard 6.1 elements are:

**Student** — This entity represents an individual for whom instruction, services, and/or care are provided in an early childhood, elementary, or secondary educational program under the jurisdiction of a school, education agency or other institution or program. A student is a person who has been enrolled in a school or other educational institution.

| Element | Type | Card. | Definition (from Ed-Fi Data Standard 6.1) |
| --- | --- | --- | --- |
| StudentUniqueId | String | I | A unique alphanumeric code assigned to a student. |
| Name | Object | R | Full legal name of the person. |
| OtherName | Object | OC | Other names (e.g., alias, nickname, previous legal name) associated with a person. |
| BirthData | Object | R | The set of elements that capture relevant data regarding a person's birth, including birth date and place of birth. |
| Person | Reference | O | Relates the student to a generic person. |

**Staff** — This entity represents an individual who performs specified activities for any public or private education institution or agency that provides instructional and/or support services to students or staff at the early childhood level through high school completion.

| Element | Type | Card. | Definition (from Ed-Fi Data Standard 6.1) |
| --- | --- | --- | --- |
| StaffUniqueId | String | I | A unique alphanumeric code assigned to a staff. |
| Name | Object | R | Full legal name of the person. |
| OtherName | Object | OC | Other names associated with a person. |
| BirthDate | Date | O | The month, day, and year on which an individual was born. |
| HighestCompletedLevelOfEducation | Descriptor | O | The extent of formal instruction an individual has received (e.g., the highest grade in school completed or its equivalent or the highest degree received). |
| YearsOfPriorProfessionalExperience | Decimal | O | The total number of years that an individual has previously held a similar professional position in one or more education institutions prior to the current school year. |
| YearsOfPriorTeachingExperience | Decimal | O | The total number of years that an individual has previously held a teaching position in one or more education institutions prior to the current school year. |
| LoginId | String | O | The login ID for the user; used for security access control interface. |
| HighlyQualifiedTeacher | Boolean | O | An indication of whether a teacher is classified as highly qualified for his/her assignment according to state definition. This attribute indicates the teacher is highly qualified for ALL Sections being taught. |
| Recognition | Object | OC | Recognitions given to the staff for accomplishments in a co-curricular or extracurricular activity. |
| Credential | Reference | OC | The legal document giving authorization to perform teaching assignment services. |
| Person | Reference | O | Relates the staff to a generic person. |
| HighlyQualifiedAcademicSubject | Descriptor | OC | The academic subject(s) in which the staff is deemed to be "highly qualified". |
| EducatorResearch | Object | O | The educator preparation provider faculty that instruct teacher candidates in content area or pedagogy. |
| EducatorPreparationProgram | Reference | OC | The educator preparation program(s) completed by the teacher. |
| OpenStaffPosition | Reference | O | Reference to the open staff position filled by the staff. |

**Contact** — This entity represents a contact of a student, such as a parent, guardian or caretaker.

| Element | Type | Card. | Definition (from Ed-Fi Data Standard 6.1) |
| --- | --- | --- | --- |
| ContactUniqueId | String | I | A unique alphanumeric code assigned to a contact. |
| Name | Object | R | Full legal name of the person. |
| OtherName | Object | OC | Other names (e.g., alias, nickname, previous legal name) associated with a person. |
| Sex | Descriptor | O | A person's birth sex. |
| GenderIdentity | Object | O | The gender the contact identifies themselves as. |
| Address | Object | OC | Contact's address, if different from the student address. |
| InternationalAddress | Object | OC | The set of elements that describes an international address. |
| Telephone | Object | OC | The 10-digit telephone number, including the area code, for the person. |
| ElectronicMail | Object | OC | The numbers, letters, and symbols used to identify an electronic mail (e-mail) user within the network to which the individual or organization belongs. |
| LoginId | String | O | The login ID for the user; used for security access control interface. |
| Language | Object | OC | The language(s) the individual uses to communicate. It is strongly recommended that entries use only ISO 639-2 language codes. |
| Person | Reference | O | Relates the contact to a generic person. |
| HighestCompletedLevelOfEducation | Descriptor | O | The extent of formal instruction an individual has received (e.g., the highest grade in school completed or its equivalent or the highest degree received). |

### 5.9 Business rules

1. **One primary plan per student per school year.** At most one `StudentGraduationPlan` per `Student` + `SchoolYear` should have `PlanDesignation = Primary`. The composite key scopes plans by year but cannot enforce this rule by itself, so it is a documented validation rule, consistent with how Ed-Fi handles "primary" designations elsewhere.
2. **At least one PlanChoice** on every `StudentGraduationPlan`. South Carolina requires at least one plan choice, so the collection is required. Indiana does not currently collect plan choices; the purpose of an individualized graduation plan is to record one or more choices the student has selected, so Indiana will be guided to collect them.
3. **Finalized means `FinalizedDate` is present.** There is no separate status field.
4. **Amendments create a new record.** Source systems do not track a plan status that says whether a plan has been amended. When a plan is amended, the existing record is ended (`EndDate`) and a new record is created with a new `BeginDate`.

### 5.10 Relationship to the existing model

`StudentSchoolAssociation` already carries `graduationPlanReference` and an `alternativeGraduationPlans` collection. A question to the SIS SIG found that many SIS vendors do not send this information to agencies. Whether those elements should be deprecated is an open question. Answering it requires focused meetings with SIS vendors and agencies, which this RFC treats as outside its scope. Deprecation would be a breaking change and cannot be part of Data Standard 6.2, so this RFC leaves the question unanswered for a future breaking release.

### 5.11 Open questions

- **Authorization.** The `GraduationPlan` reference carries `EducationOrganization` as a required identity element. Can authorization for `StudentGraduationPlan` be handled through that education organization? This is not yet decided.

## 6. Descriptors

These are starter values. Each is a descriptor, so states govern and extend the lists without a model change. Values marked † were confirmed in Panorama's review (§11).

| Descriptor | Starter values |
| --- | --- |
| PlanDesignation | Primary · Alternative |
| MeetingType | Initial Planning Meeting† · Plan Review Meeting† · Plan Amendment Meeting† · Plan Finalization Meeting |
| ParticipantType | Parent/Step-Parent/Guardian† · Other Representative† · Student · Counselor · Teacher · Administrator · Other |
| ParticipationMethod | In Person† · Telephone† · Email† · Online† · Video Conference† · Other† |
| PlanChoiceType | Career Cluster† · Major† · Postsecondary Plan† · Academy† · CTE Plan · Seal · Scholarship · Local Opportunity |
| ChoiceStatus | Selected · Recommended · Completed · Declined · Undecided |
| PlanGoalType | Career Goal† · Academic Goal · Postsecondary Goal |

The SCDE mapping also uses **No Representative** as an attendance value.

Example `PlanChoiceName` values from the SCDE mapping: _Postsecondary Plan:_ Workforce/Apprenticeship, Military, Four-Year College, Two-Year College/Technical Training, Undecided. _Career Cluster:_ Health Science, Information Support and Services. _Major:_ Sports Medicine.

## 7. Goal vs. Plan Choice

| | PlanGoal | PlanChoice |
| --- | --- | --- |
| Represents | What the student is trying to accomplish | What the student selected in the plan |
| Example | "Become a veterinarian" | Health Science cluster · Sports Medicine major |
| Career goal | ✅ `PlanGoalType = Career Goal` | — |
| Career cluster | — | ✅ `PlanChoiceType = Career Cluster` |
| Major | — | ✅ `PlanChoiceType = Major` |
| Postsecondary plan | When phrased as an aspiration | When it is the selected option |

Career goals are often selected from a curated list based on the Standard Occupational Classification (SOC) system. They map to `PlanGoal` because they describe an aspiration, not a pathway selection.

## 8. Alternatives Considered

Section 1.4 covers keeping IGP data in student indicators (Option A), using `GraduationPlan` alone (Option B), and a custom state extension (Option C). Two other alternatives were also considered:

| Alternative | Why not |
| --- | --- |
| Ed-Fi `Path` / `StudentPath` | Built for formal pathways with phases and milestones. The current need is to record selections, so Path would over-model it. A future version could add an optional Path link from a choice. |
| Four or five standalone entities (earlier working draft: `IGPEvent`, `StudentIGP`, `StudentIGPGoal`, `StudentIGPPlanChoice`) | More resources to send, authorize, and govern. The same data fits as inline collections on one entity. |

## 9. Source Mappings

### 9.1 SCDE student indicators (`StudentEducationOrganizationAssociation`) → model

| Current indicator | New location |
| --- | --- |
| `IGP_Primary` | `StudentGraduationPlan.PlanDesignation` (Primary) |
| `IGP_Attendance` | `Meeting.Participant.ParticipantType` |
| `IGP_Participation` | `Meeting.Participant.ParticipationMethod` |
| `IGP_Cluster` | `PlanChoice` (type = Career Cluster) |
| `IGP_Major` | `PlanChoice` (type = Major) |
| `IGP_Postsecondary_Plan` | `PlanChoice` (type = Postsecondary Plan) |

### 9.2 IGP data elements → model

This table shows where each piece of IGP data a source system sends lands in the model.

| IGP data element | Example | Model element |
| --- | --- | --- |
| School year of the plan | 2028–2029 | `StudentGraduationPlan.SchoolYear` |
| Plan name | (plan title) | `StudentGraduationPlan.PlanName` |
| Primary plan flag | Yes | `StudentGraduationPlan.PlanDesignation` = Primary |
| Plan completed / finalized | | `FinalizedDate` populated |
| Plan in progress | | Record sent, no `FinalizedDate` |
| Plan not started | | No record sent |
| Career goal | Veterinarian | `PlanGoal` (type = Career Goal), `GoalDetails` |
| Career cluster | Health Science | `PlanChoice` (type = Career Cluster) |
| Major | Sports Medicine | `PlanChoice` (type = Major) |
| Postsecondary plan | Four-Year College | `PlanChoice` (type = Postsecondary Plan) |
| Academy | (academy name) | `PlanChoice` (type = Academy) |
| Meeting type and date | Initial planning meeting | `Meeting` |
| Attendee role | Parent/step-parent/guardian | `Meeting.Participant.ParticipantType` |
| Participation method | Video conference | `Meeting.Participant.ParticipationMethod` |

### 9.3 Indiana `StudentSchoolGraduationPlans` → model

| Indiana element | Model element |
| --- | --- |
| `StudentUniqueId` | `StudentGraduationPlan.Student` |
| `SchoolId` | No direct equivalent. The `GraduationPlan` reference carries the education organization that defines the plan. |
| `GraduationPlanReference` (EducationOrganizationId, GraduationPlanTypeDescriptor, GraduationSchoolYear) | `StudentGraduationPlan.GraduationPlan` |
| `BeginDate` | `StudentGraduationPlan.BeginDate` |
| `EndDate` | `StudentGraduationPlan.EndDate` |
| `alternativeGraduationPlans[].GraduationPlanReference` | A second `StudentGraduationPlan` with `PlanDesignation = Alternative` |

**One structural difference.** Indiana carries the primary plan and its alternatives on one record (`alternativeGraduationPlans` is a collection on it). This model uses one record per plan and marks each Primary or Alternative. The information is the same, but the shape differs, and an Indiana mapping would split one record into two.

## 10. Indiana: Needs, Policy, and Existing Extension

**Policy.** Under IC 20-30-4-2, every Indiana student develops a graduation plan by the end of grade 8. Completing it in grade 7 is optional and counts for accountability. The plan is developed with a school counselor and parent consultation, becomes part of the student's permanent record, and is accessible to parents under FERPA.

**What stays local and what is reported.** The full plan (courses, seals, goals, career and school choices) is collected and kept locally. Only a lightweight Grad Plan indicator goes to the state Data Exchange. It records that an official plan exists, is reported in grade 8 or 9 (no later than the end of grade 9), and allows up to two plans: a primary and one alternative.

**Indiana already collects this through an Ed-Fi extension.** The state record is reported through the `StudentSchoolGraduationPlans` resource. It associates a student and school to a `GraduationPlan` with begin and end dates and carries an `alternativeGraduationPlans` collection. The plan type is the `GraduationPlanTypeDescriptor`, carrying Indiana's diploma pathways:

- Indiana Diploma
- Indiana Diploma with Enrollment Honors / Enrollment Honors Plus
- Indiana Diploma with Enlistment Honors / Enlistment Honors Plus
- Indiana Diploma with Employment Honors / Employment Honors Plus
- Alternate Diploma

This is, in substance, the student-to-`GraduationPlan` association this RFC proposes, already running in production. Indiana's state indicator maps to the plan-level fields of `StudentGraduationPlan` (§9.3). Indiana's locally retained plan maps to the inline collections.

**Coverage of the Indiana local template.** Most of the content on Indiana's graduation plan template maps to this model or to other Ed-Fi domains: diploma requirements to `GraduationPlan`; seals and school/program choices to `PlanChoice`; career interests to `PlanGoal`; assessment scores to the Assessment domain; earned credits and grades to the Student Academic Record domain. Two items have no home in this model: the per-year planned course schedule, and formal parent approval with a date.

Policy source: [IDOE — How to Report Student Grad Plan](https://idoe.atlassian.net/wiki/spaces/IKHTV/pages/1604091905/How+to+Report+Student+Grad+Plan)

## 11. Panorama Model Review

Panorama reviewed the proposed model and provided the feedback below. The review was based on an earlier working draft (the multi-entity `IGPEvent` / `StudentIGP` model), so several items are already met by the current design.

| Recommendation | Disposition | Notes |
| --- | --- | --- |
| Event should be a child of Plan, with many events per plan | **Already met** | `Meeting` is a 0..* collection on `StudentGraduationPlan`. |
| Add `SchoolYear` to the plan's identity | **Adopted** | Plans are scoped by the year they are active, which is stable. `GraduationSchoolYear` is not carried on `StudentGraduationPlan`; it comes from the referenced `GraduationPlan`, where it is part of the key. |
| Add a plan name | **Adopted** | `PlanName` (required), as proposed by Panorama. |
| Keep free text out of the Choice identity | **Not adopted** | `PlanChoiceName` is part of the key with `PlanChoiceType`, so that more than one choice of the same type can be recorded. |
| Primary indicator should be required | **Adopted, as a descriptor** | `PlanDesignation` (Primary / Alternative) is required. It replaces a boolean so alternatives can be sent. |
| Record attendance by role, not by person | **Compatible** | `ParticipantType` alone is enough; no participant identifier is added. `Staff` / `Contact` references are optional and need not be sent. |
| Add "Descriptor" suffix to every controlled-vocabulary field | **Not adopted in the model** | Ed-Fi MetaEd adds the "Descriptor" suffix when it generates technical artifacts, so the API properties still end in `…Descriptor`, as Panorama expects. |
| Remove the Goal identifier; identify PlanGoal by type | **Not adopted** | `GoalIdentifier` allows more than one goal of the same type, and matches the Special Education Data Model's `IEPGoalIdentifier`. A source system that sends one goal per type still fits. |
| PlanGoal and Choice reference the meeting where they were set | **Not adopted** | South Carolina's requirements tie meetings to the plan as a whole, not to individual goals or choices. Meetings are recorded once on the plan (`Meeting`). |
| `EventReason` as a descriptor | **Not adopted** | Meeting reason was removed. `MeetingType` and `MeetingNarrative` cover the need. |
| `PlanStatus` / `ProgressStatus` descriptors | **Not adopted** | Status is expressed by `FinalizedDate` and `PlanDesignation`. See the mapping in §9.2. |
| `GoalAchievementPeriod` | **Adopted, following the Special Education Data Model** | Added as an optional `Period` (`BeginDate`, `EndDate`), the same structure as `StudentIEPGoal.GoalAchievementPeriod`. This settles the type question Panorama raised. |

## 12. Implementation Guidance

- **Source.** A source system, either an SIS or a College and Career Guidance System, writes `StudentGraduationPlan`. South Carolina initially plans to receive the data from the SIS, which writes to the Palmetto Collaborative; from there the data flows to the State Data System. `StudentEducationOrganizationAssociation` keeps carrying its other student data.
- **Authorization.** Follow the pattern used for other student-level resources: the caller must be authorized for the student through the relevant education organization.
- **Status mapping.** Send nothing for "not started" plans. Send a record without `FinalizedDate` for plans in progress. Populate `FinalizedDate` when the plan is final.
- **Updates.** Because collections are embedded, the source system sends the complete plan (all meetings, participants, choices, and goals) on each write.
- **Descriptor governance.** Seed the starter values in §6. States add values through descriptor governance, not schema changes.

## References

### Source documents

- SCDE — _Individual Graduation Plan (IGP) Data Passback in South Carolina_ (overview of the write-conflict challenge and options A–C)
- Panorama — _IGP Ed-Fi Extension — Model Assessment Notes_ (v2.0, July 6, 2026) and _IGP Ed-Fi Extension Review Matrix_
- IDOE — `StudentSchoolGraduationPlans` data collection example (Indiana state reporting specification)
- [Learn More Indiana — Graduation Plan template (New Diploma)](https://learnmoreindiana.org/wp-content/uploads/2026/04/26-Graduation-Plan_New-Diploma.pdf)

### Standards, statutes, and policy

- [S.C. Code Title 59, Chapter 59 (EEDA): _South Carolina Education and Economic Development Act_](https://www.scstatehouse.gov/code/t59c059.php)
- [Indiana Code IC 20-30-4-2; IDOE: _How to Report Student Grad Plan_](https://idoe.atlassian.net/wiki/spaces/IKHTV/pages/1604091905/How+to+Report+Student+Grad+Plan)
- [Ed-Fi Data Standard: Graduation Domain](https://docs.ed-fi.org/reference/data-exchange/data-standard/model-reference/graduation-domain/)
- [Ed-Fi Data Standard v6.1.0 source (Ed-Fi-Core.xsd: `GraduationPlan`, `StudentEducationOrganizationAssociation`, `StudentIEP`, `StudentIEPGoal`, `IDEAEvent`)](https://github.com/Ed-Fi-Alliance-OSS/Ed-Fi-Data-Standard/tree/v6.1.0)
