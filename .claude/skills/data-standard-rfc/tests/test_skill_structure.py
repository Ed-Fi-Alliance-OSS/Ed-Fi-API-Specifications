# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

"""Structural checks on the skill itself.

These are cheap guards against the ways a skill silently rots: frontmatter
that stops parsing, a description that drifts into summarizing the workflow
(which makes agents follow the description instead of reading the skill), a
reference file that gets renamed without updating SKILL.md, or a
rationalization table that loses the entries the baseline testing earned.
"""

import re
import unittest
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
SKILL_MD = SKILL_ROOT / "SKILL.md"

EXPECTED_REFERENCES = (
    "rfc-anatomy.md",
    "header-and-numbering.md",
    "reduction-rules.md",
    "process-context.md",
)

EXPECTED_SCRIPTS = (
    "resolve_model_package.py",
    "verify_baseline_claims.py",
)


def read_skill():
    return SKILL_MD.read_text(encoding="utf-8")


def frontmatter(text):
    match = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not match:
        return None
    block = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, _, value = line.partition(":")
            block[key.strip()] = value.strip()
    return block


class TestFrontmatter(unittest.TestCase):
    def test_skill_md_exists(self):
        self.assertTrue(SKILL_MD.is_file())

    def test_frontmatter_parses(self):
        self.assertIsNotNone(frontmatter(read_skill()))

    def test_has_name_and_description(self):
        block = frontmatter(read_skill())
        self.assertIn("name", block)
        self.assertIn("description", block)

    def test_name_is_hyphenated_lowercase(self):
        name = frontmatter(read_skill())["name"]
        self.assertRegex(name, r"^[a-z0-9-]+$")

    def test_name_matches_directory(self):
        self.assertEqual(frontmatter(read_skill())["name"], SKILL_ROOT.name)

    def test_frontmatter_under_1024_chars(self):
        match = re.match(r"^---\n(.*?)\n---\n", read_skill(), re.DOTALL)
        self.assertLess(len(match.group(1)), 1024)

    def test_description_starts_with_use_when(self):
        description = frontmatter(read_skill())["description"]
        self.assertTrue(
            description.startswith("Use when"),
            "description must start with 'Use when' -- got: " + description[:40],
        )

    def test_description_is_third_person(self):
        description = frontmatter(read_skill())["description"].lower()
        for banned in (" i ", "i can", "i will", "we will", "you should"):
            self.assertNotIn(banned, description)

    def test_description_does_not_summarize_the_workflow(self):
        """A description that summarizes the process becomes a shortcut agents
        take instead of reading the skill body."""
        description = frontmatter(read_skill())["description"].lower()
        for leak in ("then ", "first ", "step ", "-> ", "resolve the blocking"):
            self.assertNotIn(
                leak,
                description,
                "description should state triggers only, not workflow",
            )


class TestReferencedFilesExist(unittest.TestCase):
    """A reference SKILL.md names but does not ship is a dead end mid-task."""

    def test_reference_files_exist(self):
        for name in EXPECTED_REFERENCES:
            with self.subTest(reference=name):
                self.assertTrue((SKILL_ROOT / "references" / name).is_file())

    def test_scripts_exist(self):
        for name in EXPECTED_SCRIPTS:
            with self.subTest(script=name):
                self.assertTrue((SKILL_ROOT / "scripts" / name).is_file())

    def test_every_referenced_path_in_skill_md_resolves(self):
        text = read_skill()
        for match in re.finditer(r"`((?:references|scripts)/[\w./-]+)`", text):
            rel = match.group(1)
            with self.subTest(path=rel):
                self.assertTrue(
                    (SKILL_ROOT / rel).is_file(), rel + " named in SKILL.md is missing"
                )

    def test_every_shipped_reference_is_named_in_skill_md(self):
        """An orphaned reference file will never be read."""
        text = read_skill()
        for path in (SKILL_ROOT / "references").glob("*.md"):
            with self.subTest(reference=path.name):
                self.assertIn(path.name, text)


class TestDisciplineContent(unittest.TestCase):
    """The rationalization table and red flags are what the baseline testing
    bought. Losing them silently would undo it."""

    def test_has_rationalization_table(self):
        self.assertIn("| Excuse | Reality |", read_skill())

    def test_rationalization_table_has_substance(self):
        text = read_skill()
        rows = [
            line
            for line in text.splitlines()
            if line.startswith("| \"") or line.startswith('| "')
        ]
        self.assertGreaterEqual(
            len(rows), 8, "expected the observed rationalizations, got " + str(len(rows))
        )

    def test_has_red_flags_section(self):
        self.assertRegex(read_skill(), r"#+ Red flags")

    def test_names_all_four_rules(self):
        text = read_skill()
        for rule in ("R1", "R2", "R3", "R4"):
            with self.subTest(rule=rule):
                self.assertIn(rule, text)

    def test_states_the_three_use_case_constraint(self):
        self.assertRegex(read_skill(), r"(?i)exactly three")

    def test_forbids_the_drift_sections(self):
        """These are the non-corpus sections that showed up under pressure."""
        text = read_skill()
        for section in ("Adoption Impact", "Community Benefits", "Risks & Tradeoffs"):
            with self.subTest(section=section):
                self.assertIn(section, text)

    def test_names_the_stop_list_non_empty_assertion(self):
        """A grep against an empty stop-list passes vacuously."""
        self.assertRegex(read_skill(), r"(?i)non-empty")

    def test_states_the_unverified_degradation_message(self):
        self.assertIn("model grounding UNVERIFIED", read_skill())

    def test_positions_itself_against_sibling_skills(self):
        text = read_skill()
        for sibling in ("model-designer", "DS Product Needs"):
            with self.subTest(sibling=sibling):
                self.assertIn(sibling, text)


class TestScenarioFiles(unittest.TestCase):
    def test_scenarios_exist(self):
        scenarios = list((SKILL_ROOT / "tests" / "scenarios").glob("*.md"))
        self.assertGreaterEqual(len(scenarios), 4)

    def test_each_scenario_records_a_baseline_and_an_expectation(self):
        for path in (SKILL_ROOT / "tests" / "scenarios").glob("*.md"):
            text = path.read_text(encoding="utf-8").lower()
            with self.subTest(scenario=path.name):
                self.assertIn("baseline", text)
                self.assertIn("expected with the skill", text)


if __name__ == "__main__":
    unittest.main()
