"""Build the domain investing rubric + portfolio tracker workbook."""

from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.comments import Comment

OUT = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"

FONT = "Arial"
BLUE = "0000FF"      # hardcoded inputs / scenario levers
BLACK = "000000"     # formulas
GREEN = "008000"     # links to another sheet
YELLOW = "FFFF00"    # key assumptions / fill-me-in cells
HDR_FILL = PatternFill("solid", fgColor="1F3864")
SUB_FILL = PatternFill("solid", fgColor="D9E2F3")
EX_FILL = PatternFill("solid", fgColor="FFF2CC")
YEL_FILL = PatternFill("solid", fgColor=YELLOW)

MONEY = '$#,##0;($#,##0);-'
MONEY2 = '$#,##0.00;($#,##0.00);-'
PCT = '0.0%;(0.0%);-'
NUM2 = '0.00'
DATE_FMT = 'yyyy-mm-dd'

thin = Side(style="thin", color="AAAAAA")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)


def tld_formula(row):
    """Final label of the full domain in column A, lowercased.

    SUBSTITUTE's instance argument swaps only the last '.' for a sentinel, so FIND locates
    it regardless of how many labels the name has. Note this returns the last label only:
    example.co.uk yields "uk", not "co.uk". Fine for the extension lookup, which keys on
    single-label TLDs and falls back to "other". Kept to pre-2007 functions so LibreOffice
    can evaluate it.
    """
    a = f"$A{row}"
    n_dots = f"LEN({a})-LEN(SUBSTITUTE({a},\".\",\"\"))"
    last_dot = f"FIND(CHAR(1),SUBSTITUTE({a},\".\",CHAR(1),{n_dots}))"
    return (f'=IF({a}="","",IF(ISERROR(FIND(".",{a})),"",'
            f'LOWER(MID({a},{last_dot}+1,LEN({a})))))')

wb = Workbook()


def title(ws, text, span=8):
    ws["A1"] = text
    ws["A1"].font = Font(name=FONT, size=14, bold=True, color="FFFFFF")
    ws["A1"].fill = HDR_FILL
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=span)
    ws.row_dimensions[1].height = 24


def header_row(ws, row, headers, start_col=1):
    for i, h in enumerate(headers):
        c = ws.cell(row=row, column=start_col + i, value=h)
        c.font = Font(name=FONT, size=10, bold=True, color="FFFFFF")
        c.fill = HDR_FILL
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = BOX
    ws.row_dimensions[row].height = 42


def widths(ws, spec):
    for col, w in spec.items():
        ws.column_dimensions[col].width = w


def body(cell, fmt=None, color=BLACK, bold=False, wrap=False, size=10):
    cell.font = Font(name=FONT, size=size, bold=bold, color=color)
    if fmt:
        cell.number_format = fmt
    cell.alignment = Alignment(vertical="top", wrap_text=wrap)
    cell.border = BOX
    return cell


# ---------------------------------------------------------------- Start Here
ws = wb.active
ws.title = "Start Here"
title(ws, "Domain Investing — Rubric & Portfolio Tracker", span=6)
widths(ws, {"A": 26, "B": 92})

rows = [
    ("", ""),
    ("HOW TO USE THIS FILE", ""),
    ("1. Assumptions", "Set your commission rate, sell-through rate and holding horizon FIRST. Every "
                       "max-bid and break-even number in the file is driven off this tab."),
    ("2. Rubric", "Read the scoring definitions. Adjust the six weights if you disagree — they must "
                  "sum to 100%. The Weight Check cell turns red if they don't."),
    ("3. Candidates", "One row per name you are considering. Score the five manual criteria 1-5, enter "
                      "your acquisition cost and honest resale estimate. The sheet returns a weighted "
                      "score, a max rational bid, and a verdict."),
    ("4. Portfolio", "One row per name you actually own. Tracks cumulative renewal carry and the list "
                     "price you need to break even after commission."),
    ("5. Sales Log", "One row per sale. Feeds realised P&L and your true sell-through rate."),
    ("6. Dashboard", "Read-only summary. The number to watch is Annual Renewal Burden vs. Realised Net Profit."),
    ("7. Comps", "Reference sales and market benchmarks with sources, for calibrating the Comp Support score."),
    ("8. Market Frequency", "How often domains actually sell and for how much, with the derivation behind "
                            "the sell-through rate and a calibrator that turns a break-even into a percentile."),
    ("9. Closeout Screener", "Expired names in GoDaddy's $11-to-$5 closeout window. Scores name quality and "
                             "asset quality separately, then gives bid timing."),
    ("", ""),
    ("COLOUR LEGEND", ""),
    ("Blue text", "You type here. These are inputs."),
    ("Yellow fill", "Key assumption — the numbers most worth arguing about."),
    ("Black text", "Formula. Do not overwrite."),
    ("Green text", "Formula that pulls from another sheet. Do not overwrite."),
    ("Orange row", "EXAMPLE ROW showing the expected format. Delete it before you start."),
    ("", ""),
    ("THE ONE THING TO REMEMBER", ""),
    ("Carry kills portfolios", "At a 1% sell-through rate you sell roughly one name per hundred per "
                               "year, while paying renewals on all hundred. A name is only worth owning if its "
                               "expected net proceeds beat its expected carry over your holding horizon. "
                               "That comparison is the Max Rational Bid column on the Candidates tab — "
                               "if your acquisition cost is above it, the name loses money on average "
                               "no matter how good it sounds."),
    ("Availability", "This file does not check whether a domain is registered. Column A holds the full "
                     "domain, so select it, copy, and paste straight into GoDaddy's bulk search (up to "
                     "500 at a time), then mark the result in the Availability column. The Ext column "
                     "derives itself from column A — do not type into it."),
    ("Appraisals", "GoDaddy's automated appraisal is not evidence. Use the Comp Support score instead — "
                   "it asks whether comparable names have actually sold, which is the only valuation "
                   "signal with a buyer behind it."),
]
r = 3
for label, text in rows:
    a = ws.cell(row=r, column=1, value=label)
    b = ws.cell(row=r, column=2, value=text)
    is_head = label in ("HOW TO USE THIS FILE", "COLOUR LEGEND", "THE ONE THING TO REMEMBER")
    a.font = Font(name=FONT, size=11 if is_head else 10, bold=True,
                  color="1F3864" if is_head else BLACK)
    b.font = Font(name=FONT, size=10)
    b.alignment = Alignment(wrap_text=True, vertical="top")
    if is_head:
        a.fill = SUB_FILL
        b.fill = SUB_FILL
    ws.row_dimensions[r].height = 30 if len(str(text)) > 95 else 15
    if len(str(text)) > 300:
        ws.row_dimensions[r].height = 78
    r += 1

ws.cell(row=r + 1, column=1, value="Built").font = Font(name=FONT, size=9, italic=True)
ws.cell(row=r + 1, column=2, value=f"{date.today().isoformat()}. Market benchmarks on the Comps tab "
                                   f"are as-published; re-check before relying on them.").font = \
    Font(name=FONT, size=9, italic=True)

# ---------------------------------------------------------------- Assumptions
ws = wb.create_sheet("Assumptions")
title(ws, "Assumptions — set these before anything else", span=5)
widths(ws, {"A": 40, "B": 16, "C": 12, "D": 74})

header_row(ws, 3, ["Assumption", "Value", "Unit", "Why it matters / source"])

assumptions = [
    ("Commission rate on sale", 0.20, PCT,
     "Afternic/GoDaddy: 30% on Boost, 25% Basic; drops to 20% (Boost) or 15% (Basic) if you point the "
     "domain at GoDaddy aftermarket nameservers. 20% assumes Boost + GD nameservers.", True),
    ("Minimum commission per sale", 15, MONEY,
     "GoDaddy applies a $15 floor. Only bites on sub-$100 sales.", True),
    ("Expected sell-through rate (per year)", 0.01, PCT,
     "DERIVED, see the Market Frequency tab. About 256,600 reported sales a year above $100 against "
     "20m+ listings on Afternic alone gives 1.28%; against 25-30m unique listings across venues it is "
     "0.86-1.03%. 1.00% is the middle of that. The commonly quoted 1.5-2% is measured on curated "
     "portfolios or is simply optimistic - assuming you beat the market before you have evidence is "
     "the same error as guessing a resale value. Raise it only when your own Sales Log earns it.", True),
    ("Holding horizon (years)", 5, NUM2,
     "Typical time-to-sale for ordinary inventory is 5-10 years. This is the window the max-bid maths "
     "assumes you are willing to fund renewals for.", True),
    ("Default annual renewal — .com", 11, MONEY, "Typical .com renewal. Override per name where different.", True),
    ("Default annual renewal — premium TLD", 35, MONEY,
     ".ai/.io renewals run far higher and are the main reason trendy-TLD portfolios lose money at low "
     "sell-through rates.", True),
    ("Required return multiple on cost", 10, '0.0"x"',
     "Minimum sale-price-to-acquisition-cost ratio you will accept, used to set target list prices. "
     "10x on a $12 hand-reg is a $120 name — set this high, most names never sell at all.", True),
    ("Quality pivot score (neutral)", 3.0, NUM2,
     "A name scoring exactly this gets the base sell-through rate above. Better names get a higher "
     "rate, worse names a lower one.", True),
    ("Quality sensitivity (0 = off)", 1.0, NUM2,
     "MODELLING ASSUMPTION, NOT MEASURED DATA. Effective rate = base rate x (score / pivot) ^ this. "
     "At 1.0 the relationship is linear: a 4.5 name is assumed to sell 1.5x as often as a 3.0 name. "
     "Set to 0 to disable and give every name the same probability — which is what the first version "
     "of this model did, and it was wrong, because it made name quality irrelevant to the economics.", True),
    ("Safety multiple required for BUY", 2.0, '0.0"x"',
     "How far above break-even a valuation must sit before the verdict is BUY. At 2.0 the name must "
     "be worth twice what the maths strictly requires — headroom for the valuation being wrong.", True),
]
r = 4
for label, val, fmt, note, is_input in assumptions:
    body(ws.cell(row=r, column=1, value=label), wrap=True)
    c = body(ws.cell(row=r, column=2, value=val), fmt=fmt, color=BLUE, bold=True)
    c.fill = YEL_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")
    body(ws.cell(row=r, column=3, value={PCT: "%", MONEY: "USD", NUM2: "years"}.get(fmt, "x")))
    body(ws.cell(row=r, column=4, value=note), wrap=True)
    ws.row_dimensions[r].height = 30
    r += 1

# derived
r += 1
ws.cell(row=r, column=1, value="DERIVED — do not edit").font = Font(name=FONT, size=11, bold=True, color="1F3864")
ws.cell(row=r, column=1).fill = SUB_FILL
ws.cell(row=r, column=4).fill = SUB_FILL
r += 1
body(ws.cell(row=r, column=1, value="Probability a listed name sells within the horizon"), wrap=True)
c = body(ws.cell(row=r, column=2, value="=1-(1-$B$6)^$B$7"), fmt=PCT, bold=True)
c.alignment = Alignment(horizontal="center")
body(ws.cell(row=r, column=4,
             value="1 minus the chance it fails to sell every year running. This single number is why "
                   "most portfolios lose money: over 5 years at a 2% annual rate, roughly 9 names in 10 "
                   "do not sell at all."), wrap=True)
ws.row_dimensions[r].height = 44
PROB_CELL = f"Assumptions!$B${r}"
r += 1
body(ws.cell(row=r, column=1, value="Expected renewal carry per name over horizon (.com)"), wrap=True)
body(ws.cell(row=r, column=2, value="=$B$8*$B$7"), fmt=MONEY, bold=True).alignment = Alignment(horizontal="center")
body(ws.cell(row=r, column=4, value="What you pay to keep one .com alive for the full horizon, win or lose."), wrap=True)

COMM = "Assumptions!$B$4"
MINCOMM = "Assumptions!$B$5"
STR_C = "Assumptions!$B$6"
HORIZON = "Assumptions!$B$7"
MULT = "Assumptions!$B$10"
PIVOT = "Assumptions!$B$11"
SENS = "Assumptions!$B$12"
SAFETY = "Assumptions!$B$13"

# ---------------------------------------------------------------- Rubric
ws = wb.create_sheet("Rubric")
title(ws, "Scoring Rubric — six weighted criteria, scored 1 to 5", span=6)
widths(ws, {"A": 26, "B": 10, "C": 44, "D": 44, "E": 44})

ws["A3"] = "Weights drive the Candidates tab. Edit the blue cells if you disagree; they must sum to 100%."
ws["A3"].font = Font(name=FONT, size=10, italic=True)

header_row(ws, 4, ["Criterion", "Weight", "Score 1 — avoid", "Score 3 — marginal", "Score 5 — strong"])

criteria = [
    ("Extension", 0.22,
     "New gTLD (.shop, .xyz, .link) or an obscure ccTLD. Supply is about to expand further when ICANN "
     "reopens the new-gTLD window.",
     ".co, .net, .org, or a strong country ccTLD. Sells, but at a fraction of .com.",
     ".com. Every one of 2026's largest sales was a .com. .ai is a genuine second tier for AI-native "
     "buyers but carries a much higher renewal."),
    ("Commercial intent", 0.30,
     "Hobby, meme, or personal-interest term. Nobody monetises it, so nobody bids.",
     "Real commercial term, but low customer value or a thin buyer pool.",
     "Term in a sector where one customer is worth thousands — finance, insurance, legal, medical, real "
     "estate, B2B SaaS. A $3k domain is a rounding error to that buyer."),
    ("Comp support", 0.22,
     "No comparable sale you can point to. You are guessing.",
     "Loosely similar names have sold, but at scattered prices or years ago.",
     "Several closely comparable names sold recently at prices you can cite. This is the only "
     "valuation input with an actual buyer behind it."),
    ("Length & memorability", 0.16,
     "Four or more words, over ~20 characters, or a forgettable string.",
     "Two or three words, reasonable length, unremarkable.",
     "One strong dictionary word, or a tight two-word pairing. Short 4-5 character .com remains the "
     "most valuable class there is."),
    ("Radio test", 0.10,
     "Has to be spelled out. Homophone traps, doubled letters, invented spellings.",
     "Mostly clear, occasional spelling correction needed.",
     "Say it once on a phone call and the other person types it correctly."),
]
r = 5
for name, wt, s1, s3, s5 in criteria:
    body(ws.cell(row=r, column=1, value=name), bold=True, wrap=True)
    c = body(ws.cell(row=r, column=2, value=wt), fmt=PCT, color=BLUE, bold=True)
    c.fill = YEL_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")
    for i, txt in enumerate([s1, s3, s5]):
        body(ws.cell(row=r, column=3 + i, value=txt), wrap=True)
    ws.row_dimensions[r].height = 58
    r += 1

W_EXT, W_COMM, W_COMP, W_LEN, W_RADIO = [f"Rubric!$B${5+i}" for i in range(5)]

body(ws.cell(row=r, column=1, value="Weight check"), bold=True)
c = body(ws.cell(row=r, column=2, value="=SUM(B5:B9)"), fmt=PCT, bold=True)
c.alignment = Alignment(horizontal="center")
body(ws.cell(row=r, column=3, value='=IF(ABS(B10-1)<0.0001,"OK — weights sum to 100%",'
                                    '"ERROR — weights must sum to 100%")'), bold=True, wrap=True)
WEIGHT_CHECK_ROW = r
r += 2

# Extension lookup
ws.cell(row=r, column=1, value="EXTENSION LOOKUP — used automatically by the Candidates tab").font = \
    Font(name=FONT, size=11, bold=True, color="1F3864")
ws.cell(row=r, column=1).fill = SUB_FILL
for cc in range(2, 6):
    ws.cell(row=r, column=cc).fill = SUB_FILL
r += 1
header_row(ws, r, ["Extension", "Score", "Typical annual renewal", "Note", ""])
r += 1
EXT_START = r
ext_table = [
    ("com", 5, 11, "The default. Dominates every top-sales chart."),
    ("ai", 4, 90, "Real demand, premium resale averages around $6.5k — but the renewal is the trap."),
    ("io", 3, 40, "Startup-friendly, high renewal, softening as .ai takes the tech mindshare."),
    ("co", 3, 30, "Credible .com alternative, sells at a steep discount to it."),
    ("net", 3, 13, "Old and trusted, limited upside."),
    ("org", 3, 13, "Strong for nonprofit/institutional buyers, narrow otherwise."),
    ("app", 2, 18, "Niche, mostly end-user rather than investor demand."),
    ("dev", 2, 15, "Same — developer tools, thin aftermarket."),
    ("xyz", 1, 12, "High volume, low realised prices."),
    ("other", 1, 50, "Default for anything unlisted — mostly new gTLDs. $50 is realistic, not "
                     "conservative: GoDaddy renews .center at $49.99 and .fun at $59.99, against "
                     "$11 for a .com. On a name bought for $1 the renewal IS the investment."),
]
for ext, sc, ren, note in ext_table:
    body(ws.cell(row=r, column=1, value=ext))
    body(ws.cell(row=r, column=2, value=sc), fmt=NUM2).alignment = Alignment(horizontal="center")
    body(ws.cell(row=r, column=3, value=ren), fmt=MONEY)
    body(ws.cell(row=r, column=4, value=note), wrap=True)
    r += 1
EXT_END = r - 1
EXT_KEYS = f"Rubric!$A${EXT_START}:$A${EXT_END}"
EXT_SCORES = f"Rubric!$B${EXT_START}:$B${EXT_END}"
EXT_RENEW = f"Rubric!$C${EXT_START}:$C${EXT_END}"
r += 1

# Hard filters
ws.cell(row=r, column=1, value="HARD FILTERS — any one of these rejects the name regardless of score").font = \
    Font(name=FONT, size=11, bold=True, color="1F3864")
ws.cell(row=r, column=1).fill = SUB_FILL
for cc in range(2, 6):
    ws.cell(row=r, column=cc).fill = SUB_FILL
r += 1
for f in [
    "Trademark risk — contains or closely mimics an existing brand. A UDRP complaint costs you the name "
    "and the legal fee, and intent to resell is exactly what the process punishes.",
    "Contains a hyphen or a digit. Both collapse resale value and fail the radio test.",
    "Four or more words.",
    "Plural/singular confusion with an established site you would be trading off.",
]:
    body(ws.cell(row=r, column=1, value="REJECT if:"), bold=True)
    ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=5)
    body(ws.cell(row=r, column=2, value=f), wrap=True)
    ws.row_dimensions[r].height = 30
    r += 1
r += 1

ws.cell(row=r, column=1, value="VERDICT THRESHOLDS").font = Font(name=FONT, size=11, bold=True, color="1F3864")
ws.cell(row=r, column=1).fill = SUB_FILL
for cc in range(2, 6):
    ws.cell(row=r, column=cc).fill = SUB_FILL
r += 1
header_row(ws, r, ["Verdict", "Condition", "Meaning", "", ""])
r += 1
BUY_T_ROW = r
for verdict, cond, mean in [
    ("BUY", "Score >= 4.00 and cost <= max rational bid", "Passes both the quality bar and the maths."),
    ("BUY IF CHEAPER", "Score >= 4.00 but cost > max rational bid",
     "Good name, wrong price. Bid the max rational bid and walk if it goes higher."),
    ("WATCH", "Score 3.20 - 3.99", "Borderline. Only take it at a low acquisition cost."),
    ("PASS", "Score < 3.20", "Below the bar."),
    ("REJECT", "Any hard filter failed", "Do not buy at any price."),
]:
    body(ws.cell(row=r, column=1, value=verdict), bold=True)
    body(ws.cell(row=r, column=2, value=cond), wrap=True)
    body(ws.cell(row=r, column=3, value=mean), wrap=True)
    r += 1
BUY_THRESHOLD, WATCH_THRESHOLD = 4.0, 3.2

# ---------------------------------------------------------------- Candidates
ws = wb.create_sheet("Candidates")
title(ws, "Candidate Pipeline — names under consideration", span=22)
ws["A2"] = ("Enter the FULL domain in column A (name.com) — Ext derives itself. Column A is then "
            "directly copy-pasteable into GoDaddy's bulk search. Type in the blue columns only; "
            "everything else is a formula. Row 5 is an example — delete it.")
ws["A2"].font = Font(name=FONT, size=10, italic=True)

cand_headers = [
    "Domain (full, e.g. name.com)", "Ext", "Ext Score", "Commercial Intent (1-5)", "Comp Support (1-5)",
    "Length & Memorability (1-5)", "Radio Test (1-5)", "TM Risk? (Y/N)", "Hyphen/Digit? (Y/N)",
    "Acquisition Cost", "Est. Resale Value", "Valuation Source", "Annual Renewal",
    "Weighted Score", "Hard Filter", "Effective STR /yr", "P(sale in horizon)", "Expected Carry",
    "BREAK-EVEN RESALE", "Value Ratio", "Max Rational Bid", "Verdict", "Availability", "Notes",
]
header_row(ws, 4, cand_headers)
widths(ws, {"A": 30, "B": 7, "C": 9, "D": 12, "E": 12, "F": 13, "G": 11, "H": 10, "I": 11,
            "J": 13, "K": 13, "L": 22, "M": 12, "N": 12, "O": 11, "P": 12, "Q": 13, "R": 12,
            "S": 15, "T": 11, "U": 14, "V": 18, "W": 18, "X": 44})

CAND_FIRST = 5
CAND_LAST = 304

example = ["equipmentfinancing.com", None, None, 5, 4, 3, 4, "N", "N", 2400, 285,
           "HumbleWorth brokerage 2026-08-03", None, None, None, None, None, None, None, None,
           None, None, "Taken",
           "EXAMPLE ROW — delete. Valuation Source is mandatory: a number with no source does not "
           "enter the model."]

for row in range(CAND_FIRST, CAND_LAST + 1):
    is_ex = row == CAND_FIRST
    vals = example if is_ex else [None] * len(cand_headers)
    A = f"$A{row}"

    def put(col_letter, value, fmt=None, color=BLACK, left=False):
        c = ws[f"{col_letter}{row}"]
        c.value = value
        body(c, fmt=fmt, color=color)
        if is_ex:
            c.fill = EX_FILL
        c.alignment = Alignment(horizontal="left" if left else "center", vertical="center")
        return c

    put("A", vals[0], color=BLUE, left=True)
    put("B", tld_formula(row), color=GREEN)
    put("C", f'=IF($B{row}="","",IFERROR(INDEX({EXT_SCORES},MATCH($B{row},{EXT_KEYS},0)),'
             f'INDEX({EXT_SCORES},MATCH("other",{EXT_KEYS},0))))', fmt=NUM2, color=GREEN)
    for i, col in enumerate("DEFG"):
        put(col, vals[3 + i], color=BLUE)
    put("H", vals[7], color=BLUE)
    put("I", vals[8], color=BLUE)
    put("J", vals[9], fmt=MONEY2, color=BLUE)
    put("K", vals[10], fmt=MONEY, color=BLUE)
    put("L", vals[11], color=BLUE, left=True)
    put("M", f'=IF($B{row}="","",IFERROR(INDEX({EXT_RENEW},MATCH($B{row},{EXT_KEYS},0)),'
             f'INDEX({EXT_RENEW},MATCH("other",{EXT_KEYS},0))))', fmt=MONEY, color=GREEN)
    put("N", f'=IF(OR({A}="",$C{row}=""),"",$C{row}*{W_EXT}+$D{row}*{W_COMM}+$E{row}*{W_COMP}'
             f'+$F{row}*{W_LEN}+$G{row}*{W_RADIO})', fmt=NUM2)
    put("O", f'=IF({A}="","",IF(OR(UPPER($H{row})="Y",UPPER($I{row})="Y"),"FAIL","PASS"))')
    # quality-scaled sell-through: base rate x (score / pivot) ^ sensitivity, floored so a weak
    # name still has some chance rather than exactly zero
    put("P", f'=IF($N{row}="","",{STR_C}*MAX(0.05,($N{row}/{PIVOT})^{SENS}))', fmt=PCT)
    put("Q", f'=IF($P{row}="","",1-(1-$P{row})^{HORIZON})', fmt=PCT)
    put("R", f'=IF($M{row}="","",$M{row}*{HORIZON})', fmt=MONEY)
    put("S", f'=IF(OR($J{row}="",$Q{row}="",$Q{row}=0),"",'
             f'MAX(($J{row}+$R{row})/($Q{row}*(1-{COMM})),($J{row}+$R{row})/$Q{row}+{MINCOMM}))',
        fmt=MONEY)
    put("T", f'=IF(OR($K{row}="",$S{row}="",$S{row}=0),"",$K{row}/$S{row})', fmt='0.00"x"')
    put("U", f'=IF(OR($K{row}="",$Q{row}=""),"",MAX(0,($K{row}-MAX($K{row}*{COMM},{MINCOMM}))'
             f'*$Q{row}-$R{row}))', fmt=MONEY2)
    put("V", f'=IF({A}="","",IF($O{row}="FAIL","REJECT",'
             f'IF($J{row}="","NEEDS PRICE",'
             f'IF(OR($K{row}="",$L{row}=""),"NEEDS VALUATION",'
             f'IF($T{row}>={SAFETY},"BUY",IF($T{row}>=1,"MARGINAL","PASS"))))))')
    put("W", vals[22], color=BLUE)
    c = put("X", vals[23], color=BLUE, left=True)
    c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

ws["S4"].comment = Comment(
    "The number to work from. What this name MUST resell for to justify its price, given the "
    "probability of ever selling it and the carry you pay meanwhile. You do not have to estimate "
    "a value to use it - just ask whether the name is plausibly worth this much.", "Rubric")
ws["K4"].comment = Comment(
    "Requires a source in the next column. An unsourced guess here silently drives every downstream "
    "number - that is exactly how the first version of this file produced valuations 6-30x too high.",
    "Rubric")
ws["P4"].comment = Comment(
    "Base sell-through rate scaled by the name's own score. This is a modelling assumption, not "
    "measured data - set Quality sensitivity to 0 on the Assumptions tab to switch it off.", "Rubric")
ws["T4"].comment = Comment(
    "Est. Resale Value divided by Break-even Resale. Above 1.0x the name pays for itself on average; "
    "the Safety Multiple on the Assumptions tab sets how far above 1.0x you require before BUY.",
    "Rubric")
ws.freeze_panes = "B5"
ws.auto_filter.ref = f"A4:X{CAND_LAST}"

# ---------------------------------------------------------------- Portfolio
ws = wb.create_sheet("Portfolio")
title(ws, "Portfolio — names you actually own", span=14)
ws["A2"] = ("Enter the FULL domain in column A (name.com) — Ext derives itself. Blue columns are "
            "yours; carry, cost basis and break-even are formulas that update with today's date. "
            "Row 5 is an example — delete it.")
ws["A2"].font = Font(name=FONT, size=10, italic=True)

port_headers = ["Domain (full, e.g. name.com)", "Ext", "Status", "Acquired", "Acquisition Cost", "Annual Renewal",
                "Years Held", "Renewals Paid", "Cumulative Carry", "Total Cost Basis",
                "Break-Even List Price", "Target List Price", "Currently Listed At", "Notes"]
header_row(ws, 4, port_headers)
widths(ws, {"A": 30, "B": 7, "C": 11, "D": 13, "E": 14, "F": 13, "G": 11, "H": 11,
            "I": 14, "J": 14, "K": 16, "L": 15, "M": 15, "N": 40})

PORT_FIRST, PORT_LAST = 5, 104
port_example = ["equipmentfinancing.com", None, "Active", date(2024, 3, 12), 2400, 11, None, None,
                None, None, None, None, 12000, "EXAMPLE ROW — delete."]

for row in range(PORT_FIRST, PORT_LAST + 1):
    is_ex = row == PORT_FIRST
    vals = port_example if is_ex else [None] * len(port_headers)
    A = f"$A{row}"

    def put(col_letter, value, fmt=None, color=BLACK, left=False):
        c = ws[f"{col_letter}{row}"]
        c.value = value
        body(c, fmt=fmt, color=color)
        if is_ex:
            c.fill = EX_FILL
        c.alignment = Alignment(horizontal="left" if left else "center", vertical="center")
        return c

    put("A", vals[0], color=BLUE, left=True)
    put("B", tld_formula(row), color=GREEN)
    put("C", vals[2], color=BLUE)
    put("D", vals[3], fmt=DATE_FMT, color=BLUE)
    put("E", vals[4], fmt=MONEY, color=BLUE)
    put("F", f'=IF($B{row}="","",IFERROR(INDEX({EXT_RENEW},MATCH(LOWER($B{row}),{EXT_KEYS},0)),'
             f'INDEX({EXT_RENEW},MATCH("other",{EXT_KEYS},0))))', fmt=MONEY, color=GREEN)
    put("G", f'=IF(OR({A}="",$D{row}=""),"",YEARFRAC($D{row},TODAY()))', fmt=NUM2)
    put("H", f'=IF($G{row}="","",MAX(0,INT($G{row})))', fmt='0')
    put("I", f'=IF(OR($F{row}="",$H{row}=""),"",$F{row}*$H{row})', fmt=MONEY)
    put("J", f'=IF(OR({A}="",$E{row}=""),"",$E{row}+IF($I{row}="",0,$I{row}))', fmt=MONEY)
    # MAX guards the $15 minimum commission: below a ~$75 sale price the flat fee bites
    # harder than the percentage, so basis/(1-comm) alone lists too low to recover cost.
    put("K", f'=IF(OR($J{row}="",$J{row}=0),"",MAX($J{row}/(1-{COMM}),$J{row}+{MINCOMM}))', fmt=MONEY)
    put("L", f'=IF($K{row}="","",MAX($K{row},$E{row}*{MULT}))', fmt=MONEY)
    put("M", vals[12], fmt=MONEY, color=BLUE)
    put("N", vals[13], color=BLUE, left=True).alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

ws["K4"].comment = Comment(
    "Total cost basis grossed up for commission, whichever is higher: basis / (1 - commission rate), "
    "or basis + the $15 minimum commission. The second binds below a ~$75 sale price. List under "
    "this and the sale loses money after GoDaddy takes its cut.", "Rubric")
ws["G4"].comment = Comment("Recalculates against today's date every time the file is opened.", "Rubric")
ws.freeze_panes = "B5"
ws.auto_filter.ref = f"A4:N{PORT_LAST}"

# ---------------------------------------------------------------- Sales Log
ws = wb.create_sheet("Sales Log")
title(ws, "Sales Log — every completed sale", span=11)
ws["A2"] = "Copy Total Cost Basis across from the Portfolio tab at the moment of sale. Row 5 is an example — delete it."
ws["A2"].font = Font(name=FONT, size=10, italic=True)

sales_headers = ["Domain", "Sale Date", "Sale Price", "Venue", "Commission Rate",
                 "Commission Paid", "Net Proceeds", "Total Cost Basis", "Net Profit", "ROI", "Notes"]
header_row(ws, 4, sales_headers)
widths(ws, {"A": 28, "B": 13, "C": 13, "D": 16, "E": 13, "F": 14, "G": 14, "H": 15,
            "I": 13, "J": 10, "K": 44})

SALE_FIRST, SALE_LAST = 5, 54
sale_example = ["equipmentfinancing.com", date(2026, 5, 20), 11500, "Afternic", 0.20, None, None,
                2433, None, None, "EXAMPLE ROW — delete."]

for row in range(SALE_FIRST, SALE_LAST + 1):
    is_ex = row == SALE_FIRST
    vals = sale_example if is_ex else [None] * len(sales_headers)
    A = f"$A{row}"

    def put(col_letter, value, fmt=None, color=BLACK, left=False):
        c = ws[f"{col_letter}{row}"]
        c.value = value
        body(c, fmt=fmt, color=color)
        if is_ex:
            c.fill = EX_FILL
        c.alignment = Alignment(horizontal="left" if left else "center", vertical="center")
        return c

    put("A", vals[0], color=BLUE, left=True)
    put("B", vals[1], fmt=DATE_FMT, color=BLUE)
    put("C", vals[2], fmt=MONEY, color=BLUE)
    put("D", vals[3], color=BLUE)
    put("E", vals[4] if is_ex else f'=IF({A}="","",{COMM})', fmt=PCT, color=BLUE if is_ex else GREEN)
    put("F", f'=IF(OR({A}="",$C{row}=""),"",MAX($C{row}*$E{row},{MINCOMM}))', fmt=MONEY)
    put("G", f'=IF($F{row}="","",$C{row}-$F{row})', fmt=MONEY)
    put("H", vals[7], fmt=MONEY, color=BLUE)
    put("I", f'=IF(OR($G{row}="",$H{row}=""),"",$G{row}-$H{row})', fmt=MONEY)
    put("J", f'=IF(OR($I{row}="",$H{row}="",$H{row}=0),"",$I{row}/$H{row})', fmt=PCT)
    put("K", vals[10], color=BLUE, left=True).alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)

ws.freeze_panes = "B5"

# ---------------------------------------------------------------- Dashboard
ws = wb.create_sheet("Dashboard")
title(ws, "Dashboard — read only", span=4)
widths(ws, {"A": 46, "B": 18, "C": 4, "D": 78})

PORT_A = f"Portfolio!$A${PORT_FIRST}:$A${PORT_LAST}"
PORT_C = f"Portfolio!$C${PORT_FIRST}:$C${PORT_LAST}"
PORT_E = f"Portfolio!$E${PORT_FIRST}:$E${PORT_LAST}"
PORT_F = f"Portfolio!$F${PORT_FIRST}:$F${PORT_LAST}"
PORT_I = f"Portfolio!$I${PORT_FIRST}:$I${PORT_LAST}"
PORT_J = f"Portfolio!$J${PORT_FIRST}:$J${PORT_LAST}"
SALE_C = f"'Sales Log'!$C${SALE_FIRST}:$C${SALE_LAST}"
SALE_G = f"'Sales Log'!$G${SALE_FIRST}:$G${SALE_LAST}"
SALE_I = f"'Sales Log'!$I${SALE_FIRST}:$I${SALE_LAST}"
SALE_A = f"'Sales Log'!$A${SALE_FIRST}:$A${SALE_LAST}"
CAND_A = f"Candidates!$A${CAND_FIRST}:$A${CAND_LAST}"
CAND_T = f"Candidates!$V${CAND_FIRST}:$V${CAND_LAST}"

r = 3
sections = [
    ("PORTFOLIO", [
        ("Active names held", f'=COUNTIF({PORT_C},"Active")', '0',
         "Names currently owned and renewing."),
        ("Total acquisition invested", f'=SUMIF({PORT_C},"Active",{PORT_E})', MONEY,
         "Cash spent buying the names you still hold."),
        ("Cumulative renewal carry paid", f'=SUMIF({PORT_C},"Active",{PORT_I})', MONEY,
         "Renewals paid to date on names you still hold. This only ever goes up."),
        ("Total cost basis", f'=SUMIF({PORT_C},"Active",{PORT_J})', MONEY,
         "Acquisition plus carry. What the portfolio must clear to break even."),
        ("Annual renewal burden", f'=SUMIF({PORT_C},"Active",{PORT_F})', MONEY,
         "What you owe every year to keep the portfolio alive, before a single sale. Compare this "
         "against Realised Net Profit below — if it is larger, the portfolio is shrinking."),
    ]),
    ("REALISED RESULTS", [
        ("Sales completed", f'=COUNTIF({SALE_A},"<>")', '0', "Rows on the Sales Log."),
        ("Gross sales value", f'=SUM({SALE_C})', MONEY, "Before commission."),
        ("Net proceeds after commission", f'=SUM({SALE_G})', MONEY, "What actually reached you."),
        ("Realised net profit", f'=SUM({SALE_I})', MONEY,
         "Net proceeds minus the cost basis of the names sold."),
        ("Profit vs. annual renewal burden", f'=IF($B$8=0,"n/a",SUM({SALE_I})/$B$8)', '0.00"x"',
         "How many years of renewals your realised profit covers. Below 1.0x, the portfolio is "
         "funded by fresh cash rather than by sales."),
    ]),
    ("SELL-THROUGH", [
        ("Realised sell-through (lifetime)", f'=IF(($B$4+COUNTIF({SALE_A},"<>"))=0,"n/a",'
                                            f'COUNTIF({SALE_A},"<>")/($B$4+COUNTIF({SALE_A},"<>")))', PCT,
         "Sales divided by all names ever held. Compare with the 2% assumption. Fewer than ~50 names "
         "makes this statistically meaningless — read it as a sanity check, not a result."),
        ("Assumed sell-through (Assumptions tab)", f'={STR_C}', PCT,
         "If your realised rate sits persistently below this, your max-bid maths is too generous."),
        ("Expected sales per year at assumed rate", f'=$B$4*{STR_C}', NUM2,
         "Active names times the assumed rate. Below 1.0, expect years with no sales at all."),
    ]),
    ("PIPELINE", [
        ("Candidates evaluated", f'=COUNTIF({CAND_A},"<>")', '0', "Rows on the Candidates tab."),
        ("Verdict: BUY", f'=COUNTIF({CAND_T},"BUY")', '0',
         "Sourced valuation clears break-even by at least the safety multiple."),
        ("Verdict: MARGINAL", f'=COUNTIF({CAND_T},"MARGINAL")', '0',
         "Above break-even but inside the safety margin. Only if you trust the valuation."),
        ("Verdict: NEEDS VALUATION / PRICE",
         f'=COUNTIF({CAND_T},"NEEDS VALUATION")+COUNTIF({CAND_T},"NEEDS PRICE")', '0',
         "Missing a sourced valuation or a real price. The model refuses to guess on your behalf."),
        ("Verdict: PASS / REJECT", f'=COUNTIF({CAND_T},"PASS")+COUNTIF({CAND_T},"REJECT")', '0',
         "Below break-even, or hard-filtered."),
    ]),
]

for section, items in sections:
    c = ws.cell(row=r, column=1, value=section)
    c.font = Font(name=FONT, size=11, bold=True, color="FFFFFF")
    c.fill = HDR_FILL
    for cc in range(2, 5):
        ws.cell(row=r, column=cc).fill = HDR_FILL
    r += 1
    for label, formula, fmt, note in items:
        body(ws.cell(row=r, column=1, value=label), wrap=True)
        v = body(ws.cell(row=r, column=2, value=formula), fmt=fmt, color=GREEN, bold=True, size=11)
        v.alignment = Alignment(horizontal="center", vertical="center")
        body(ws.cell(row=r, column=4, value=note), wrap=True, size=9)
        ws.row_dimensions[r].height = 32 if len(note) > 90 else 18
        r += 1
    r += 1

# ---------------------------------------------------------------- Comps
ws = wb.create_sheet("Comps")
title(ws, "Market benchmarks & comparable sales — for scoring Comp Support", span=5)
ws["A3"] = ("Reference points gathered from published industry reporting. Add your own comps below as you "
            "research specific niches — your own sector comps will always beat these headline numbers.")
ws["A3"].font = Font(name=FONT, size=10, italic=True)
ws["A3"].alignment = Alignment(wrap_text=True)
widths(ws, {"A": 34, "B": 20, "C": 14, "D": 58, "E": 46})

header_row(ws, 5, ["Benchmark / Sale", "Value", "Year", "What it tells you", "Source"])
comps = [
    ("AI.com", "$70,000,000", "2026", "Largest domain sale ever recorded. Bought by the Crypto.com owners.",
     "DNJournal"),
    ("Club.com", "$10,000,000", "2026", "Second-largest of 2026. Single dictionary word .com.", "DNJournal"),
    ("Green.com", "$7,500,000", "2026", "Third-largest of 2026. Confirms the single-word .com pattern at the top.",
     "DNJournal"),
    ("icon.com", "$12,000,000", "2025", "Top sale of 2025.", "Industry reporting"),
    ("Bot.ai", "$1,200,000", "2026", "Largest .ai of the year — the ceiling for the extension is real but far "
                                     "below .com.", "DNJournal"),
    ("Genesis.ai / Lotus.ai", "$400,000 each", "2026", "Short dictionary-word .ai clears six figures.", "DNJournal"),
    ("Free.ai", "$350,000", "2026", "Same pattern.", "DNJournal"),
    ("Neo.ai", "$275,000", "2026", "Same pattern.", "DNJournal"),
    ("Best hand-registered sale reported", "$75,000", "2026",
     "It happens — and it is newsworthy precisely because it is rare. Do not plan around it.", "DNJournal"),
    ("Average premium .ai resale", "~$6,500", "2026",
     "The realistic middle of the .ai market, against a ~$90/yr renewal.", "Industry reporting"),
    ("Total aftermarket, reported", "$314,700,000", "2025",
     "Across 190,109 transactions — up 67% in dollar volume year on year. Average reported transaction "
     "is about $1,655.", "Industry reporting"),
    ("Typical annual sell-through rate", "1.5% - 2.0%", "2026",
     "1-5% is considered healthy across a diversified portfolio.", "Domavest / industry"),
    ("Typical time to sale", "5 - 10 years", "2026", "For ordinary inventory on the major marketplaces.",
     "Sedo / Afternic data"),
    ("Afternic commission", "25% - 30%", "2026",
     "30% Boost / 25% Basic; 20% / 15% using GoDaddy aftermarket nameservers. $15 minimum.", "GoDaddy / Afternic"),
    ("Worked example — profitable", "+$2,500 over 2 yrs", "2026",
     "100 .com at $20 acquisition, $15/yr renewal, 2% sell-through, $2,500 average sale.", "Monefy analysis"),
    ("Worked example — unprofitable", "-$4,600 over 5 yrs", "2026",
     "200 .ai/.io at $50 acquisition, $35/yr renewal, 0.5% sell-through, $3,000 average sale. High renewals "
     "at low sell-through is the classic way to lose money.", "Monefy analysis"),
    ("ICANN new gTLD window", "Reopens 2026", "2026",
     "Hundreds of new extensions incoming. Expands supply — a risk to existing new-gTLD inventory, not an "
     "opportunity for a small portfolio.", "ICANN"),
]
r = 6
for a, b, c_, d, e in comps:
    body(ws.cell(row=r, column=1, value=a), bold=True, wrap=True)
    body(ws.cell(row=r, column=2, value=b)).alignment = Alignment(horizontal="center", vertical="center")
    body(ws.cell(row=r, column=3, value=c_)).alignment = Alignment(horizontal="center", vertical="center")
    body(ws.cell(row=r, column=4, value=d), wrap=True)
    body(ws.cell(row=r, column=5, value=e), wrap=True)
    ws.row_dimensions[r].height = 30
    r += 1

r += 1
ws.cell(row=r, column=1, value="Sources").font = Font(name=FONT, size=10, bold=True)
for src in [
    "DNJournal YTD Top 100 Sales Charts — https://www.dnjournal.com/ytd-sales-charts.htm",
    "NameBio sales database (6.8M+ recorded sales) — https://namebio.com",
    "GoDaddy aftermarket commission model update — https://www.godaddy.com/resources/news/godaddy-aftermarket-alignment-commission-model-update",
    "Domavest, sell-through rate benchmarks 2026 — https://www.domavest.com/2026/03/what-is-good-domain-sell-through-rate.html",
    "Monefy, domain investing profitability analysis — https://www.monefy.com/article/domain-investing-profitability-data-backed-answer",
]:
    r += 1
    ws.cell(row=r, column=1, value=src).font = Font(name=FONT, size=9)
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)

for s in wb.worksheets:
    s.sheet_view.showGridLines = False

wb.save(OUT)
print("saved", OUT)
