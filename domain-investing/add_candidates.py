"""Populate the Candidates tab with the equipment financing / commercial lending niche."""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"
FONT = "Arial"
BLUE = "0000FF"
NO_FILL = PatternFill(fill_type=None)

# name, ext, CommercialIntent, CompSupport, Length, Radio, Margin, TM, Hyphen, EstResale, Tier, Note
# Margin assumes hand-registration (~$12) for likely-available names; Tier 1 assumes aftermarket.
C = [
    # ---- TIER 1: exact-match core terms. Expect ALL registered. Aftermarket / expired-auction targets.
    ("workingcapital", "com", 5, 4, 4, 5, 2, "N", "N", 40000, "T1", "Core term, huge buyer pool. Certainly registered — auction/broker target only."),
    ("commerciallending", "com", 5, 3, 3, 4, 2, "N", "N", 30000, "T1", "Category-defining term. Aftermarket only."),
    ("equipmentfinancing", "com", 5, 3, 3, 5, 2, "N", "N", 25000, "T1", "The exact-match phrase for the niche. Aftermarket only."),
    ("equipmentleasing", "com", 5, 3, 3, 5, 2, "N", "N", 25000, "T1", "ELFA's own vocabulary. Aftermarket only."),
    ("invoicefactoring", "com", 5, 3, 3, 5, 2, "N", "N", 20000, "T1", "High-CPC lending vertical. Aftermarket only."),
    ("merchantcashadvance", "com", 5, 3, 2, 4, 2, "N", "N", 20000, "T1", "Very high CPC, long string. Aftermarket only."),
    ("assetbasedlending", "com", 5, 3, 2, 4, 2, "N", "N", 12000, "T1", "ABL is a real institutional category. Aftermarket only."),
    ("saleleaseback", "com", 4, 2, 3, 4, 2, "N", "N", 8000, "T1", "Structure term; narrower buyer pool than it looks."),
    ("vendorfinancing", "com", 4, 2, 3, 5, 2, "N", "N", 7000, "T1", "Vendor programs are a major equipment-finance channel."),
    ("equipmentloans", "com", 5, 3, 4, 5, 2, "N", "N", 18000, "T1", "Shorter and cleaner than 'financing'. Aftermarket only."),

    # ---- TIER 2: two-word vertical x product. Some may still be hand-registrable.
    ("machineryfinancing", "com", 4, 3, 3, 4, 5, "N", "N", 4500, "T2", "Machine tools / CNC buyers. Check availability."),
    ("forkliftfinancing", "com", 4, 3, 3, 5, 5, "N", "N", 3500, "T2", "Material handling is a large, financeable category."),
    ("fleetfinancing", "com", 5, 3, 4, 5, 5, "N", "N", 6000, "T2", "Fleet is high-ticket and repeat-purchase."),
    ("cranefinancing", "com", 4, 2, 4, 5, 5, "N", "N", 3000, "T2", "Heavy construction niche, small but wealthy buyer pool."),
    ("truckfinancing", "com", 5, 3, 4, 5, 5, "N", "N", 6000, "T2", "Trucking is the single biggest equipment-finance vertical."),
    ("trailerfinancing", "com", 4, 2, 3, 5, 5, "N", "N", 3000, "T2", "Adjacent to trucking."),
    ("dentalfinancing", "com", 4, 3, 3, 5, 5, "N", "N", 4000, "T2", "Dental practices finance chairs and imaging constantly."),
    ("medicalleasing", "com", 4, 3, 4, 4, 5, "N", "N", 4500, "T2", "Imaging and diagnostic equipment leasing."),
    ("solarfinancing", "com", 4, 3, 4, 5, 5, "N", "N", 5000, "T2", "Commercial solar is heavily financed."),
    ("brewingfinancing", "com", 3, 2, 3, 4, 5, "N", "N", 1800, "T2", "Narrow. Included as a deliberate low-scorer for contrast."),
    ("kitchenfinancing", "com", 3, 2, 3, 4, 5, "N", "N", 2000, "T2", "Restaurant build-outs. Ambiguous — reads residential."),
    ("hvacfinancing", "com", 4, 3, 4, 4, 5, "N", "N", 4000, "T2", "Contractor equipment plus consumer-facing crossover."),
    ("printfinancing", "com", 3, 2, 4, 4, 5, "N", "N", 1800, "T2", "Commercial printing is a shrinking sector."),
    ("laundryfinancing", "com", 3, 2, 3, 4, 5, "N", "N", 2000, "T2", "Laundromat equipment is genuinely financed, small pool."),
    ("gymfinancing", "com", 3, 2, 4, 4, 5, "N", "N", 2200, "T2", "Fitness equipment leasing."),
    ("farmfinancing", "com", 4, 3, 4, 5, 5, "N", "N", 5000, "T2", "Ag equipment is a major financed category."),
    ("agequipmentloans", "com", 3, 2, 3, 3, 5, "N", "N", 1800, "T2", "'ag' reads as ambiguous when spoken. Weak radio test."),
    ("minefinancing", "com", 3, 2, 4, 3, 5, "N", "N", 1800, "T2", "Mining equipment. 'mine' is a homophone trap."),

    # ---- TIER 3: commercial lending long-tail and product terms
    ("equipmentcapital", "com", 5, 3, 4, 5, 4, "N", "N", 9000, "T3", "Reads like a lender's own name — strong end-user appeal."),
    ("equipmentfunding", "com", 5, 3, 4, 5, 4, "N", "N", 8000, "T3", "Same pattern as above."),
    ("equipmentlending", "com", 5, 3, 4, 5, 4, "N", "N", 9000, "T3", "Same pattern as above."),
    ("leasingcapital", "com", 4, 3, 4, 5, 4, "N", "N", 5000, "T3", "Generic enough to suit many lessors."),
    ("lendingdesk", "com", 4, 3, 5, 5, 4, "N", "N", 5500, "T3", "'Desk' is real institutional finance vocabulary."),
    ("fundingdesk", "com", 4, 3, 5, 5, 4, "N", "N", 5500, "T3", "Same."),
    ("capitaldesk", "com", 4, 3, 5, 5, 4, "N", "N", 5500, "T3", "Same."),
    ("creditdesk", "com", 4, 3, 5, 5, 4, "N", "N", 5000, "T3", "Same."),
    ("termsheet", "com", 4, 3, 5, 5, 3, "N", "N", 12000, "T3", "One word, real industry term. Almost certainly registered."),
    ("underwrite", "com", 4, 3, 5, 5, 3, "N", "N", 12000, "T3", "Single dictionary verb, core to lending. Likely registered."),
    ("sba504", "com", 4, 2, 5, 3, 5, "N", "Y", 3000, "T3", "HARD FILTER DEMO — contains digits. Auto-rejects."),
    ("section179financing", "com", 4, 2, 2, 4, 5, "N", "Y", 2500, "T3", "HARD FILTER DEMO — digits. Also a tax-code term; verify before use."),
    ("commercial-lending", "com", 4, 2, 3, 4, 5, "N", "Y", 500, "T3", "HARD FILTER DEMO — hyphen. Auto-rejects."),

    # ---- TIER 4: brandables aimed at lenders and brokers themselves
    ("anvilcapital", "com", 4, 3, 4, 5, 5, "N", "N", 4000, "T4", "Industrial metaphor, fits equipment finance. Verify TM."),
    ("keelcapital", "com", 4, 3, 4, 4, 5, "N", "N", 3500, "T4", "Stability metaphor. Verify TM."),
    ("forgelending", "com", 4, 3, 4, 5, 5, "N", "N", 3500, "T4", "Industrial, credible for a lender."),
    ("quarrycapital", "com", 3, 2, 4, 4, 5, "N", "N", 3000, "T4", "Extraction/heavy-industry feel."),
    ("millcapital", "com", 3, 2, 5, 4, 5, "N", "N", 3000, "T4", "Short, industrial."),
    ("girdercapital", "com", 3, 2, 4, 4, 5, "N", "N", 2500, "T4", "Construction metaphor, slightly obscure."),
    ("axlecapital", "com", 3, 2, 4, 4, 5, "N", "N", 2800, "T4", "Fleet/trucking flavour."),
    ("torquelending", "com", 3, 2, 4, 4, 5, "N", "N", 2500, "T4", "Machinery flavour. Torque Capital Group exists — check TM."),
    ("bedrocklending", "com", 3, 2, 4, 5, 5, "Y", "N", 2500, "T4", "TM FLAG — Bedrock Capital is an existing firm. Marked Y to show the filter working."),
    ("lendcraft", "com", 4, 3, 5, 5, 5, "N", "N", 3500, "T4", "Coined but obvious. Good radio test."),
    ("capstack", "com", 4, 3, 5, 5, 5, "N", "N", 5000, "T4", "'Capital stack' is genuine finance vocabulary. Likely registered."),
    ("leaseflow", "com", 4, 3, 5, 5, 5, "N", "N", 3500, "T4", "SaaS-ish; could suit a lessor or a software buyer."),
    ("fundrig", "com", 3, 2, 5, 4, 5, "N", "N", 2000, "T4", "Short, oilfield/equipment flavour. Slightly odd."),
    ("assetly", "com", 3, 2, 5, 4, 5, "N", "N", 2500, "T4", "-ly brandable. Generic, crowded pattern."),
    ("ledgerlend", "com", 3, 2, 4, 4, 5, "N", "N", 2200, "T4", "Alliterative, a little clunky."),
]

wb = load_workbook(WB)
ws = wb["Candidates"]
FIRST = 5

for i, row in enumerate(C):
    r = FIRST + i
    name, ext, ci, cs, ln, rd, mg, tm, hy, est, tier, note = row
    for col, val in (("A", f"{name}.{ext}"), ("D", ci), ("E", cs), ("F", ln), ("G", rd),
                     ("H", tm), ("I", hy), ("J", None), ("K", None), ("L", None),
                     ("W", "Not yet"), ("X", f"[{tier}] {note}")):
        c = ws[f"{col}{r}"]
        c.value = val
        c.font = Font(name=FONT, size=10, color=BLUE)
        c.fill = NO_FILL
        if col in ("A", "X"):
            c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=(col == "X"))
        else:
            c.alignment = Alignment(horizontal="center", vertical="center")
    ws[f"L{r}"].number_format = '$#,##0;($#,##0);-'
    ws[f"K{r}"].number_format = '$#,##0;($#,##0);-'

# clear leftover example fill on any trailing rows
for r in range(FIRST + len(C), 85):
    for col in "ABCDEFGHIJKLMNOPQRSTUVWX":
        ws[f"{col}{r}"].fill = NO_FILL

ws["A2"] = (f"Niche 1: equipment financing & commercial lending — {len(C)} candidates. "
            "Est. Resale Value is deliberately EMPTY. The earlier version of this file filled it with "
            "unsourced guesses that ran 6-30x above independent valuations, and every downstream "
            "number inherited the error. Use BREAK-EVEN RESALE instead: it tells you what each name "
            "must be worth, with no estimate required.")
ws["A2"].font = Font(name=FONT, size=10, italic=True)

wb.save(WB)
print(f"wrote {len(C)} candidates")
