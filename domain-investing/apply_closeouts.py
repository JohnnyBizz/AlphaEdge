"""Load a pasted closeout list into the Closeout Screener tab.

This session cannot reach expireddomains.net, auctions.godaddy.com or domcop.com — the network
policy rejects the CONNECT — so the list has to be pasted in. Save it as closeouts_today.txt
next to this script and run it.

Accepted per line, whitespace/tab/comma separated, extra columns ignored:

    domain                          -> price defaults to 11 (day 1)
    domain  price
    domain  price  age_years
    domain  price  age_years  backlink_score(1-5)

Blank lines and lines starting with # are skipped. A leading "www." is stripped, and anything
without a dot is rejected rather than silently written as a bad row.

Length & Memorability is auto-scored from character and word count as a starting point — override
it if you disagree. Commercial Intent, Radio Test, Prior Use and Traffic are left blank on
purpose: those are judgments, and the whole point of this model is that unsourced guesses do not
get to drive the output.
"""

import pathlib
import re
import sys
from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"
SRC = pathlib.Path(__file__).with_name("closeouts_today.txt")
FONT, BLUE = "Arial", "0000FF"
NO_FILL = PatternFill(fill_type=None)
HDR_ROW = 43          # set by add_closeout_screener.py
FIRST, LAST = 44, 163

WORDLIKE = re.compile(r"[a-z]+")


def length_score(domain: str) -> int:
    """Rough Length & Memorability from the label, before the dot. Starting point, not gospel."""
    label = domain.rsplit(".", 1)[0]
    n = len(label)
    if n <= 6:
        return 5
    if n <= 10:
        return 4
    if n <= 14:
        return 3
    if n <= 20:
        return 2
    return 1


def parse(text: str):
    rows, bad = [], []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p for p in re.split(r"[\s,\t]+", line) if p]
        dom = parts[0].lower().lstrip("=").removeprefix("www.")
        if "." not in dom or " " in dom:
            bad.append(raw)
            continue

        def num(i):
            try:
                return float(parts[i].lstrip("$").replace(",", ""))
            except (IndexError, ValueError):
                return None

        rows.append({"domain": dom, "price": num(1) if num(1) is not None else 11.0,
                     "age": num(2), "backlinks": num(3)})
    return rows, bad


def main():
    if not SRC.exists():
        sys.exit(f"No list found. Save the pasted closeouts to {SRC} and re-run.")
    rows, bad = parse(SRC.read_text())
    if bad:
        print(f"skipped {len(bad)} unparseable line(s): {bad[:5]}")
    if not rows:
        sys.exit("Nothing to load.")
    seen, deduped = set(), []
    for row in rows:
        if row["domain"] not in seen:
            seen.add(row["domain"])
            deduped.append(row)
    if len(deduped) != len(rows):
        print(f"dropped {len(rows) - len(deduped)} duplicate(s)")
    if len(deduped) > LAST - FIRST + 1:
        sys.exit(f"{len(deduped)} names exceeds the {LAST - FIRST + 1} formula rows available "
                 f"(rows {FIRST}-{LAST}). Trim the list or extend the sheet.")

    wb = load_workbook(WB)
    ws = wb["Closeout Screener"]
    assert ws.cell(HDR_ROW, 1).value and "Domain" in str(ws.cell(HDR_ROW, 1).value), \
        f"row {HDR_ROW} is not the Closeout Screener header — has the sheet layout changed?"

    for i, row in enumerate(deduped):
        r = FIRST + i
        writes = {"A": row["domain"], "D": row["price"], "H": length_score(row["domain"]),
                  "J": row["age"], "L": row["backlinks"]}
        # clear the judgment columns so a stale example row cannot leak into a new list
        for col in ("G", "I", "M", "N", "O", "P", "Q", "R", "W", "X", "AH"):
            writes.setdefault(col, None)
        for col, val in writes.items():
            c = ws[f"{col}{r}"]
            c.value = val
            c.font = Font(name=FONT, size=10, color=BLUE)
            c.fill = NO_FILL
            c.alignment = Alignment(horizontal="left" if col in ("A", "X", "AH") else "center",
                                    vertical="center")
        ws[f"D{r}"].number_format = '$#,##0.00;($#,##0.00);-'

    # blank any rows left over from a previous, longer list
    for r in range(FIRST + len(deduped), LAST + 1):
        for col in ("A", "D", "G", "H", "I", "J", "L", "M", "N",
                    "O", "P", "Q", "R", "W", "X", "AH"):
            ws[f"{col}{r}"].value = None
            ws[f"{col}{r}"].fill = NO_FILL

    wb.save(WB)
    print(f"loaded {len(deduped)} closeouts into rows {FIRST}-{FIRST + len(deduped) - 1}")
    print("still to fill per row: Commercial Intent (G), Radio Test (I), Prior Use (M), "
          "Traffic (N), the four Y/N filters (O-R), and Est. Resale Value + source (W, X)")


if __name__ == "__main__":
    main()
