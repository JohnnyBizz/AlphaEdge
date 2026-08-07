"""Batch 5 — cannabis, .com only. Researched 2026-08-07.

Why .com and why now. The DOJ's final order of 23 April 2026 moved FDA-approved marijuana
products and qualifying state-licensed medical programs from Schedule I to Schedule III. The
practical consequence is 280E relief: a qualifying dispensary saves roughly $268,000 a year,
$1.6-2.2bn industry-wide. Cash that used to disappear into an unusable tax code is now
operating budget. The majors are real companies - Curaleaf $2.75bn, Trulieve $2.19bn, IIPR
$1.79bn, Green Thumb $1.56bn - and adult-use has produced nearly $25bn in state tax revenue
since 2014.

Two deliberate choices:

INDUSTRY VOCABULARY, NOT SLANG. Licensed operators brand as "cannabis" and "dispensary". They
are regulated businesses with compliance departments. "Ganja", "pot" and "weed" read
counterculture and mostly do not get bought by the people with budgets - the ganja.center
exercise showed where that ends up. "Weed" appears once here, and only because Weedmaps proves
a consumer-facing buyer exists.

B2B OVER CONSUMER. The ancillary layer - banking, compliance, real estate, insurance, testing -
is where the money and the domain budgets sit, and those buyers can advertise, bank and
transact normally in a way plant-touching operators still cannot everywhere.

Comp Support is scored 3 at most. The sector evidence is strong but I have no name-level .com
cannabis comps to cite, and inventing them is exactly the error this model was rebuilt to stop.
"""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"
FONT, BLUE = "Arial", "0000FF"
NO_FILL = PatternFill(fill_type=None)
FIRST = 205          # batches 1-4 occupy rows 5-204
LAST_ROW = 304

# domain, CommercialIntent, CompSupport, Length, Radio, TM, Hyphen, Group, Note
C = [
    # ---- COMPLIANCE & TAX. Newly urgent: rescheduling rewrites what operators must file.
    ("cannabiscompliance.com", 5, 3, 3, 5, "N", "N", "Compliance", "Every licensed operator has a compliance budget and no choice about it."),
    ("cannabistax.com", 5, 3, 4, 5, "N", "N", "Compliance", "280E relief just made cannabis tax the live question in the industry."),
    ("cannabislicensing.com", 5, 3, 3, 5, "N", "N", "Compliance", "Licence applications are consultant work at real hourly rates."),
    ("seedtosale.com", 5, 3, 4, 5, "N", "N", "Compliance", "The standard term for mandated track-and-trace. Software category."),
    ("cannabisaudit.com", 4, 2, 4, 5, "N", "N", "Compliance", "Follows compliance; narrower buyer pool."),
    ("dispensarycompliance.com", 4, 2, 2, 5, "N", "N", "Compliance", "Precise, and long at 24 characters."),
    ("cannabiscounsel.com", 4, 2, 3, 4, "N", "N", "Compliance", "Legal services. 'Counsel' is slightly formal spoken."),
    ("cannabisregulatory.com", 4, 2, 2, 4, "N", "N", "Compliance", "Consultancy framing, unwieldy length."),

    # ---- BANKING, PAYMENTS, CAPITAL. The industry's oldest unsolved problem, now moving.
    ("cannabisbanking.com", 5, 3, 3, 5, "N", "N", "Finance", "The single most-discussed pain point in the sector for a decade."),
    ("cannabispayments.com", 5, 3, 3, 5, "N", "N", "Finance", "Still largely cash. Whoever solves it needs the name."),
    ("cannabiscapital.com", 5, 3, 4, 5, "N", "N", "Finance", "Reads like a lender's own brand — same pattern that scored well in batch 1."),
    ("cannabislending.com", 5, 3, 3, 5, "N", "N", "Finance", "Operators are capital-starved because banks stayed away."),
    ("cannabisinsurance.com", 5, 3, 3, 5, "N", "N", "Finance", "Mandatory in licensed states, specialist underwriters, high premiums."),
    ("dispensarypos.com", 4, 2, 4, 4, "N", "N", "Finance", "Point of sale is a crowded but well-funded software category."),
    ("cannabismerchant.com", 4, 2, 3, 5, "N", "N", "Finance", "Merchant processing specifically."),
    ("cannabisescrow.com", 3, 2, 3, 4, "N", "N", "Finance", "M&A plumbing. Narrow."),

    # ---- REAL ESTATE & FACILITIES. IIPR alone is a $1.79bn REIT.
    ("cannabisrealestate.com", 5, 3, 2, 5, "N", "N", "Property", "IIPR proves institutional money is already in cannabis property."),
    ("cannabiszoning.com", 4, 2, 3, 5, "N", "N", "Property", "Zoning decides who can open where. Consultant work."),
    ("dispensaryrealty.com", 4, 2, 3, 4, "N", "N", "Property", "Retail siting specifically."),
    ("cultivationspace.com", 4, 2, 3, 5, "N", "N", "Property", "Grow facilities are the capital-heavy end."),
    ("growfacility.com", 4, 2, 4, 5, "N", "N", "Property", "Shorter, and reads industrial rather than counterculture."),

    # ---- SUPPLY CHAIN, TESTING, SERVICES
    ("cannabistesting.com", 5, 3, 3, 5, "N", "N", "Services", "Lab testing is legally mandated in every regulated state."),
    ("cannabislab.com", 5, 3, 4, 5, "N", "N", "Services", "Shorter version of the same. Better radio test."),
    ("cannabislogistics.com", 4, 2, 3, 5, "N", "N", "Services", "Transport is licensed and specialised."),
    ("cannabisdistribution.com", 4, 2, 2, 5, "N", "N", "Services", "A distinct licence class in several states. Long."),
    ("cannabiswholesale.com", 4, 2, 3, 5, "N", "N", "Services", "B2B flower and product trade."),
    ("cannabispackaging.com", 5, 3, 3, 5, "N", "N", "Services", "Child-resistant packaging is a legal requirement and a real industry."),
    ("cannabisstaffing.com", 4, 2, 3, 5, "N", "N", "Services", "High-turnover sector, recurring recruiter spend."),
    ("cannabissecurity.com", 4, 2, 3, 5, "N", "N", "Services", "Vaults, transport and surveillance are licence conditions."),
    ("terpenelab.com", 3, 2, 4, 4, "N", "N", "Services", "Terpene profiling. Insider, narrow."),
    ("cannabissoftware.com", 4, 3, 3, 5, "N", "N", "Services", "Umbrella term for the whole ancillary software layer."),

    # ---- RETAIL & CONSUMER. Weedmaps proves a consumer buyer exists at scale.
    ("dispensarymenu.com", 5, 3, 3, 5, "N", "N", "Retail", "Menu syndication is precisely what Weedmaps monetises."),
    ("dispensaryfinder.com", 4, 2, 3, 5, "N", "N", "Retail", "Directory play. Crowded but proven."),
    ("cannabisdelivery.com", 5, 3, 3, 5, "N", "N", "Retail", "Delivery is the fastest-growing retail channel where it is legal."),
    ("weeddelivery.com", 4, 3, 4, 5, "N", "N", "Retail", "The one slang term included — consumers genuinely search it."),
    ("cannabisretail.com", 4, 3, 3, 5, "N", "N", "Retail", "Broad and institutional."),
    ("dispensarygroup.com", 4, 2, 3, 5, "N", "N", "Retail", "Reads like an MSO's own holding-company name."),
    ("craftcannabis.com", 4, 3, 4, 5, "N", "N", "Retail", "The premium-positioning term, mirroring craft beer."),
    ("sungrown.com", 4, 3, 5, 5, "N", "N", "Retail", "Outdoor-grown premium. One word, clean, real industry term."),
    ("prerolls.com", 4, 3, 5, 5, "N", "N", "Retail", "The single biggest-growth product format. Plural is a mild risk."),
    ("cannabisbrands.com", 4, 3, 3, 5, "N", "N", "Retail", "Brand houses are consolidating; natural fit."),

    # ---- CULTIVATION
    ("cannabiscultivation.com", 4, 2, 2, 5, "N", "N", "Cultivation", "Formal term for growing. Long."),
    ("cannabisnutrients.com", 4, 2, 3, 5, "N", "N", "Cultivation", "Consumables with genuine repeat purchase."),
    ("cannabisgenetics.com", 4, 2, 3, 5, "N", "N", "Cultivation", "Seeds and clones — the input everything else depends on."),
    ("indoorgrow.com", 4, 2, 4, 5, "N", "N", "Cultivation", "Broad enough to sell outside cannabis too, which widens the pool."),
    ("growroom.com", 4, 3, 5, 5, "N", "N", "Cultivation", "Short, two syllables, equipment-retail friendly."),
    ("cannabisequipment.com", 4, 2, 2, 5, "N", "N", "Cultivation", "Ties back to the equipment-finance thesis from batch 1."),

    # ---- HEMP / CANNABINOID ADJACENT. Legal footing differs from marijuana — verify per state.
    ("hempcompliance.com", 4, 2, 3, 5, "N", "N", "Hemp", "Hemp is federally legal and separately regulated. Real compliance need."),
    ("hempderived.com", 4, 2, 3, 5, "N", "N", "Hemp", "The phrase that carries the whole THCA/delta market."),
    ("cannabinoidlab.com", 3, 2, 3, 4, "N", "N", "Hemp", "Testing for the hemp side."),
    ("thcaflower.com", 3, 2, 4, 3, "N", "N", "Hemp", "Live but legally contested category. 'THCA' fails the radio test badly."),

    # ---- CORPORATE / MSO FLAVOUR
    ("cannabisholdings.com", 4, 2, 3, 5, "N", "N", "Corporate", "Holding-company name for a multi-state operator."),
    ("cannabisventures.com", 4, 2, 3, 5, "N", "N", "Corporate", "Investment vehicle framing."),
    ("cannabisadvisors.com", 4, 2, 3, 5, "N", "N", "Corporate", "Consulting. Crowded pattern."),
    ("dispensarypartners.com", 4, 2, 2, 5, "N", "N", "Corporate", "Roll-up framing. Long."),

    # ---- TRADEMARK CONTROLS, included so the filter is visible
    ("canopyspace.com", 3, 2, 4, 5, "Y", "N", "Corporate", "TM FLAG — Canopy Growth is a major listed operator."),
    ("curaleafrealty.com", 3, 1, 2, 4, "Y", "N", "Corporate", "TM FLAG — Curaleaf, $2.75bn market cap. Never buy this."),
]

wb = load_workbook(WB)
ws = wb["Candidates"]

existing = {ws[f"A{r}"].value for r in range(5, FIRST) if ws[f"A{r}"].value}
dupes = sorted({d for d, *_ in C} & existing)
assert not dupes, f"batch 5 duplicates an earlier row: {dupes}"
assert len({d for d, *_ in C}) == len(C), "duplicate inside batch 5"
assert FIRST + len(C) - 1 <= LAST_ROW, (
    f"batch 5 needs rows {FIRST}-{FIRST+len(C)-1} but formulas stop at {LAST_ROW}")

for i, (dom, ci, cs, ln, rd, tm, hy, grp, note) in enumerate(C):
    r = FIRST + i
    for col, val in (("A", dom), ("D", ci), ("E", cs), ("F", ln), ("G", rd),
                     ("H", tm), ("I", hy), ("J", None), ("K", None), ("L", None),
                     ("W", "Not yet"), ("X", f"[B5/{grp}] {note}")):
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

wb.save(WB)
print(f"batch 5: wrote {len(C)} candidates to rows {FIRST}-{FIRST+len(C)-1}")
print(f"formula rows remaining: {LAST_ROW - (FIRST + len(C) - 1)}")
