---
name: ed-fi-rfc
description: Use when writing, revising, or reviewing an Ed-Fi Request for Comments (RFC) that proposes additions or changes to the Ed-Fi Data Standard, the Ed-Fi Resources API, or another Ed-Fi specification. Triggers on "write an RFC", "draft RFC NN", "review this RFC", "is this RFC ready for comment", or any new or changed file under RFC/.
---

# Ed-Fi RFC

## Overview

An Ed-Fi Data Standard RFC asks the community (SEAs, LEAs, SIS and other
vendors, the Data Standard Work Group, special interest groups) to react to a
concrete proposal before it ships. A good RFC lets a reader who has never seen
the internal discussion answer three questions in five minutes: _what changes,
why, and what does it cost me?_ Everything after that is evidence and detail for
the reader who wants to check.

**Core principle:** every element, key, cardinality, and claim in an RFC must
agree with every other mention of it in the same document, and with the
current Data Standard. Reviewers spend most of their effort finding the places
where the synopsis, the diagram, the tables, and the breaking-change list
disagree. Prevent that before publishing.

These lessons come from RFC 18 (Finance API), RFC 24 (Core Student API),
RFC 25 (Survey API), RFC 28b (Special Education Data Model), RFC 29a
(OpenStaffPosition), and RFC 29b (GenerationCodeSuffix).

## When to Use

- Drafting a new RFC from Jira tickets, work-group notes, or a state extension.
- Revising a draft after community or work-group feedback.
- Reviewing an RFC (yours or someone else's) before it is posted as a GitHub
  Discussion or finalized into `RFC/`.

Not for: Data Standard release notes, ADRs (use `write-an-adr`), or API
design guidelines.

## Workflow

### Writing

1. **Collect the evidence first.** Jira tickets, roadmap items, field
   implementations (state extensions, vendor models), work-group or SIG
   meeting notes, external standards (CEDS, NCES, federal statute). An RFC
   with no named field implementation or requirement source is a wish, not a
   proposal.
2. **Check the current model.** Confirm every existing entity, element,
   descriptor, and key you mention against the target Data Standard version.
   The `anthropic-skills:ed-fi-api-spec` skill can look up resources, keys,
   and fields without loading the OpenAPI file.
3. **Start from [references/template.md](references/template.md).** Delete
   sections that do not apply (for example, Breaking Changes for a purely
   additive proposal) instead of leaving them empty.
4. **Write the Synopsis last.** It must summarize the body as written, not
   the plan you started with.
5. **Run the review checklist on your own draft** before asking anyone else to
   read it.
6. **Table of contents**. Link each entry to its corresponding section heading
   in the `RFC/README.md` file.

### Reviewing

1. Read the Synopsis and Questions for the Community first, then the body.
   Note every claim the Synopsis makes.
2. Work through [references/review-checklist.md](references/review-checklist.md).
3. Report findings ranked by impact: contradictions and errors in the model
   first, missing sections next, style and formatting last. Quote the
   conflicting passages side by side so the author can fix them without
   hunting.

## Lessons Learned

### The header block is the contract

Every RFC opens with the same fields: **Product**, **Affects**, **Obsoletes**,
**Obsoleted By**, **Status**, **Author**, and a date.

- Use one format across RFCs. Past RFCs used backslash line breaks (28b, 29a),
  bare lines with no title (29b), and a table (newer drafts). Follow the
  template.
- Fill in every field. RFC 18 shipped with `[date]` as its date; `[TBD]` RFC
  numbers have also appeared. Placeholders tell readers the document is not
  ready.
- **Affects** names the product version (and, for RFC 24, a prior RFC) that
  changes. **Obsoletes** links the RFC this one replaces; RFC 24 then explains
  what it carried over from RFC 20 and what it revised.
- **Status** comes from a small vocabulary: `Draft`, `Early Access`,
  `Active`, `Published`, `Obsolete`. Avoid free text such as "Draft and
  Incomplete (only proposal 1 included on 9/16)" (29b). If a draft is
  incomplete, say so in the Synopsis and list what is missing.

### Synopsis: what, why, where to comment

The best synopses (25, 28b, 29a) say in one or two paragraphs what the RFC
introduces, the problem it solves, whether it is breaking, the target
release, and a link to the comment venue.

The Synopsis must not contradict the body. 29a's Synopsis says obsolete
elements "will be deleted and not marked for deprecation" and that
`OpenStaffPositionEvent` "will be marked for deprecation", while the body says
`OpenStaffPositionReason` is deprecated and that deprecating
`OpenStaffPositionEvent` is only _proposed_. Distinguish decisions from
proposals everywhere, and use the same verb in every section.

### Ground the problem in the field

- Describe the current model precisely (entity, key, the elements in play)
  and then the specific failure: what a real implementer cannot represent, or
  must overwrite, or must extend. 28b and 29a do this well.
- Name the implementations that inform the design: Texas TEA's extension
  (29a), the Wyoming standards-based grading model (24), state v3.x extensions
  (24), surveyed SIS vendors (24). Say when other states reported no use; that
  is evidence too.
- Quantify impact where you can: "`AcademicSubject` is referenced across 26
  of 37 subdomains" (29a) ends the "why not reuse it" debate in one line.
- List primary references and alignment targets (RFC 18 cites NCES and
  WUFAR; RFC 24 aligns Title I descriptor values with CEDS).

### Use cases need actors and actions

RFC 18 organizes use cases by persona (SEA, LEA, CMO) and each is a short
sequence of who does what through the API. RFC 25 gives concrete examples
(student perception survey, staff satisfaction survey). 28b's use cases are
long abstract paragraphs that restate the Overview. Write use cases as
"_Actor_ does _action_ so that _outcome_", and make each one map to entities
in the model.

### Take a position on the obvious alternative

Readers will ask "why not reuse X?" or "why not just extend Y?". Answer it in
the document.

- RFC 25 states plainly that Survey and Assessment should _not_ be merged,
  gives the reasons, and then provides field-by-field mapping tables between
  the two models, including what does not map.
- 28b says SEDM "complements, rather than replaces"
  `StudentSpecialEducationProgramAssociation`, and recommends who should
  adopt first (special education vendors, not SIS vendors).
- 29a explains why `InstructionalSubject` is a new descriptor rather than a
  change to `AcademicSubject`.

State what happens to the existing structure, and give implementers guidance
on which to use when.

### When promoting a model, list the deltas

When an extension, community model, or work-group model (TPDM, a state
extension) moves into core, list every difference from the source and why.
RFC 25's "Differences Between Survey Domain in TPDM and the Survey API"
section is the model: namespace added for authorization, term descriptor
replaced with session, new `ResponseChoice` and `SurveyQuestionResponseValue`
structures, each with a reason.

### Address authorization and identity explicitly

Keys drive both upsert behavior and API authorization. Call out:

- Every identity (natural key) and why each part is in it. 29a flags openly
  that whether `OpenStaffPosition` belongs in the `Requisition` identity is
  still a question.
- How records will be secured: education-organization-based, namespace-based
  (RFC 25 added `Namespace` to every survey key for this reason), or
  person-based. 29a notes that a school-level reference "could affect
  authorization patterns"; that kind of note belongs in every RFC that adds
  or changes a reference.
- History semantics: does a change create a new record or update the old one?
  28b says an amended IEP creates a new `StudentIEP` with `IEPAmendedDate`.

### The model section: one diagram, consistent tables

- Include a Mermaid `erDiagram` with a **notation legend** (29a: `I` =
  identity, `R` = required, `O` = optional, `C` = collection). 28b has no
  legend, so readers must guess.
- Color or label new and changed entities, and for changes show _current vs.
  proposed_ side by side (29a).
- Show only the keys of unchanged context entities. 28b lists every attribute
  of `Staff` and `EducationOrganization`, which adds noise and invites
  readers to think those entities are changing.
- Make sure the diagram renders. Mermaid entity attributes are
  `type name "comment"`; nested or indented attributes (29a's
  `PositionVacancy` children) and multi-word names (29a's
  `descriptor SchoolCategory named as InstructionalGradeRange`) do not render
  as intended. Put explanations in the comment string.
- Do not reference internal working files ("Diagram is an exact match of
  `OpenStaffPosition - Current and Future Comparison.mmd`", 29a).
- For each new or changed entity: a short purpose paragraph, then an
  **Identity** table (Field, Type, Description) and a **Properties** table
  (Field, Type, Required, Description). Give lengths and precision (`String
  (120)`, `Decimal (5,2)`), as 28b does. 29a lists bare `String` and
  `Decimal`.
- Every description is a definition a reader can implement against. "Existing
  field, unchanged." (29a) is a change note, not a definition; put the change
  note in its own column or sentence and keep the definition.
- **Cross-check every element across the diagram, the tables, and the prose.**
  29a's diagram, text, and table disagree on whether the grade element is
  `InstructionalGradeRange`, `GradeLevelRange`, or `SchoolCategory`, and its
  description ("The one or more categories of school") does not explain
  which.
- For each new descriptor: its definition, its proposed default values or
  where they come from (CEDS, a state list), and whether it replaces an
  existing descriptor.

### Follow Ed-Fi modeling conventions, and say so

- A string that serves as an identity ends in `Identifier`, not `Number`
  (29a renamed `RequisitionNumber` and `PositionControlNumber`).
- Prefer agnostic names over state-specific or vendor-specific framing
  (29a's `Requisition` rather than `StaffRequisition`).
- Do not repurpose a widely used descriptor for a new meaning; add a new one.
- **Optional stays optional.** Required or key elements that some
  implementers cannot supply push them to extensions instead of core. Some
  data cannot legally be collected in some states (29a's salary fields). Ask
  of every `Required` element: can every SEA, LEA, and vendor supply it?
- Spell out semantic rules that vary by implementation, such as inclusive vs.
  exclusive dates (28b).

### Breaking changes and deprecation

- Say up front whether the RFC is breaking. RFC 24 defines what
  "non-breaking" means (additive, optional, widened types and lengths) and
  warns that any change can break a specific client.
- For identity changes, include a table of old key vs. new key per entity
  (29a).
- List every removed, renamed, relocated, and deprecated element, with the
  replacement. RFC 24's deprecated-elements table (Item, Type, Reason &
  Proposed Alternative) is the model.
- Give the deprecation timeline in Data Standard versions: introduce in N,
  deprecate in N and N+1, remove in N+2 (29b). Do not delete without
  deprecation unless the RFC explains why.
- Describe migration: what existing data maps where, and what cleanup source
  systems face (29b's vendor feedback on suffix cleanup).

### API section: resources, conventions, examples

- Table of resources and routes (28b), with the namespace (`ed-fi`) and the
  operations supported.
- A conformance statement: implementations follow the Ed-Fi API Design and
  Implementation Guidelines, MUST requirements apply, and which document
  takes precedence if they differ (RFC 18).
- Link the OpenAPI specification, or state when it will be published.
- At least one realistic JSON example for a non-obvious resource (RFC 18's
  chart-of-accounts and local-account examples, with notes on what the API
  does and does not enforce).

### While the RFC is under review

#### Show who has already reviewed it

Summarize prior review: work-group sessions, SIG reviews, vendor feedback,
with dates (29a: introduced at DSWG June 2026; 29b: SIS-SIG reviewed
9/15/2026, with a bullet summary of the feedback). This tells new readers what
has been settled and what is still open.

#### Questions for the Community

- Number questions so comments can cite them (RFC 18 uses "RFC 18 Q1").
- Each question gives the context and the trade-off in a sentence or two,
  then asks something answerable: yes/no, which option, or "are you using
  X?".
- Tie each question to the section it affects, and mark in the body where an
  open question applies (29a's "see Questions for the Community").
- Close with an exit: if existing systems or processes already handle the
  concern, no change is needed (RFC 18).
- State out-of-scope items explicitly so they are not mistaken for omissions
  (29a: candidate tracking, school-level references).

#### Feedback and timeline

- Give the venue as a link (GitHub Discussion, labeled `RFC`) and say what
  context respondents should include: organization type, state or product,
  whether they use the affected entities today (29a's "How to Respond").
- Give the target release and the comment window.

### After the RFC is approved

- Record the approval date and any conditions or follow-up actions.
- Remove resolved questions and update the RFC to reflect the approved decision.

### Hygiene

- File name `RFC-<NN><letter>_<Title-With-Hyphens>.md` in `RFC/`, and add the
  RFC to the table of contents in `RFC/README.md` under its Data Standard
  version. Check the link resolves; the README entry for 29a points to
  `RFC-29a_Open-Staff-Position.md` while the file is
  `RFC-29a_OpenStaffPosition.md`.
- One H1 title (`# Ed-Fi RFC <NN><letter>: <Title>`); real headings, not bold
  text inside headings (29b uses `### **Synopsis**` with no H1).
- Follow `.markdownlint.yaml`: underscore emphasis, consistent list markers,
  tables with leading and trailing pipes, no inline HTML beyond the allowed
  elements (`<br/>` inside Mermaid is fine; it is in a code block).
- Expand every acronym on first use (28b does this for IEP, IDEA, LEA, SEA).
- Use element names in backticks, exactly as they appear in the model.
- Use absolute dates, not "as of 9/16" or "shortly".
- Spell-check names of products and standards (RFC 25 has "Qualtrex" for
  Qualtrics).
- Keep prose short. Say each point once, in the section where it belongs.

## Red Flags

| Thought | Reality |
| --- | --- |
| "The diagram is close enough to the tables." | Readers implement from whichever they read first. Every mismatch becomes a comment thread or a bug. |
| "Everyone in the work group knows why we did this." | The RFC audience was not in the work group. Write the reason down. |
| "We'll make it required so data quality improves." | Implementers who cannot supply it will extend around core instead. |
| "It's just a rename." | A rename of a key element is a breaking change. It needs the identity table and a migration note. |
| "We'll add the questions later." | Without questions, readers do not know what feedback is wanted, and silence is read as agreement. |
| "The Synopsis was right when I wrote it." | Rewrite it after every substantive revision of the body. |
