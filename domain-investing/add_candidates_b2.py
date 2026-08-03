"""Batch 2 for the equipment financing / commercial lending niche.

Batch 1 showed the obvious constructions are fully claimed: every "vertical + financing"
and "word + capital/lending" name was taken or premium-listed, and the six still available
at registration price were the ones with real defects. Batch 2 therefore avoids both
patterns entirely and targets five less-mined spaces.
"""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"
FONT, BLUE = "Arial", "0000FF"
NO_FILL = PatternFill(fill_type=None)
FIRST = 61  # batch 1 occupies rows 5-60

# domain, CommercialIntent, CompSupport, Length, Radio, Margin, TM, Hyphen, EstResale, Pattern, Note
C = [
    # ---- P1: insider jargon. Buyers are lenders and brokers, not searchers. Least-mined space.
    ("creditbox.com", 4, 2, 5, 5, 5, "N", "N", 4000, "Jargon", "'Inside the credit box' is everyday underwriting speech. Not a consumer search term, so less likely mined."),
    ("residualvalue.com", 4, 2, 3, 5, 5, "N", "N", 3500, "Jargon", "Core equipment-lease concept — the whole economics of an FMV lease."),
    ("buyrate.com", 4, 2, 5, 5, 5, "N", "N", 3500, "Jargon", "The rate a funder quotes a broker. Pure industry vocabulary."),
    ("ticketsize.com", 3, 2, 4, 5, 5, "N", "N", 2500, "Jargon", "How the industry segments deals. Narrow but real."),
    ("capitalcall.com", 4, 3, 4, 5, 4, "N", "N", 6000, "Jargon", "Fund-finance term with a wider PE buyer pool than equipment alone."),
    ("nonrecourse.com", 4, 2, 4, 4, 4, "N", "N", 4000, "Jargon", "Financing structure term. Single compound word."),
    ("termloan.com", 4, 3, 5, 5, 3, "N", "N", 6000, "Jargon", "Clean product term, two short syllables."),
    ("creditline.com", 5, 3, 5, 5, 3, "N", "N", 12000, "Jargon", "Very high commercial intent. Expect taken."),
    ("originations.com", 4, 3, 4, 4, 4, "N", "N", 5000, "Jargon", "How lenders describe new business volume."),
    ("syndications.com", 3, 2, 3, 4, 4, "N", "N", 3000, "Jargon", "Lender syndication desks. Narrow institutional pool."),
    ("covenants.com", 3, 2, 4, 4, 4, "N", "N", 3500, "Jargon", "Loan covenants. Also has a religious reading — muddies intent."),
    ("stipsheet.com", 2, 1, 4, 3, 5, "N", "N", 1000, "Jargon", "'Stips' is deep insider slang. Too obscure — included to test the floor."),

    # ---- P2: verb and action constructions. Different grammar to batch 1's noun+noun.
    ("getfunded.com", 5, 3, 5, 5, 3, "N", "N", 8000, "Action", "Direct call to action, exactly what a borrower types. Expect taken."),
    ("getapproved.com", 4, 3, 5, 5, 3, "N", "N", 7000, "Action", "Same pattern, slightly broader than lending."),
    ("prequalify.com", 5, 3, 4, 5, 3, "N", "N", 10000, "Action", "Real lending-funnel term with very high intent. Expect taken."),
    ("fundfast.com", 4, 3, 5, 5, 5, "N", "N", 5000, "Action", "Speed is the actual selling point in commercial lending."),
    ("approvefast.com", 3, 2, 4, 5, 5, "N", "N", 2500, "Action", "Same idea, weaker word pairing."),
    ("leaseit.com", 4, 3, 5, 4, 3, "N", "N", 6000, "Action", "Short and punchy. 'it' is slightly weak when spoken."),
    ("borrowsmart.com", 3, 2, 4, 5, 5, "N", "N", 2200, "Action", "Generic advice framing rather than a product."),
    ("fundmyfleet.com", 3, 2, 3, 5, 5, "N", "N", 2000, "Action", "Three words, but alliterative and clear. Fleet is a real vertical."),

    # ---- P3: single-word industrial metaphors. No finance suffix at all.
    ("ballast.com", 3, 3, 5, 5, 2, "N", "N", 15000, "Metaphor", "Stability metaphor, clean dictionary word. Expect taken or expensive."),
    ("linchpin.com", 3, 3, 5, 4, 2, "N", "N", 8000, "Metaphor", "Strong business metaphor, broad appeal beyond lending."),
    ("ratchet.com", 3, 3, 5, 5, 2, "N", "N", 8000, "Metaphor", "Also a genuine PE structuring term. Dual meaning helps."),
    ("trestle.com", 3, 2, 5, 4, 3, "N", "N", 4000, "Metaphor", "Bridge structure. Quietly industrial."),
    ("gantry.com", 3, 2, 5, 4, 3, "N", "N", 4000, "Metaphor", "Crane gantry — directly evokes heavy equipment."),
    ("capstan.com", 3, 2, 5, 4, 4, "N", "N", 3000, "Metaphor", "Winch drum. Obscure to outsiders, evocative to insiders."),
    ("bollard.com", 2, 2, 5, 4, 4, "N", "N", 2000, "Metaphor", "Mooring post. Weak commercial connection."),
    ("crosstie.com", 2, 2, 4, 4, 5, "N", "N", 1500, "Metaphor", "Railroad tie. Obscure and hard to spell."),
    ("flywheel.com", 3, 3, 5, 5, 2, "Y", "N", 10000, "Metaphor", "TM FLAG — Flywheel is an established software brand."),
    ("fulcrum.com", 3, 3, 5, 5, 2, "Y", "N", 12000, "Metaphor", "TM FLAG — Fulcrum Capital and others already use this."),

    # ---- P4: coined portmanteau. Most likely to still be registrable.
    ("leasable.com", 3, 2, 5, 4, 5, "N", "N", 3000, "Coined", "Real adjective, rarely used. Spelling is a mild risk (leaseable)."),
    ("fundify.com", 3, 2, 5, 5, 5, "N", "N", 3000, "Coined", "-ify pattern. Crowded style but clean to say."),
    ("leasify.com", 3, 2, 5, 5, 5, "N", "N", 2800, "Coined", "Same pattern, closer to the niche."),
    ("lendly.com", 3, 2, 5, 5, 5, "N", "N", 3000, "Coined", "Short -ly brandable."),
    ("fundwise.com", 4, 3, 5, 5, 4, "N", "N", 4500, "Coined", "Reads credible and established. Likely taken."),
    ("fundpilot.com", 3, 2, 4, 5, 5, "N", "N", 2500, "Coined", "-pilot suffix suggests software as much as lending."),
    ("creditpilot.com", 3, 2, 4, 5, 5, "N", "N", 2500, "Coined", "Same."),
    ("lendable.com", 4, 3, 5, 5, 3, "Y", "N", 6000, "Coined", "TM FLAG — Lendable is an operating lender."),
    ("capitalize.com", 4, 3, 5, 5, 2, "Y", "N", 15000, "Coined", "TM FLAG — Capitalize is an existing fintech."),

    # ---- P5: lending-software flavour. Buyer is a fintech, not a lender.
    ("decisioning.com", 4, 3, 4, 4, 4, "N", "N", 6000, "Fintech", "Credit decisioning is the standard term for the software category."),
    ("originate.com", 4, 3, 5, 5, 2, "N", "N", 12000, "Fintech", "Single verb at the centre of lending. Expect taken."),
    ("servicing.com", 4, 3, 5, 5, 2, "N", "N", 10000, "Fintech", "Loan servicing — huge industry. Expect taken."),
    ("adjudicate.com", 3, 3, 4, 4, 3, "N", "N", 5000, "Fintech", "Credit adjudication. Also legal — broader buyer pool."),
    ("creditflow.com", 4, 3, 5, 5, 5, "N", "N", 4000, "Fintech", "Clean, software-flavoured, says what it does."),
    ("loanstack.com", 4, 3, 5, 5, 5, "N", "N", 3500, "Fintech", "'Stack' reads modern and technical."),
    ("riskdesk.com", 3, 2, 5, 5, 5, "N", "N", 3000, "Fintech", "Desk pattern applied to risk rather than funding."),
    ("amortize.com", 4, 3, 5, 4, 3, "N", "N", 6000, "Fintech", "Single verb, unambiguous finance meaning."),
    ("collateralize.com", 3, 2, 3, 4, 4, "N", "N", 2500, "Fintech", "Long, but precise and uncontested vocabulary."),
    ("dealflow.com", 4, 3, 5, 5, 2, "N", "N", 8000, "Fintech", "Widely used across PE, VC and lending. Expect taken."),
    ("loantape.com", 3, 2, 5, 4, 5, "N", "N", 2500, "Fintech", "A 'loan tape' is the loan-level data file in a portfolio sale."),
    ("paperwork.com", 3, 3, 5, 5, 2, "N", "N", 9000, "Fintech", "The thing every borrower hates. Broad, not lending-specific."),
    ("fundingapi.com", 3, 2, 4, 4, 5, "N", "N", 2000, "Fintech", "Embedded-lending angle. 'API' dates quickly."),
]

wb = load_workbook(WB)
ws = wb["Candidates"]

existing = {ws[f"A{r}"].value for r in range(5, FIRST) if ws[f"A{r}"].value}
dupes = sorted({d for d, *_ in C} & existing)
assert not dupes, f"batch 2 duplicates batch 1 rows: {dupes}"
assert len({d for d, *_ in C}) == len(C), "duplicate inside batch 2"
assert FIRST + len(C) - 1 <= 204, "batch 2 overruns the formula rows"

for i, (dom, ci, cs, ln, rd, mg, tm, hy, est, pat, note) in enumerate(C):
    r = FIRST + i
    for col, val in (("A", dom), ("D", ci), ("E", cs), ("F", ln), ("G", rd),
                     ("H", tm), ("I", hy), ("J", None), ("K", None), ("L", None),
                     ("W", "Not yet"), ("X", f"[B2/{pat}] {note}")):
        c = ws[f"{col}{r}"]
        c.value = val
        c.font = Font(name=FONT, size=10, color=BLUE)
        c.fill = NO_FILL
        if col in ("A", "X"):
            c.alignment = Alignment(horizontal="left", vertical="top", wrap_text=(col == "X"))
        else:
            c.alignment = Alignment(horizontal="center", vertical="center")
    ws[f"K{r}"].number_format = '$#,##0;($#,##0);-'
    ws[f"J{r}"].number_format = '$#,##0.00;($#,##0.00);-'

ws["A2"] = ("Niche 1: equipment financing & commercial lending. Batch 1 rows 5-60, batch 2 rows 61+. "
            "Est. Resale Value is empty by design — fill it only from a named source (HumbleWorth, "
            "NameBio comps, a real offer). Work from BREAK-EVEN RESALE until you have one.")
ws["A2"].font = Font(name=FONT, size=10, italic=True)

wb.save(WB)
print(f"batch 2: wrote {len(C)} candidates to rows {FIRST}-{FIRST+len(C)-1}")
