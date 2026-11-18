# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.
"""Well-formedness guard for the behavioural scenarios.

This file cannot assert that an agent passes a scenario -- that needs a
fresh-context agent per rep, which the Python suite cannot dispatch. It
asserts only that the scenarios exist and keep the structure that makes them
runnable. A green run here means "the scenarios are intact", never "the
scenarios pass".
"""

import unittest
from pathlib import Path

SCENARIO_DIR = Path(__file__).resolve().parent / "scenarios"

REQUIRED_HEADINGS = (
    "## Pressures applied",
    "## Task given to the agent",
    "## Control expectation",
    "## Pass criteria",
    "## Fail signals",
    "## Results log",
)


def _scenario_files():
    return sorted(p for p in SCENARIO_DIR.glob("*.md") if p.name != "README.md")


class TestScenarioSuite(unittest.TestCase):
    def test_scenario_directory_exists(self):
        self.assertTrue(SCENARIO_DIR.is_dir(), f"missing {SCENARIO_DIR}")

    def test_readme_exists(self):
        self.assertTrue((SCENARIO_DIR / "README.md").exists())

    def test_every_rule_that_has_actually_failed_has_a_scenario(self):
        names = {p.stem for p in _scenario_files()}
        for expected in (
            "whole-model-search-before-new-to-core",
            "no-guessing-a-core-fit-category",
            "critique-workbook-is-as-submitted",
            "no-default-values-at-design-time",
        ):
            self.assertIn(expected, names, f"no scenario for {expected}")

    def test_each_scenario_has_the_required_sections(self):
        for path in _scenario_files():
            text = path.read_text(encoding="utf-8")
            for heading in REQUIRED_HEADINGS:
                with self.subTest(scenario=path.name, heading=heading):
                    self.assertIn(heading, text)

    def test_each_scenario_states_the_rule_under_test(self):
        for path in _scenario_files():
            text = path.read_text(encoding="utf-8")
            with self.subTest(scenario=path.name):
                self.assertIn("**Rule under test:**", text)

    def test_each_scenario_descends_from_a_real_failure(self):
        # A scenario invented for a hypothetical failure tests nothing. Every
        # one of these has to name the incident it came from.
        for path in _scenario_files():
            text = path.read_text(encoding="utf-8")
            with self.subTest(scenario=path.name):
                self.assertIn("**Descends from:**", text)

    def test_each_scenario_has_checkable_pass_criteria(self):
        for path in _scenario_files():
            text = path.read_text(encoding="utf-8")
            criteria = text.split("## Pass criteria")[1].split("## Fail signals")[0]
            with self.subTest(scenario=path.name):
                self.assertGreaterEqual(
                    criteria.count("- [ ]"), 3,
                    "pass criteria should be an explicit checklist",
                )

    def test_readme_requires_a_control_arm(self):
        # A scenario whose no-skill control already passes reports success for
        # free. This is the single easiest way for the suite to go hollow.
        text = (SCENARIO_DIR / "README.md").read_text(encoding="utf-8")
        self.assertIn("Run the control first", text)
        self.assertIn("worse than no scenario", text)

    def test_readme_requires_multiple_reps_and_manual_reading(self):
        text = (SCENARIO_DIR / "README.md").read_text(encoding="utf-8")
        self.assertIn("5+ reps", text)
        self.assertIn("by hand", text)

    def test_readme_disclaims_what_the_python_suite_can_prove(self):
        text = (SCENARIO_DIR / "README.md").read_text(encoding="utf-8")
        self.assertIn("never as", text)


if __name__ == "__main__":
    unittest.main()
