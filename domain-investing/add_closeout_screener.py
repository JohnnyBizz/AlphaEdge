"""Add the Closeout Screener tab.

Buying an expired name is buying an asset with a history, not just a string, so this tab
scores two things and blends them: name quality (the criteria that carry over from the main
rubric) and asset quality (age, backlinks, prior use, traffic). It also handles the closeout
Dutch auction - $11 on day 1 falling $1/day to $5 - by turning the combined score into a
bid-timing instruction, because strong names never survive to the floor.
"""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"

FONT = "Arial"
BLUE, BLACK, GREEN = "0000FF", "000000", "008000"
HDR_FILL = PatternFill("solid", fgColor="1F3864")
SUB_FILL = PatternFill("solid", fgColor="D9E2F3")
EX_FILL = PatternFill("solid", fgColor="FFF2CC")
YEL_FILL = PatternFill("solid", fgColor="FFFF00")
MONEY = '$#,##0;($#,##0);-'
MONEY2 = '$#,##0.00;($#,##0.00);-'
PCT = '0.0%;(0.0%);-'
NUM2 = '0.00'
thin = Side(style="thin", color="AAAAAA")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)

wb = load_workbook(WB)

# ---- locate the shared lookups rather than hardcoding row numbers -------------------
rb = wb["Rubric"]
ext_rows = [r for r in range(1, rb.max_row + 1)
            if str(rb.cell(r, 1).value).strip().lower() in
            ("com", "ai", "io", "co", "net", "org", "app", "dev", "xyz", "other")]
EXT_START, EXT_END = min(ext_rows), max(ext_rows)
assert EXT_END - EXT_START == 9, f"extension table looks wrong: {EXT_START}-{EXT_END}"
EXT_KEYS = f"Rubric!$A${EXT_START}:$A${EXT_END}"
EXT_SCORES = f"Rubric!$B${EXT_START}:$B${EXT_END}"
EXT_RENEW = f"Rubric!$C${EXT_START}:$C${EXT_END}"

asm = wb["Assumptions"]
def find_assumption(fragment):
    for r in range(1, asm.max_row + 1):
        if fragment.lower() in str(asm.cell(r, 1).value).lower():
            return f"Assumptions!$B${r}"
    raise AssertionError(f"assumption not found: {fragment}")

COMM = find_assumption("Commission rate on sale")
MINCOMM = find_assumption("Minimum commission per sale")
PROB = find_assumption("Probability a listed name sells")
HORIZON = find_assumption("Holding horizon")

if "Closeout Screener" in wb.sheetnames:
    del wb["Closeout Screener"]
ws = wb.create_sheet("Closeout Screener", wb.sheetnames.index("Candidates") + 1)


def body(cell, fmt=None, color=BLACK, bold=False, wrap=False, size=10, center=True):
    cell.font = Font(name=FONT, size=size, bold=bold, color=color)
    if fmt:
        cell.number_format = fmt
    cell.alignment = Alignment(horizontal="center" if center else "left",
                               vertical="center" if center else "top", wrap_text=wrap)
    cell.border = BOX
    return cell


def section(row, text, span):
    c = ws.cell(row=row, column=1, value=text)
    c.font = Font(name=FONT, size=11, bold=True, color="FFFFFF")
    for i in range(1, span + 1):
        ws.cell(row=row, column=i).fill = HDR_FILL
    return row + 1


ws["A1"] = "Closeout Screener — expired names at $5-$11"
ws["A1"].font = Font(name=FONT, size=14, bold=True, color="FFFFFF")
ws["A1"].fill = HDR_FILL
ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=10)
ws.row_dimensions[1].height = 24

ws["A2"] = ("A closeout runs 5 days as a reverse auction: $11 on day 1, falling $1/day to $5, plus the "
            "renewal. Strong names get taken on day 1 — the Bid Guidance column tells you whether to "
            "grab it now or wait for the floor. Blue cells are yours; everything else is a formula.")
ws["A2"].font = Font(name=FONT, size=10, italic=True)
ws["A2"].alignment = Alignment(wrap_text=True, vertical="top")
ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=10)
ws.row_dimensions[2].height = 28

for col, w in {"A": 30, "B": 7, "C": 8, "D": 11, "E": 10, "F": 10, "G": 11, "H": 11, "I": 9,
               "J": 8, "K": 8, "L": 11, "M": 10, "N": 9, "O": 10, "P": 9, "Q": 10, "R": 11,
               "S": 10, "T": 10, "U": 10, "V": 11, "W": 12, "X": 12, "Y": 10, "Z": 12,
               "AA": 12, "AB": 15, "AC": 30, "AD": 40}.items():
    ws.column_dimensions[col].width = w

r = 4
r = section(r, "SCORING WEIGHTS — edit the blue cells; each block must total 100%", 6)

name_w = [("Extension", 0.25), ("Commercial intent", 0.40), ("Length & memorability", 0.20),
          ("Radio test", 0.15)]
ws.cell(row=r, column=1, value="NAME QUALITY").font = Font(name=FONT, size=10, bold=True)
r += 1
NAME_W_START = r
for label, wt in name_w:
    body(ws.cell(row=r, column=1, value=label), center=False)
    c = body(ws.cell(row=r, column=2, value=wt), fmt=PCT, color=BLUE, bold=True)
    c.fill = YEL_FILL
    r += 1
body(ws.cell(row=r, column=1, value="Total"), bold=True, center=False)
body(ws.cell(row=r, column=2, value=f"=SUM(B{NAME_W_START}:B{r-1})"), fmt=PCT, bold=True)
body(ws.cell(row=r, column=3, value=f'=IF(ABS(B{r}-1)<0.0001,"OK","ERROR - must total 100%")'),
     bold=True, center=False)
W_EXT, W_CI, W_LEN, W_RADIO = [f"$B${NAME_W_START+i}" for i in range(4)]
r += 2

asset_w = [("Domain age", 0.25), ("Backlink quality", 0.35), ("Prior use", 0.25), ("Traffic", 0.15)]
ws.cell(row=r, column=1, value="ASSET QUALITY").font = Font(name=FONT, size=10, bold=True)
r += 1
ASSET_W_START = r
for label, wt in asset_w:
    body(ws.cell(row=r, column=1, value=label), center=False)
    c = body(ws.cell(row=r, column=2, value=wt), fmt=PCT, color=BLUE, bold=True)
    c.fill = YEL_FILL
    r += 1
body(ws.cell(row=r, column=1, value="Total"), bold=True, center=False)
body(ws.cell(row=r, column=2, value=f"=SUM(B{ASSET_W_START}:B{r-1})"), fmt=PCT, bold=True)
body(ws.cell(row=r, column=3, value=f'=IF(ABS(B{r}-1)<0.0001,"OK","ERROR - must total 100%")'),
     bold=True, center=False)
W_AGE, W_BL, W_USE, W_TRAF = [f"$B${ASSET_W_START+i}" for i in range(4)]
r += 2

body(ws.cell(row=r, column=1, value="Blend: weight on NAME quality"), center=False)
c = body(ws.cell(row=r, column=2, value=0.60), fmt=PCT, color=BLUE, bold=True)
c.fill = YEL_FILL
body(ws.cell(row=r, column=3, value="Asset quality takes the remainder. Raise this if you are "
                                    "reselling on the name alone; lower it if you are buying for "
                                    "SEO value."), wrap=True, center=False, size=9)
ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
BLEND = f"$B${r}"
r += 2

r = section(r, "ASSET CRITERIA — what the scores mean", 6)
defs = [
    ("Domain age", "Scored automatically from the Age (yrs) column: under 2 = 1, 2-4 = 2, 5-9 = 3, "
                   "10-14 = 4, 15+ = 5. Age is the single hardest thing to fake."),
    ("Backlink quality", "1 = none, or obvious spam/PBN links. 3 = a handful of ordinary links. "
                         "5 = genuine editorial links from real sites. Check in any backlink tool "
                         "before bidding — this is where the resale value hides."),
    ("Prior use", "1 = parked, spam, or a link farm. 3 = a thin or abandoned site. 5 = a real "
                  "business with a clean archive. Check the Wayback Machine."),
    ("Traffic", "1 = none measurable. 3 = modest residual type-in traffic. 5 = meaningful ongoing "
                "traffic. Leave at 1 if you cannot measure it — do not guess upward."),
]
for label, text in defs:
    body(ws.cell(row=r, column=1, value=label), bold=True, center=False)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=10)
    body(ws.cell(row=r, column=2, value=text), wrap=True, center=False, size=9)
    ws.row_dimensions[r].height = 28
    r += 1
r += 1

r = section(r, "HARD FILTERS — any one rejects the name at any price", 6)
for f in [
    "Spam or penalty history — the domain was used for spam, or shows signs of a manual penalty. "
    "You inherit the reputation along with the name.",
    "Adult or gambling history — poisons the buyer pool for a commercial resale even when the name "
    "itself is clean.",
    "Trademark risk — contains or mimics an existing brand.",
    "Contains a hyphen or a digit.",
]:
    body(ws.cell(row=r, column=1, value="REJECT if:"), bold=True, center=False)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=10)
    body(ws.cell(row=r, column=2, value=f), wrap=True, center=False, size=9)
    ws.row_dimensions[r].height = 26
    r += 1
r += 2

# ---- summary block -------------------------------------------------------------------
SUMMARY_ROW = r
r = section(r, "PIPELINE SUMMARY", 6)
SUM_FIRST = r
r += 6  # filled in after the table rows are known
r += 1

# ---- the table -----------------------------------------------------------------------
HDR = r
headers = [
    "Domain (full, e.g. name.com)", "Ext", "Ext Score", "Closeout Price", "Renewal", "All-in Cost",
    "Commercial Intent (1-5)", "Length & Memorability (1-5)", "Radio Test (1-5)",
    "Age (yrs)", "Age Score", "Backlink Quality (1-5)", "Prior Use (1-5)", "Traffic (1-5)",
    "Spam/Penalty? (Y/N)", "Adult/Gambling? (Y/N)", "TM Risk? (Y/N)", "Hyphen/Digit? (Y/N)",
    "Hard Filter", "Name Score", "Asset Score", "Combined Score", "Est. Resale Value",
    "Net After Commission", "P(sale)", "Max Rational Bid", "Margin vs Cost", "Verdict",
    "Bid Guidance", "Notes",
]
for i, h in enumerate(headers, start=1):
    c = ws.cell(row=HDR, column=i, value=h)
    c.font = Font(name=FONT, size=9, bold=True, color="FFFFFF")
    c.fill = HDR_FILL
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BOX
ws.row_dimensions[HDR].height = 52

FIRST = HDR + 1
LAST = FIRST + 119

example = ["fleetlogistics.com", None, None, 11, None, None, 4, 4, 5, 12, None, 4, 4, 2,
           "N", "N", "N", "N", None, None, None, None, 3500, None, None, None, None, None, None,
           "EXAMPLE ROW — delete. Aged logistics site, real editorial links, clean archive."]

for row in range(FIRST, LAST + 1):
    is_ex = row == FIRST
    v = example if is_ex else [None] * len(headers)
    A = f"$A{row}"

    def put(col, val, fmt=None, color=BLACK, left=False):
        c = ws[f"{col}{row}"]
        c.value = val
        body(c, fmt=fmt, color=color, center=not left)
        if is_ex:
            c.fill = EX_FILL
        return c

    n_dots = f'LEN({A})-LEN(SUBSTITUTE({A},".",""))'
    last_dot = f'FIND(CHAR(1),SUBSTITUTE({A},".",CHAR(1),{n_dots}))'
    put("A", v[0], color=BLUE, left=True)
    put("B", f'=IF({A}="","",IF(ISERROR(FIND(".",{A})),"",LOWER(MID({A},{last_dot}+1,LEN({A})))))',
        color=GREEN)
    put("C", f'=IF($B{row}="","",IFERROR(INDEX({EXT_SCORES},MATCH($B{row},{EXT_KEYS},0)),'
             f'INDEX({EXT_SCORES},MATCH("other",{EXT_KEYS},0))))', fmt=NUM2, color=GREEN)
    put("D", v[3], fmt=MONEY2, color=BLUE)
    put("E", f'=IF($B{row}="","",IFERROR(INDEX({EXT_RENEW},MATCH($B{row},{EXT_KEYS},0)),'
             f'INDEX({EXT_RENEW},MATCH("other",{EXT_KEYS},0))))', fmt=MONEY, color=GREEN)
    put("F", f'=IF(OR({A}="",$D{row}=""),"",$D{row}+$E{row})', fmt=MONEY2)
    for col, idx in (("G", 6), ("H", 7), ("I", 8), ("J", 9)):
        put(col, v[idx], color=BLUE)
    put("K", f'=IF($J{row}="","",IF($J{row}>=15,5,IF($J{row}>=10,4,IF($J{row}>=5,3,'
             f'IF($J{row}>=2,2,1)))))', fmt=NUM2)
    for col, idx in (("L", 11), ("M", 12), ("N", 13)):
        put(col, v[idx], color=BLUE)
    for col, idx in (("O", 14), ("P", 15), ("Q", 16), ("R", 17)):
        put(col, v[idx], color=BLUE)
    put("S", f'=IF({A}="","",IF(OR(UPPER($O{row})="Y",UPPER($P{row})="Y",UPPER($Q{row})="Y",'
             f'UPPER($R{row})="Y"),"FAIL","PASS"))')
    put("T", f'=IF(OR({A}="",$C{row}=""),"",$C{row}*{W_EXT}+$G{row}*{W_CI}+$H{row}*{W_LEN}'
             f'+$I{row}*{W_RADIO})', fmt=NUM2)
    put("U", f'=IF(OR({A}="",$K{row}=""),"",$K{row}*{W_AGE}+$L{row}*{W_BL}+$M{row}*{W_USE}'
             f'+$N{row}*{W_TRAF})', fmt=NUM2)
    put("V", f'=IF(OR($T{row}="",$U{row}=""),"",$T{row}*{BLEND}+$U{row}*(1-{BLEND}))', fmt=NUM2)
    put("W", v[22], fmt=MONEY, color=BLUE)
    put("X", f'=IF(OR({A}="",$W{row}=""),"",MAX(0,$W{row}-MAX($W{row}*{COMM},{MINCOMM})))', fmt=MONEY)
    put("Y", f'=IF({A}="","",{PROB})', fmt=PCT, color=GREEN)
    put("Z", f'=IF(OR($X{row}="",$E{row}=""),"",MAX(0,$X{row}*$Y{row}-$E{row}*{HORIZON}))', fmt=MONEY)
    put("AA", f'=IF(OR($Z{row}="",$F{row}=""),"",$Z{row}-$F{row})', fmt=MONEY)
    put("AB", f'=IF({A}="","",IF($S{row}="FAIL","REJECT",'
              f'IF($F{row}>$Z{row},"OVERPRICED",'
              f'IF($V{row}>=4,"BUY",IF($V{row}>=3.4,"BUY CHEAPER",'
              f'IF($V{row}>=2.8,"FLOOR ONLY","SKIP"))))))')
    put("AC", f'=IF($AB{row}="","",'
              f'IF($AB{row}="REJECT","Do not buy at any price",'
              f'IF($AB{row}="OVERPRICED","All-in cost exceeds max rational bid",'
              f'IF($AB{row}="BUY","Take it on day 1 at $11 - will not reach the floor",'
              f'IF($AB{row}="BUY CHEAPER","Wait to about $8 (day 3), walk if outbid",'
              f'IF($AB{row}="FLOOR ONLY","Only at the $5 floor",'
              f'"Skip"))))))', left=True)
    put("AD", v[29], color=BLUE, left=True).alignment = Alignment(horizontal="left", vertical="top",
                                                                 wrap_text=True)

ws[f"Z{HDR}"].comment = Comment(
    "Same formula as the Candidates tab: (net proceeds after commission x probability of selling "
    "within the horizon) minus renewal carry. At closeout prices this is usually comfortably above "
    "the all-in cost - that is the whole point of the channel.", "Rubric")
ws[f"J{HDR}"].comment = Comment(
    "Years since first registration, not since the last transfer. Check a WHOIS history tool.", "Rubric")
ws[f"AA{HDR}"].comment = Comment(
    "Max rational bid minus all-in cost. This is your expected-value headroom per name. Negative "
    "means walk away.", "Rubric")

ws.freeze_panes = f"B{FIRST}"
ws.auto_filter.ref = f"A{HDR}:AD{LAST}"

# ---- fill the summary now that the table range is known ------------------------------
AB_RANGE = f"$AB${FIRST}:$AB${LAST}"
AA_RANGE = f"$AA${FIRST}:$AA${LAST}"
F_RANGE = f"$F${FIRST}:$F${LAST}"
A_RANGE = f"$A${FIRST}:$A${LAST}"
summary = [
    ("Names screened", f'=COUNTIF({A_RANGE},"<>")', '0'),
    ("BUY — take on day 1", f'=COUNTIF({AB_RANGE},"BUY")', '0'),
    ("BUY CHEAPER / FLOOR ONLY",
     f'=COUNTIF({AB_RANGE},"BUY CHEAPER")+COUNTIF({AB_RANGE},"FLOOR ONLY")', '0'),
    ("REJECT / OVERPRICED / SKIP",
     f'=COUNTIF({AB_RANGE},"REJECT")+COUNTIF({AB_RANGE},"OVERPRICED")+COUNTIF({AB_RANGE},"SKIP")', '0'),
    ("Total all-in cost of BUY names",
     f'=SUMIF({AB_RANGE},"BUY",{F_RANGE})', MONEY2),
    ("Total EV headroom of BUY names",
     f'=SUMIF({AB_RANGE},"BUY",{AA_RANGE})', MONEY),
]
for i, (label, formula, fmt) in enumerate(summary):
    rr = SUM_FIRST + i
    body(ws.cell(row=rr, column=1, value=label), center=False)
    body(ws.cell(row=rr, column=2, value=formula), fmt=fmt, color=GREEN, bold=True)

ws.sheet_view.showGridLines = False
wb.save(WB)
print(f"Closeout Screener added: header row {HDR}, data rows {FIRST}-{LAST}")
