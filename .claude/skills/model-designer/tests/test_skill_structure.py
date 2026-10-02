# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

import re
import unittest
from pathlib import Path

import yaml

SKILL_PATH = Path(__file__).resolve().parent.parent / "SKILL.md"
SPEC_PATH = (
    Path(__file__).resolve().parent.parent / "references" / "data-dictionary-spec.md"
)

REQUIRED_SECTIONS = [
    "## Purpose",
    "## Paths",
    "## Modes",
    "## Step Flow (Design Mode)",
    "## Output Artifacts",
    "## Reference Materials",
    "## Explicitly Out of Scope",
    "## Behavior Rules",
    "## Red Flags",
]


def _read_skill_text():
    return SKILL_PATH.read_text(encoding="utf-8")


def _read_spec_text():
    """The data-dictionary column spec lives beside the script it governs.

    SKILL.md owns *when* to generate a workbook; this file owns *what goes in
    it*. Assertions about column conventions read from here.
    """
    return SPEC_PATH.read_text(encoding="utf-8")


def _parse_frontmatter(text):
    match = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not match:
        raise AssertionError("SKILL.md has no --- frontmatter block")
    return yaml.safe_load(match.group(1))


class TestSkillStructure(unittest.TestCase):
    def test_file_exists(self):
        self.assertTrue(SKILL_PATH.exists(), f"missing {SKILL_PATH}")

    def test_frontmatter_has_name_and_description(self):
        fm = _parse_frontmatter(_read_skill_text())
        self.assertEqual(fm.get("name"), "model-designer")
        self.assertTrue(fm.get("description"), "description must be non-empty")

    def test_required_sections_present_in_order(self):
        text = _read_skill_text()
        positions = []
        for header in REQUIRED_SECTIONS:
            idx = text.find(header)
            self.assertGreaterEqual(idx, 0, f"missing section header: {header}")
            positions.append(idx)
        self.assertEqual(
            positions, sorted(positions),
            "required sections are present but out of order",
        )

    def test_purpose_names_the_pipeline(self):
        text = _read_skill_text()
        purpose = text.split("## Purpose")[1].split("## Modes")[0]
        for marker in ("DS-Need", "GitHub Issue", "review-model-pr"):
            self.assertIn(marker, purpose, f"Purpose section missing '{marker}'")

    def test_modes_section_defines_both_modes(self):
        text = _read_skill_text()
        modes = text.split("## Modes")[1].split("## Step Flow")[0]
        self.assertIn("Design mode", modes)
        self.assertIn("Critique mode", modes)

    def test_step0_covers_single_use_case_and_whole_doc_paths(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("### Step 0", step_flow)
        self.assertIn("batching plan", step_flow)
        self.assertIn("never an automatic merge", step_flow)

    def test_steps_1_and_2_reference_real_model_paths(self):
        # The model package is resolved at runtime and defined once, in
        # ## Paths; the Step Flow refers to it by token. Both halves are
        # asserted so centralising cannot quietly turn into losing the
        # resolution step altogether.
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        paths = text.split("## Paths")[1].split("## Modes")[0]
        self.assertIn("### Step 1", step_flow)
        self.assertIn("### Step 2", step_flow)
        self.assertIn("<EDFI_MODEL_PACKAGE_DIR>", step_flow)
        self.assertIn("resolve_model_package.py", paths)
        self.assertIn("suggestion from the source material, not a decision", step_flow)

    def test_step3_covers_precedent_sources(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("### Step 3", step_flow)
        self.assertIn("DATASTDDEV", step_flow)
        self.assertIn("DATASTD, MODL", step_flow)
        self.assertIn("712278041", step_flow)

    def test_step4_defines_verdicts_and_mandatory_pushback(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("### Step 4", step_flow)
        for verdict in ("Recommend", "Caution", "Reject"):
            self.assertIn(verdict, step_flow)
        self.assertIn("explicit choice they make after seeing the conflict", step_flow)

    def test_step5_and_critique_entry_point_present(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("### Step 5", step_flow)
        self.assertIn("one topic at a time", step_flow)
        self.assertIn("### Critique Mode Entry Point", step_flow)

    def test_output_artifacts_defaults_vs_on_request_and_mermaid_reference(self):
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        self.assertIn("Generated by default", artifacts)
        self.assertIn("only on explicit request", artifacts)
        self.assertIn("erDiagram", artifacts)
        self.assertIn("mermaid-er-example.md", artifacts)

    def test_output_artifacts_invocation_uses_skill_relative_script_path(self):
        # Resolved from the skill's own folder, so the skill runs unchanged
        # wherever it is installed -- a user's skills folder or a repo's
        # .claude/skills/.
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        paths = text.split("## Paths")[1].split("## Modes")[0]
        self.assertIn("<DATA_DICTIONARY_SCRIPT>", artifacts)
        self.assertIn("scripts/generate_data_dictionary.py", paths)
        self.assertIn(".xlsx", artifacts)

    def test_output_artifacts_requires_persisting_the_input_json(self):
        # The .xlsx is a render, not the source. Leaving the JSON in a
        # scratchpad lost it between sessions once already.
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        self.assertIn("Save the input JSON beside the workbook", artifacts)
        self.assertIn("never only in a scratchpad", artifacts)

    def test_other_column_documents_reuse_provenance_lines(self):
        artifacts = _read_spec_text()
        for marker in ("Core Source:", "Role Name:", "Named:"):
            self.assertIn(marker, artifacts, f"Other column omits {marker!r}")

    def test_renamed_from_is_forbidden_in_the_other_column(self):
        # Provenance keys state durable facts about core. A former draft name
        # is change-tracking, which belongs in the narrative doc -- same axis
        # as the deleted Status column.
        artifacts = _read_spec_text()
        self.assertIn("Do not add a `Renamed From:` line", artifacts)

    def test_role_name_and_named_are_kept_distinct(self):
        # MetaEd has two different rename constructs: "role name" on
        # references/descriptors and "named" on shared strings.
        artifacts = _read_spec_text()
        self.assertIn("role name", artifacts)
        self.assertIn("named MaidenName", artifacts)
        self.assertIn("Do not conflate it", artifacts)

    def test_reuse_provenance_requires_reading_metaed_source(self):
        artifacts = _read_spec_text()
        self.assertIn("direct read of the", artifacts)
        self.assertIn("never from a narrative doc's prose or from memory", artifacts)

    def test_commons_tab_convention_is_documented(self):
        artifacts = _read_spec_text()
        self.assertIn("never build the object inside `Other`", artifacts)
        self.assertIn('"kind": "common"', artifacts)
        self.assertIn("Structure: see Commons tab", artifacts)

    def test_commons_tab_scope_is_new_or_restructured_only(self):
        artifacts = _read_spec_text()
        self.assertIn("new or restructured commons only", artifacts)
        self.assertIn("gets no block", artifacts)

    def test_unknown_shape_common_must_not_be_filled_by_inference(self):
        artifacts = _read_spec_text()
        self.assertIn("no property rows", artifacts)
        self.assertIn("populate its fields by inference", artifacts)

    def test_output_artifacts_documents_core_fit_as_seventh_column(self):
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        self.assertIn("**Core Fit**", artifacts)
        self.assertIn("seven columns", artifacts)

    def test_core_fit_values_in_skill_match_the_script(self):
        import sys

        sys.path.insert(0, str(SKILL_PATH.parent / "scripts"))
        from generate_data_dictionary import CORE_FIT_VALUES

        mapping = _read_skill_text().split("### Extension Fit Mapping")[1]
        spec = _read_spec_text()
        for value in CORE_FIT_VALUES:
            self.assertIn(value, mapping, f"SKILL.md omits Core Fit value {value!r}")
            self.assertIn(value, spec, f"spec omits Core Fit value {value!r}")

    def test_core_fit_is_distinguished_from_the_removed_status_column(self):
        # The Status column was deliberately removed; Core Fit is a different
        # axis. Without this note the two get conflated and Core Fit gets
        # stripped as a duplicate.
        artifacts = _read_spec_text()
        self.assertIn("no Status/change-tracking column", artifacts)
        self.assertIn("not** that column returning", artifacts)

    def test_core_fit_excludes_missing_as_a_value(self):
        artifacts = _read_spec_text()
        self.assertIn("`Missing` is **not** valid here", artifacts)

    def test_skill_forbids_reintroducing_row_height_calculation(self):
        artifacts = _read_spec_text()
        self.assertIn("Excel", artifacts)
        self.assertIn("autofit", artifacts)
        self.assertIn("Do not add height calculation back", artifacts)

    def test_spec_file_exists(self):
        self.assertTrue(SPEC_PATH.exists(), f"missing {SPEC_PATH}")

    def test_skill_points_at_the_spec_file(self):
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        self.assertIn("data-dictionary-spec.md", artifacts)

    def test_spec_documents_the_as_submitted_invariant(self):
        # The defect this prevents: an as-submitted critique workbook carried
        # an ApplicationStatus row its own narrative doc classed Missing.
        spec = _read_spec_text()
        self.assertIn("as submitted", spec)
        self.assertIn("must not have a row", spec)

    def test_spec_documents_blank_core_fit_is_invalid_in_critique_mode(self):
        spec = _read_spec_text()
        self.assertIn("blank", spec)
        self.assertIn("critique", spec)
        self.assertIn("[Verify]", spec)

    def test_spec_documents_the_mode_key_in_the_input_json(self):
        spec = _read_spec_text()
        self.assertIn('"mode"', spec)
        self.assertIn('"entities"', spec)

    def test_spec_modes_match_the_script(self):
        import sys

        sys.path.insert(0, str(SKILL_PATH.parent / "scripts"))
        from generate_data_dictionary import MODES

        spec = _read_spec_text()
        for mode in MODES:
            self.assertIn(mode, spec, f"spec omits mode {mode!r}")

    def test_spec_states_row_height_exemptions_accurately(self):
        # The script sets explicit heights on rows 1-4, and rows 3 (spacer)
        # and 4 (header) are not merged. An earlier revision said "Rows 1-2
        # ... because they are merged", which is the wrong reason for half of
        # them -- in the one paragraph meant to stop someone reintroducing
        # height calculation.
        spec = _read_spec_text()
        self.assertNotIn("Rows 1–2 keep explicit heights", spec)
        self.assertIn("Rows 1–4", spec)
        self.assertIn("spacer", spec)

    def test_spec_documents_the_merged_documentation_row_floor(self):
        spec = _read_spec_text()
        self.assertIn("30.0", spec)
        self.assertIn("merged", spec)

    def test_paths_section_defines_every_machine_specific_token(self):
        text = _read_skill_text()
        paths = text.split("## Paths")[1].split("## Modes")[0]
        for token in (
            "<MODEL_DESIGNS_OUTPUT_DIR>",
            "<EDFI_MODEL_PACKAGE_DIR>",
            "<METAED_IDE_EXTENSIONS_DIR>",
            "<DATA_DICTIONARY_SCRIPT>",
            "<NEEDS_DOCS_DIR>",
            "<GITHUB_ISSUE_DRAFTS_DIR>",
        ):
            self.assertIn(token, paths, f"Paths section omits {token}")

    def test_paths_section_names_the_environment_variables(self):
        # Workspace locations differ per person, so they come from the
        # environment, never from a value written into the skill.
        paths = _read_skill_text().split("## Paths")[1].split("## Modes")[0]
        for var in (
            "EDFI_MODEL_PACKAGE_PATH",
            "EDFI_MODEL_DESIGNS_OUTPUT_DIR",
            "EDFI_DS_NEEDS_DOCS_DIR",
            "EDFI_GITHUB_ISSUE_DRAFTS_DIR",
        ):
            self.assertIn(var, paths, f"Paths section omits {var}")

    def test_paths_section_says_what_to_do_when_a_location_is_unresolved(self):
        paths = _read_skill_text().split("## Paths")[1].split("## Modes")[0]
        self.assertIn("ask the user once", paths)
        self.assertIn("UNVERIFIED", paths)

    def test_no_machine_specific_paths_anywhere_in_the_skill(self):
        # The skill is shared, so no file in it may carry one person's machine
        # or workspace layout; every location resolves at runtime (## Paths).
        # This file is skipped only because it names the strings it forbids.
        skill_root = Path(__file__).resolve().parent.parent
        leaks = (
            "steven.arnold",
            "OneDrive",
            "Michael & Susan Dell",
            "Claude Working Folder",
            "TEA Needs to Issues",
            "TEA Model Designs",
        )
        scanned = 0
        for path in sorted(skill_root.rglob("*")):
            if path.suffix not in (".md", ".py") or "__pycache__" in path.parts:
                continue
            if path.resolve() == Path(__file__).resolve():
                continue
            scanned += 1
            text = path.read_text(encoding="utf-8")
            for leak in leaks:
                self.assertNotIn(leak, text, f"{leak!r} in {path.relative_to(skill_root)}")
        # Guard against a vacuous pass from a wrong root or an empty walk.
        self.assertGreaterEqual(scanned, 12, f"only {scanned} files scanned")

    def test_output_artifacts_uses_the_script_token(self):
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        self.assertIn("<DATA_DICTIONARY_SCRIPT>", artifacts)

    def test_modes_section_names_extension_fit_mapping_for_critique(self):
        # Modes said critique "Runs Steps 2-4 and Step 6", but Extension Fit
        # Mapping is unnumbered and also runs -- two descriptions of the same
        # thing that disagreed.
        text = _read_skill_text()
        modes = text.split("## Modes")[1].split("## Step Flow")[0]
        self.assertIn("Extension Fit Mapping", modes)

    def test_spec_documents_the_excel_file_lock_failure(self):
        spec = _read_spec_text()
        self.assertIn("PermissionError", spec)
        self.assertIn("open in Excel", spec)

    def test_output_dir_token_points_at_the_topic_folder_root(self):
        paths = _read_skill_text().split("## Paths")[1].split("## Modes")[0]
        self.assertIn("EDFI_MODEL_DESIGNS_OUTPUT_DIR", paths)
        self.assertNotIn(
            r"TEA Needs to Issues\Model Designs", paths,
            "output dir still points at the retired flat folder",
        )

    def test_output_artifacts_documents_the_per_topic_subfolder(self):
        artifacts = _read_skill_text().split("## Output Artifacts")[1].split(
            "## Reference Materials")[0]
        self.assertIn("<MODEL_DESIGNS_OUTPUT_DIR>\[topic]\\", artifacts)
        self.assertIn("one subfolder per design topic", artifacts)

    def test_output_artifacts_keeps_source_input_with_the_artifacts(self):
        # The point of the per-topic folder: the extension export, the docs and
        # the workbooks are one unit. Splitting them is what made the source
        # file hard to find from the design that was built on it.
        artifacts = _read_skill_text().split("## Output Artifacts")[1].split(
            "## Reference Materials")[0]
        self.assertIn("source input", artifacts)

    def test_output_artifacts_requires_confirming_the_topic_folder_name(self):
        artifacts = _read_skill_text().split("## Output Artifacts")[1].split(
            "## Reference Materials")[0]
        self.assertIn("Confirm the folder name", artifacts)

    def test_step6_marker_present_in_step_flow(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("### Step 6", step_flow)

    def test_mermaid_reference_file_exists_and_has_worked_example(self):
        ref_path = SKILL_PATH.parent / "references" / "mermaid-er-example.md"
        self.assertTrue(ref_path.exists(), f"missing {ref_path}")
        text = ref_path.read_text(encoding="utf-8")
        self.assertIn("erDiagram", text)
        self.assertIn("NEW", text)

    def test_step1_checks_for_existing_state_extension(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("### Step 1", step_flow)
        self.assertIn("ask whether they have the actual extension source", step_flow)
        self.assertIn("a data-dictionary spreadsheet", step_flow)

    def test_extension_fit_mapping_covers_three_input_fidelities(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("### Extension Fit Mapping", step_flow)
        self.assertIn("the real `.metaed` source", step_flow)
        self.assertIn("a spreadsheet", step_flow)
        self.assertIn("prose description", step_flow)
        self.assertIn("New to core", step_flow)
        self.assertIn("Established core concept, new placement", step_flow)

    def test_critique_mode_accepts_extensions_as_input(self):
        text = _read_skill_text()
        modes = text.split("## Modes")[1].split("## Step Flow")[0]
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("or an existing state extension", modes)
        self.assertIn("or an existing state extension", step_flow)

    def test_output_artifacts_has_extension_fit_table(self):
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        self.assertIn("### Extension Fit", artifacts)
        self.assertIn("Maps to Core", artifacts)
        self.assertIn("Recommended Adjustment", artifacts)

    def test_step3_searches_by_field_name_not_just_domain_or_entity(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("not just the domain or entity name", step_flow)
        self.assertIn("GenerationCodeSuffix", step_flow)

    def test_step4_notes_open_tickets_even_on_reject(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("open, unresolved ticket", step_flow)
        self.assertIn("closed door", step_flow)

    def test_step3_searches_github_product_backlog(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("Ed-Fi-Alliance-OSS/Ed-Fi-Technology-Roadmap", step_flow)
        self.assertIn("gh search issues", step_flow)

    def test_step4_citation_includes_github_issue(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("a GitHub product-backlog issue", step_flow)

    def test_data_dictionary_generated_only_on_request(self):
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        by_default, on_request = artifacts.split("only on explicit request", 1)
        self.assertNotIn(".xlsx", by_default)
        self.assertIn(".xlsx", on_request)
        self.assertIn("both stay on-request-only", artifacts)

    def test_step3_requires_logging_every_search_including_nulls(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertIn("searches that found nothing relevant", step_flow)
        self.assertIn("Sources Consulted section", step_flow)

    def test_output_artifacts_has_sources_consulted_section(self):
        text = _read_skill_text()
        artifacts = text.split("## Output Artifacts")[1].split("## Reference Materials")[0]
        self.assertIn("### Sources Consulted", artifacts)
        self.assertIn("Query / Search Run", artifacts)
        self.assertIn("is exactly as important as a row citing a ticket", artifacts)

    def test_step6_reflects_xlsx_on_request_only(self):
        text = _read_skill_text()
        step_flow = text.split("## Step Flow (Design Mode)")[1].split("## Output Artifacts")[0]
        self.assertNotIn("and data dictionary by default", step_flow)
        self.assertIn("generate the design doc by default", step_flow)

    def test_red_flags_covers_the_three_discipline_rules(self):
        # Scope is deliberate: only rules where the agent knows better and
        # skips anyway under pressure. Shaping rules (Documentation column,
        # Other column) are recipes elsewhere and must NOT be restated here --
        # prohibition form measurably backfires on those.
        flags = _read_skill_text().split("## Red Flags")[1]
        self.assertIn("closest analog", flags)
        self.assertIn("New to core", flags)
        self.assertIn("VARCHAR", flags)

    def test_red_flags_guards_completeness_pressure_explicitly(self):
        flags = _read_skill_text().split("## Red Flags")[1]
        self.assertIn("completeness", flags.lower())
        self.assertIn("[Verify]", flags)
        self.assertIn("blank", flags)

    def test_red_flags_are_first_person_symptoms_not_restated_rules(self):
        # These fire when the agent is mid-rationalisation, so they have to be
        # recognisable as its own thoughts, not as policy it is scanning past.
        flags = _read_skill_text().split("## Red Flags")[1]
        self.assertGreaterEqual(
            flags.count('- "'), 6, "red flags should be quoted self-talk"
        )

    def test_red_flags_rationalisations_cite_real_incidents(self):
        flags = _read_skill_text().split("## Red Flags")[1]
        for incident in ("SchoolYear", "SchoolChoice"):
            self.assertIn(incident, flags, f"no real incident behind {incident}")

    def test_red_flags_section_stays_narrow(self):
        # It is a self-check, not a summary of the skill. A summary would be a
        # second copy of rules whose first copy is prose fifty lines away, and
        # this skill has already been bitten by exactly that drift.
        flags = _read_skill_text().split("## Red Flags")[1]
        self.assertLess(
            len(flags.strip().splitlines()), 50,
            "Red Flags is growing into a summary of the whole skill",
        )

    def test_red_flags_does_not_restate_shaping_rules(self):
        flags = _read_skill_text().split("## Red Flags")[1]
        for shaping in ("Core Source:", "Structure: see Commons tab"):
            self.assertNotIn(shaping, flags)

    def test_final_sections_present(self):
        text = _read_skill_text()
        self.assertIn("Never fabricate", text.split("## Behavior Rules")[1])
        ref_materials = text.split("## Reference Materials")[1].split("## Explicitly Out of Scope")[0]
        self.assertIn("domain-dossier", ref_materials)
        scope = text.split("## Explicitly Out of Scope")[1].split("## Behavior Rules")[0]
        self.assertIn("not a PR", scope)


if __name__ == "__main__":
    unittest.main()
