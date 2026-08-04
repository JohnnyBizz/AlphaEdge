"""Add the Market Frequency tab — how often domains actually sell, and at what prices.

Every number here is sourced. The point is to calibrate the sell-through assumption on the
Assumptions tab against reality, and to answer the question the model keeps raising: a name
must clear its break-even resale, so how often does any .com actually sell for that much?
"""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"
FONT = "Arial"
BLUE, BLACK, GREEN = "0000FF", "000000", "008000"
HDR_FILL = PatternFill("solid", fgColor="1F3864")
SUB_FILL = PatternFill("solid", fgColor="D9E2F3")
YEL_FILL = PatternFill("solid", fgColor="FFFF00")
MONEY = '$#,##0;($#,##0);-'
MONEY2 = '$#,##0.00;($#,##0.00);-'
PCT2 = '0.00%'
NUM0 = '#,##0'
thin = Side(style="thin", color="AAAAAA")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)

wb = load_workbook(WB)
if "Market Frequency" in wb.sheetnames:
    del wb["Market Frequency"]
ws = wb.create_sheet("Market Frequency", wb.sheetnames.index("Comps") + 1)


def body(cell, fmt=None, color=BLACK, bold=False, wrap=False, size=10, center=False):
    cell.font = Font(name=FONT, size=size, bold=bold, color=color)
    if fmt:
        cell.number_format = fmt
    cell.alignment = Alignment(horizontal="center" if center else "left",
                               vertical="center", wrap_text=wrap)
    cell.border = BOX
    return cell


def section(row, text, span=5):
    c = ws.cell(row=row, column=1, value=text)
    c.font = Font(name=FONT, size=11, bold=True, color="FFFFFF")
    for i in range(1, span + 1):
        ws.cell(row=row, column=i).fill = HDR_FILL
    return row + 1


ws["A1"] = "Market Frequency — how often domains actually sell"
ws["A1"].font = Font(name=FONT, size=14, bold=True, color="FFFFFF")
ws["A1"].fill = HDR_FILL
ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=5)
ws.row_dimensions[1].height = 24

for col, w in {"A": 40, "B": 18, "C": 16, "D": 60, "E": 40}.items():
    ws.column_dimensions[col].width = w

r = 3
r = section(r, "VOLUME — how much moves, and how fast")
hdr = ["Measure", "Value", "Period", "Source"]
for i, h in enumerate(hdr, start=1):
    c = ws.cell(row=r, column=i, value=h)
    c.font = Font(name=FONT, size=10, bold=True, color="FFFFFF")
    c.fill = HDR_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = BOX
r += 1
volume = [
    ("Reported sales, all TLDs", 190109, "2025 full year", "Industry reporting — $314.7m total, +31% transactions YoY"),
    ("Reported dollar volume", 314700000, "2025 full year", "Same. Average transaction about $1,655."),
    ("NameBio-listed sales", 128300, "H1 2026", "NamePros analysis of NameBio — roughly $146m dollar volume"),
    ("Implied sales per day ($100+)", 700, "H1 2026 average", "128,300 over ~183 days"),
    ("Single-day sample, $100+", 698, "4 April 2026", "$1,468,306 volume, $2,104 average"),
    ("Single-day sample, under $100", 2262, "4 April 2026", "Same day. Most activity is below the reporting threshold."),
    (".com sales analysed", 480667, "Jan 2024 - May 2026", "28-month .com dataset (bishopi.io)"),
    ("Implied .com sales per year", 206000, "Derived", "480,667 over 28 months, annualised. DERIVED, not reported."),
    ("Total .com registered", 303700000, "2026", "About 45% of all domains globally"),
]
VOL_FIRST = r
for label, val, period, src in volume:
    body(ws.cell(row=r, column=1, value=label))
    body(ws.cell(row=r, column=2, value=val),
         fmt=MONEY if val > 1000000 else NUM0, bold=True, center=True)
    body(ws.cell(row=r, column=3, value=period), center=True)
    body(ws.cell(row=r, column=4, value=src), wrap=True, size=9)
    r += 1

body(ws.cell(row=r, column=1, value="Annual turnover of the whole .com base"), bold=True)
c = body(ws.cell(row=r, column=2, value=f"=B{VOL_FIRST+7}/B{VOL_FIRST+8}"), fmt='0.000%',
         bold=True, center=True, color=GREEN)
body(ws.cell(row=r, column=3, value="Derived"), center=True)
body(ws.cell(row=r, column=4, value="Share of all registered .com that change hands in the aftermarket "
                                    "each year. Do NOT confuse this with the sell-through rate on the "
                                    "Assumptions tab: that one is per LISTED name, this one is per "
                                    "REGISTERED name. Different denominators."), wrap=True, size=9)
ws.row_dimensions[r].height = 42
r += 2

r = section(r, "PRICE DISTRIBUTION — 480,667 .com sales, Jan 2024 to May 2026")
for i, h in enumerate(["Price band", "% of all sales", "Median in band", "% of sales AT OR ABOVE this band's floor"], start=1):
    c = ws.cell(row=r, column=i, value=h)
    c.font = Font(name=FONT, size=10, bold=True, color="FFFFFF")
    c.fill = HDR_FILL
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BOX
ws.row_dimensions[r].height = 32
r += 1
BAND_FIRST = r
# floor, label, share, median-in-band (None where not reported)
bands = [
    (0, "Under $100", 0.305, None),
    (100, "$100 - $999", 0.565, 255),
    (1000, "$1,000 - $9,999", 0.1236, None),
    (10000, "$10,000 - $99,999", 0.006, None),
    (100000, "$100,000 and above", 0.0004, None),
]
for floor, label, share, med in bands:
    body(ws.cell(row=r, column=1, value=label))
    body(ws.cell(row=r, column=2, value=share), fmt=PCT2, center=True, bold=True)
    body(ws.cell(row=r, column=3, value=med), fmt=MONEY, center=True)
    # cumulative share at or above this band's floor = 1 - sum of shares strictly below
    if r == BAND_FIRST:
        formula = "=1"
    else:
        formula = f"=1-SUM($B${BAND_FIRST}:$B${r-1})"
    body(ws.cell(row=r, column=4, value=formula), fmt=PCT2, center=True, color=GREEN, bold=True)
    ws.cell(row=r, column=5, value=floor)  # hidden helper: band floor
    ws.cell(row=r, column=5).font = Font(name=FONT, size=9, color="AAAAAA")
    r += 1
BAND_LAST = r - 1
ws.column_dimensions["E"].hidden = True

body(ws.cell(row=r, column=1, value="Six-figure sales, count"), bold=True)
body(ws.cell(row=r, column=2, value=198), fmt=NUM0, center=True, bold=True)
body(ws.cell(row=r, column=4, value="In the whole 28-month window — about 85 a year worldwide, across "
                                    "every .com. Four hundredths of one percent of transactions."),
     wrap=True, size=9)
ws.row_dimensions[r].height = 28
r += 1
body(ws.cell(row=r, column=1, value="Median sale price"), bold=True)
body(ws.cell(row=r, column=2, value=818), fmt=MONEY, center=True, bold=True)
body(ws.cell(row=r, column=4, value="Reported .com median. Sedo's all-TLD median is lower at $549, "
                                    "against a $2,345 average — the gap between median and average is "
                                    "the whole story: a few large sales drag the mean up."), wrap=True, size=9)
ws.row_dimensions[r].height = 28
r += 1
ws.cell(row=r, column=1, value="Note: the 'Under $100' share is DERIVED (87% under $1,000 minus the "
                               "56.5% in the $100-999 band), not directly reported.").font = \
    Font(name=FONT, size=9, italic=True, color="C00000")
r += 2

r = section(r, "CALIBRATOR — what percentile does your break-even sit at?")
body(ws.cell(row=r, column=1, value="Enter a break-even resale price"))
CALC_IN = r
c = body(ws.cell(row=r, column=2, value=700), fmt=MONEY, color=BLUE, bold=True, center=True)
c.fill = YEL_FILL
body(ws.cell(row=r, column=4, value="Copy a figure from the BREAK-EVEN RESALE column on the Candidates "
                                    "tab. At $22.99 acquisition these run about $650-$1,050."), wrap=True, size=9)
ws.row_dimensions[r].height = 28
r += 1

FLOORS = f"$E${BAND_FIRST}:$E${BAND_LAST}"
ABOVE = f"$D${BAND_FIRST}:$D${BAND_LAST}"
LABELS = f"$A${BAND_FIRST}:$A${BAND_LAST}"
NBANDS = BAND_LAST - BAND_FIRST + 1

# Broken out into helper cells on purpose. The single nested version of this was unreadable
# and impossible to check when it went wrong; each step below can be verified on its own.
helpers = [
    ("Band it falls in", f'=INDEX({LABELS},MATCH($B${CALC_IN},{FLOORS},1))', None),
    ("Band index", f'=MATCH($B${CALC_IN},{FLOORS},1)', '0'),
    ("Band floor", None, MONEY),          # filled below, depends on the index row
    ("Next band floor", None, MONEY),
    ("% of sales clearing band floor", None, PCT2),
    ("% of sales clearing next floor", None, PCT2),
]
H = {}
for label, formula, fmt in helpers:
    body(ws.cell(row=r, column=1, value=label))
    H[label] = r
    if formula:
        body(ws.cell(row=r, column=2, value=formula), fmt=fmt, center=True, bold=True, color=GREEN)
    r += 1

IDX = f"$B${H['Band index']}"
body(ws.cell(row=r - 4, column=2, value=f'=MAX(1,INDEX({FLOORS},{IDX}))'),
     fmt=MONEY, center=True, color=GREEN)
body(ws.cell(row=r - 3, column=2, value=f'=INDEX({FLOORS},MIN({IDX}+1,{NBANDS}))'),
     fmt=MONEY, center=True, color=GREEN)
body(ws.cell(row=r - 2, column=2, value=f'=INDEX({ABOVE},{IDX})'),
     fmt=PCT2, center=True, color=GREEN)
body(ws.cell(row=r - 1, column=2, value=f'=INDEX({ABOVE},MIN({IDX}+1,{NBANDS}))'),
     fmt=PCT2, center=True, color=GREEN)

LO_F = f"$B${H['Band floor']}"
HI_F = f"$B${H['Next band floor']}"
LO_A = f"$B${H['% of sales clearing band floor']}"
HI_A = f"$B${H['% of sales clearing next floor']}"

body(ws.cell(row=r, column=1, value="Share of .com sales that clear it"), bold=True)
body(ws.cell(row=r, column=2, value=(
    f'=IF({IDX}>={NBANDS},{LO_A},'
    f'{LO_A}+({HI_A}-{LO_A})*LOG($B${CALC_IN}/{LO_F})/LOG({HI_F}/{LO_F}))')),
     fmt=PCT2, center=True, bold=True, color=GREEN)
CALC_OUT = r
body(ws.cell(row=r, column=4, value="Log-interpolated between the two band floors above, so treat it "
                                    "as approximate. It answers the question that matters: if this name "
                                    "does sell, how likely is the price to clear break-even?"),
     wrap=True, size=9)
ws.row_dimensions[r].height = 40
r += 1
body(ws.cell(row=r, column=1, value="Roughly one sale in"), bold=True)
body(ws.cell(row=r, column=2, value=f'=IF(OR($B${CALC_OUT}="",$B${CALC_OUT}=0),"",1/$B${CALC_OUT})'),
     fmt='0.0', center=True, bold=True, color=GREEN)
body(ws.cell(row=r, column=4, value="Same number, inverted — easier to hold in your head."),
     wrap=True, size=9)
r += 2

r = section(r, "WHAT THIS MEANS FOR THE MODEL")
for text in [
    "87% of .com sales close under $1,000. A typical break-even on a $22.99 registration is around "
    "$700-$900, which sits near the 78th-80th percentile. So the name does not just have to sell — "
    "it has to sell for an ABOVE-MEDIAN price. Two independent things have to go right.",
    "The median .com sale is $818 and the median across all TLDs at Sedo is $549. If your mental "
    "model of a 'normal' sale is four or five figures, it is wrong by an order of magnitude — that "
    "is the same mistake that put $1,800 on brewingfinancing.com.",
    "Six-figure sales run about 85 a year worldwide. Any strategy whose returns depend on one is not "
    "a strategy.",
    "About 700 sales a day clear $100, and roughly three times that number close below it. The market "
    "is genuinely liquid at the bottom and extremely thin at the top.",
    "Aftermarket turnover is under a tenth of a percent of registered .com per year. The 2% on the "
    "Assumptions tab is per name LISTED FOR SALE, which is a much smaller and more self-selected "
    "pool. Both numbers are real; they answer different questions.",
]:
    body(ws.cell(row=r, column=1, value=text), wrap=True, size=10)
    ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)
    ws.row_dimensions[r].height = 42
    r += 1
r += 1

r = section(r, "WHERE TO GET THIS YOURSELF")
for i, h in enumerate(["Source", "Cost", "Refresh", "What it gives you"], start=1):
    c = ws.cell(row=r, column=i, value=h)
    c.font = Font(name=FONT, size=10, bold=True, color="FFFFFF")
    c.fill = HDR_FILL
    c.alignment = Alignment(horizontal="center", vertical="center")
    c.border = BOX
r += 1
sources = [
    ("NameBio — namebio.com", "Free search; paid export", "Daily",
     "The core dataset: 6.8m+ recorded sales. Search by keyword, TLD, price and date. "
     "Its /trends page carries volume charts. Paid tier unlocks bulk export and full history."),
    ("NameBio Trends — namebio.com/trends", "Free", "Daily",
     "Aggregate volume and average-price charts. The fastest read on whether the market is moving."),
    ("DNJournal — dnjournal.com", "Free", "Weekly",
     "Weekly top-sales chart and a YTD top-100. High end only, so useful for ceilings, "
     "useless for the median."),
    ("NamePros analysis threads", "Free", "Ad hoc",
     "Members publish periodic NameBio breakdowns — the source of the H1 2026 volume figures here. "
     "Search the forum for 'NameBio analysis'."),
    ("Sedo annual/quarterly report", "Free", "Quarterly",
     "Median and average by TLD across ~350 extensions. The best source for medians "
     "rather than headlines."),
    ("Afternic / GoDaddy sales feeds", "Free", "Daily",
     "Reported sales flow into NameBio anyway, but the marketplaces publish their own summaries."),
    ("ExpiredDomains.net", "Free registration", "Daily",
     "Not sales — supply. Shows what is dropping and what is in closeout, which is the input "
     "to the Closeout Screener tab."),
    ("HumbleWorth — humbleworth.com", "Free; bulk + API", "On demand",
     "Automated valuations, three estimates per name. An estimate rather than evidence, but it "
     "beats an unsourced guess, and the bulk tool fills the Est. Resale Value column fast."),
]
for name, cost, refresh, what in sources:
    body(ws.cell(row=r, column=1, value=name), bold=True, wrap=True)
    body(ws.cell(row=r, column=2, value=cost), center=True, size=9)
    body(ws.cell(row=r, column=3, value=refresh), center=True, size=9)
    body(ws.cell(row=r, column=4, value=what), wrap=True, size=9)
    ws.row_dimensions[r].height = 40
    r += 1
r += 1
ws.cell(row=r, column=1, value="Figures gathered 2026-08-04. Volume and distribution move slowly, "
                               "but re-check before leaning on them.").font = \
    Font(name=FONT, size=9, italic=True)

ws[f"D{BAND_FIRST}"].comment = Comment(
    "Cumulative: the share of all .com sales that close at or above this band's floor. "
    "Computed from the band shares, so it stays correct if you edit them.", "Rubric")

ws.sheet_view.showGridLines = False
wb.save(WB)
print(f"Market Frequency added: bands rows {BAND_FIRST}-{BAND_LAST}, calculator input B{CALC_IN}")
