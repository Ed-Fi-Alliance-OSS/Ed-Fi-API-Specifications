# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.
"""Builds a data-dictionary workbook: one sheet per entity/association.

Columns are the reference workbook's six (Property Name / UML Datatype /
Other / Documentation / Identity / Cardinality) plus one deliberate
addition, "Core Fit" -- no Status/change-tracking column; that reasoning
belongs in the paired narrative markdown doc, not this workbook.

"Core Fit" is the one intentional divergence from the reference workbook's
shape. It answers a question none of the other six columns can: does this
element already exist in the Ed-Fi core model, or is it net new and would
have to be created? Its permitted values are exactly the Extension Fit
Mapping categories defined in SKILL.md, so the workbook and the narrative
doc's fit table can never drift apart. It is NOT the old Status column
(New/Changed/Deprecated/Unchanged), which tracked change status of the
design across drafts and was removed as low-value -- a different axis.

A workbook is generated in one of two modes, declared in the input JSON.
A "design" workbook renders what is recommended; a "critique" workbook
renders a submitted design as submitted. In critique mode a blank Core Fit
is rejected: every submitted element is classifiable, so a blank almost
always means the element is not in the submission and the row should not be
there at all. That defect shipped once -- an as-submitted workbook carried an
ApplicationStatus row its own narrative doc classed Missing.

Layout/styling (fonts, fills, borders, column widths, freeze panes) mirrors
the Intervention domain's reference data-dictionary workbook: a dark-blue
title band, a lighter-blue bold header row, thin borders throughout, wrapped
text on the wide columns, and panes frozen just below the header.

Data-row heights are deliberately left UNSET so Excel autofits them. An
earlier revision estimated heights from a chars-per-width constant; measured
against all 83 data rows of the reference workbook, no constant reproduces
Excel's per-glyph font metrics -- every value either clipped text or
over-padded. Clipping was a real defect: a two-line "Other" cell carrying a
shared string plus its SQL Recommended DataType got 29.0pt where the
reference gives 43.5pt, hiding the SQL line. The merged documentation row
still needs an explicit height because Excel does not autofit merged cells;
it is floored at the reference workbook's flat 30.0pt so the same unreliable
estimator cannot under-pad it."""

import json
import math
import sys

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

HEADER = [
    "Property Name",
    "UML Datatype",
    "Other",
    "Documentation",
    "Identity",
    "Cardinality",
    "Core Fit",
]

COLUMN_WIDTHS = [25.0, 20.0, 35.0, 50.0, 15.0, 21.18, 30.0]
WRAP_COLUMNS = {3, 4, 7}  # 1-indexed: "Other", "Documentation", "Core Fit"

TITLE_FILL = "FF2F5496"
HEADER_FILL = "FF4472C4"
WHITE_FONT = "FFFFFFFF"

THIN_BORDER = Border(
    top=Side(style="thin"),
    bottom=Side(style="thin"),
    left=Side(style="thin"),
    right=Side(style="thin"),
)

LINE_HEIGHT = 14.5  # points per wrapped line, matches the reference workbook
MIN_ROW_HEIGHT = LINE_HEIGHT

# The merged documentation row is the one row Excel will not autofit, so it
# keeps an explicit height -- sized by the same chars-per-width estimator that
# was proven unable to reproduce Excel's metrics. Measured across the
# reference workbook, it uses a flat 30.0pt for every merged documentation
# row at text lengths from 73 to 337 characters, and the estimator
# under-predicted all eight (14.5 or 29.0). This is a floor, not a cap: the
# estimate still wins when it asks for more, because over-padding only adds
# whitespace while under-padding hides text.
REFERENCE_MERGED_DOC_HEIGHT = 30.0
# Only used for row 2 (merged, so Excel cannot autofit it). Set conservatively
# low: over-padding a merged row leaves whitespace, under-padding hides text.
CHARS_PER_WIDTH_UNIT = 1.0

ENTITY_KIND = "entity"
COMMON_KIND = "common"
ITEM_KINDS = (ENTITY_KIND, COMMON_KIND)

# Commons share one tab rather than getting a sheet each: a common's shape is
# reference material for the entity that uses it, and scattering eight of them
# across eight tabs buries it. Its fields belong in scannable rows here, not
# crammed into the Other column of the row that references it.
COMMONS_SHEET_TITLE = "Commons"

REQUIRED_ENTITY_KEYS = ("name", "documentation", "properties")
REQUIRED_PROPERTY_KEYS = (
    "name",
    "datatype",
    "other",
    "documentation",
    "identity",
    "cardinality",
    "core_fit",
)

# The Extension Fit Mapping categories from SKILL.md. "Missing" is deliberately
# absent: it describes an element the design omits, which by definition has no
# row in this workbook.
CORE_FIT_VALUES = (
    "Maps cleanly",
    "Partially maps",
    "Established core concept, new placement",
    "New to core",
)

# Blank for a row whose fit genuinely isn't determined yet; "[Verify]" for one
# actively flagged as unresolved per the skill's Behavior Rules.
CORE_FIT_PLACEHOLDERS = ("", "[Verify]")

# A workbook is either a design render (what we recommend) or a critique
# render (what was submitted). The mode lives in the input JSON rather than a
# CLI flag: the .xlsx is a render and the JSON is the source, so a later
# session regenerating from the JSON alone must get the same validation.
DESIGN_MODE = "design"
CRITIQUE_MODE = "critique"
MODES = (DESIGN_MODE, CRITIQUE_MODE)


def _lines_needed(text, column_width):
    """Wrapped line count, honouring explicit newlines.

    Each hard-wrapped segment wraps independently -- measuring the whole
    string as one run is what under-counted two-line "Other" cells.
    """
    if not text:
        return 1
    chars_per_line = max(1, round(column_width * CHARS_PER_WIDTH_UNIT))
    return sum(
        max(1, math.ceil(len(segment) / chars_per_line))
        for segment in str(text).split("\n")
    )


def _row_height_for_wrapped_row(values, widths, wrap_indexes):
    max_lines = 1
    for idx in wrap_indexes:
        if idx - 1 < len(values):
            max_lines = max(max_lines, _lines_needed(values[idx - 1], widths[idx - 1]))
    return max(MIN_ROW_HEIGHT, max_lines * LINE_HEIGHT)


def _write_block(ws, item, start_row):
    """Write one title/documentation/header/data block, return the next row.

    The same shape serves an entity on its own sheet and each common stacked
    on the shared Commons tab, so the two never drift apart visually.
    """
    num_columns = len(HEADER)
    last_col = chr(ord("A") + num_columns - 1)

    # Title band, merged across every column.
    row = start_row
    ws.cell(row=row, column=1, value=item["name"])
    ws.merge_cells(f"A{row}:{last_col}{row}")
    title_cell = ws.cell(row=row, column=1)
    title_cell.font = Font(name="Calibri", size=14, bold=True, color=WHITE_FONT)
    title_cell.fill = PatternFill(start_color=TITLE_FILL, end_color=TITLE_FILL, fill_type="solid")
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    for col in range(1, num_columns + 1):
        ws.cell(row=row, column=col).border = THIN_BORDER
    ws.row_dimensions[row].height = 18.5

    # Documentation, merged and wrapped. Merged cells are the one place Excel
    # will not autofit, so this row keeps an explicit estimated height.
    row += 1
    ws.cell(row=row, column=1, value=item["documentation"])
    ws.merge_cells(f"A{row}:{last_col}{row}")
    doc_cell = ws.cell(row=row, column=1)
    doc_cell.font = Font(name="Calibri", size=11)
    doc_cell.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    for col in range(1, num_columns + 1):
        ws.cell(row=row, column=col).border = THIN_BORDER
    ws.row_dimensions[row].height = max(
        REFERENCE_MERGED_DOC_HEIGHT,
        _row_height_for_wrapped_row([item["documentation"]], [sum(COLUMN_WIDTHS)], [1]),
    )

    # Blank spacer, unstyled -- matches the reference workbook.
    row += 1
    ws.row_dimensions[row].height = 10.0

    # Header row.
    row += 1
    header_row = row
    for col, label in enumerate(HEADER, start=1):
        cell = ws.cell(row=row, column=col, value=label)
        cell.font = Font(name="Calibri", size=11, bold=True, color=WHITE_FONT)
        cell.fill = PatternFill(start_color=HEADER_FILL, end_color=HEADER_FILL, fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = THIN_BORDER
    ws.row_dimensions[row].height = LINE_HEIGHT

    # Data rows. Heights deliberately unset -- see module docstring.
    for prop in item["properties"]:
        row += 1
        values = [
            prop["name"],
            prop["datatype"],
            prop["other"],
            prop["documentation"],
            prop["identity"],
            prop["cardinality"],
            prop["core_fit"],
        ]
        for col, value in enumerate(values, start=1):
            cell = ws.cell(row=row, column=col, value=value)
            cell.font = Font(name="Calibri", size=11)
            cell.border = THIN_BORDER
            if col in WRAP_COLUMNS:
                cell.alignment = Alignment(wrap_text=True, vertical="top")
            else:
                cell.alignment = Alignment(vertical="top")

    return row + 1, header_row


def build_workbook(entities, output_path, mode=DESIGN_MODE):
    if mode not in MODES:
        raise ValueError(
            f"mode '{mode}' is not a workbook mode. Use one of: "
            f"{', '.join(MODES)}."
        )
    if not entities:
        raise ValueError("entities must contain at least one entity")

    for entity in entities:
        kind = entity.get("kind", ENTITY_KIND)
        if kind not in ITEM_KINDS:
            raise ValueError(
                f"Item '{entity.get('name', '<unnamed>')}' has kind '{kind}'; "
                f"expected one of {', '.join(ITEM_KINDS)}."
            )
        for key in REQUIRED_ENTITY_KEYS:
            if key not in entity:
                raise ValueError(
                    f"Entity '{entity.get('name', '<unnamed>')}' is missing "
                    f"required key '{key}'."
                )
        for prop in entity["properties"]:
            for key in REQUIRED_PROPERTY_KEYS:
                if key not in prop:
                    raise ValueError(
                        f"Property '{prop.get('name', '<unnamed>')}' on "
                        f"entity '{entity['name']}' is missing required "
                        f"key '{key}'."
                    )
            core_fit = prop["core_fit"]
            if mode == CRITIQUE_MODE and core_fit == "":
                raise ValueError(
                    f"Property '{prop['name']}' on entity '{entity['name']}' "
                    f"has a blank core_fit in a critique workbook. A critique "
                    f"workbook renders the design as submitted, and every "
                    f"submitted element is classifiable -- so a blank almost "
                    f"always means this element is not in the submission and "
                    f"the row should not exist. Delete the row, or give it a "
                    f"real category. Use '[Verify]' only when the element IS "
                    f"submitted but its shape is unresolved."
                )
            if core_fit not in CORE_FIT_VALUES + CORE_FIT_PLACEHOLDERS:
                allowed = ", ".join(f"'{v}'" for v in CORE_FIT_VALUES)
                raise ValueError(
                    f"Property '{prop['name']}' on entity '{entity['name']}' "
                    f"has core_fit '{core_fit}', which is not an Extension Fit "
                    f"Mapping category. Use one of: {allowed} -- or '' / "
                    f"'[Verify]' if the fit is genuinely undetermined."
                )

    wb = Workbook()
    wb.remove(wb.active)

    def _prepare_sheet(title):
        ws = wb.create_sheet(title=title[:31])
        ws.sheet_view.zoomScale = 85
        for idx, width in enumerate(COLUMN_WIDTHS, start=1):
            ws.column_dimensions[chr(ord("A") + idx - 1)].width = width
        return ws

    for entity in entities:
        if entity.get("kind", ENTITY_KIND) == COMMON_KIND:
            continue
        ws = _prepare_sheet(entity["name"])
        _, header_row = _write_block(ws, entity, 1)
        ws.freeze_panes = f"A{header_row + 1}"

    commons = [e for e in entities if e.get("kind", ENTITY_KIND) == COMMON_KIND]
    if commons:
        ws = _prepare_sheet(COMMONS_SHEET_TITLE)
        row = 1
        for index, common in enumerate(commons):
            if index:
                row += 1  # blank separator between stacked blocks
            row, _ = _write_block(ws, common, row)

    wb.save(output_path)


def load_input(data):
    """Unpack the persisted input JSON into (mode, entities).

    The top level is an object carrying both, not a bare entity list -- the
    mode has to travel with the source so regenerating from the JSON cannot
    silently skip the critique-mode check.
    """
    if not isinstance(data, dict):
        raise ValueError(
            "Input JSON must be an object with 'mode' and 'entities' keys, "
            f"not a bare {type(data).__name__}. Wrap the existing list: "
            '{"mode": "design"|"critique", "entities": [ ... ]}.'
        )
    if "mode" not in data:
        raise ValueError(
            "Input JSON is missing the required 'mode' key. Use "
            f"{' or '.join(repr(m) for m in MODES)} -- 'critique' renders a "
            "design as submitted, 'design' renders what is recommended."
        )
    mode = data["mode"]
    if mode not in MODES:
        raise ValueError(
            f"Input JSON has mode '{mode}', which is not a workbook mode. "
            f"Use one of: {', '.join(MODES)}."
        )
    if "entities" not in data:
        raise ValueError("Input JSON is missing the required 'entities' key.")
    return mode, data["entities"]


def _main():
    if len(sys.argv) != 3:
        print("usage: generate_data_dictionary.py <input.json> <output.xlsx>", file=sys.stderr)
        raise SystemExit(2)
    input_path, output_path = sys.argv[1], sys.argv[2]
    with open(input_path, "r", encoding="utf-8") as f:
        mode, entities = load_input(json.load(f))
    build_workbook(entities, output_path, mode=mode)
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    _main()
