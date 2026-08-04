"""Batch 3 — emerging-category names, researched 2026-08-04.

Batches 1 and 2 mined a mature niche and found it picked clean. Batch 3 goes the other way:
categories that did not exist two years ago, where the naming space is still forming and the
buyers are companies being founded right now.

Deliberately EXCLUDED: viral slang itself. skibidi, rizz, gyatt, delulu, sigma and the rest are
worthless as domains - no business buys them, and the words die inside a year. What is worth
owning is the commercial vocabulary that forms AROUND a viral moment. "Clanker" is a joke;
"slop detection" is a product category businesses will pay for.

Evidence anchor: AgenticIntelligence.com sold for $150,000 in 2026, and reported investor focus
is on the keywords intelligence, agent, model, labs, vision, automation, gen, core, plus
action words - doer, solver, forge, flow, pilot, craft.

Risk to keep in view: these are bets on vocabulary surviving. If the industry settles on "AEO"
and drops "GEO", the GEO names are dead. That is the trade - higher upside than a mature niche,
with a real chance of going to zero.
"""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"
FONT, BLUE = "Arial", "0000FF"
NO_FILL = PatternFill(fill_type=None)
FIRST = 113  # batches 1-2 occupy rows 5-112
LAST_ROW = 204

# domain, CommercialIntent, CompSupport, Length, Radio, TM, Hyphen, Theme, Note
C = [
    # ---- AGENTIC AI INFRASTRUCTURE. The one theme here with a hard comp behind it.
    ("agentswarm.com", 5, 4, 5, 5, "N", "N", "Agentic", "'Agent swarms' is established 2026 vocabulary for multi-agent systems."),
    ("agentmesh.com", 5, 4, 5, 5, "N", "N", "Agentic", "Infrastructure framing. Mesh is standard networking vocabulary."),
    ("agentstack.com", 5, 4, 5, 5, "N", "N", "Agentic", "'Stack' is how every infra company describes itself."),
    ("agentops.com", 5, 4, 5, 5, "N", "N", "Agentic", "The ops discipline for running agents in production. DevOps/MLOps lineage."),
    ("agentregistry.com", 4, 3, 4, 5, "N", "N", "Agentic", "Agent discovery is an unsolved problem; A2A protocol needs registries."),
    ("agentidentity.com", 5, 3, 4, 5, "N", "N", "Agentic", "Who is this agent and may it act? Genuine unsolved commercial problem."),
    ("agenttrust.com", 5, 3, 5, 5, "N", "N", "Agentic", "Same problem, shorter and more brandable."),
    ("agentaudit.com", 4, 3, 5, 5, "N", "N", "Agentic", "Compliance follows capability. Audit trails for autonomous action."),
    ("agentpayments.com", 5, 3, 4, 5, "N", "N", "Agentic", "Agents transacting is a live 2026 problem with huge money behind it."),
    ("agentgovernance.com", 4, 3, 3, 4, "N", "N", "Agentic", "Enterprise buyers. Long, but precise."),
    ("swarmops.com", 4, 3, 5, 5, "N", "N", "Agentic", "Tighter than agentswarm, slightly more obscure."),
    ("humanintheloop.com", 4, 3, 3, 5, "N", "N", "Agentic", "Established term, three words. Real category in AI oversight."),
    ("agenticops.com", 4, 3, 4, 4, "N", "N", "Agentic", "Rides the exact adjective that carried a $150k sale."),
    ("agentbench.com", 4, 3, 5, 5, "N", "N", "Agentic", "Benchmarking agents. Evaluation is a real spend category."),

    # ---- GEO / AEO. Brand-new industry, agencies and platforms forming right now.
    ("answerengine.com", 5, 3, 4, 5, "N", "N", "GEO", "The category noun itself. Expect taken or expensive."),
    ("aivisibility.com", 5, 3, 4, 5, "N", "N", "GEO", "Exactly what the GEO platforms sell. Semrush ships a toolkit by this name."),
    ("llmvisibility.com", 4, 3, 4, 4, "N", "N", "GEO", "Same, narrower and more technical."),
    ("citationrank.com", 4, 2, 4, 5, "N", "N", "GEO", "Getting cited by the model is the new ranking. Coins the metric."),
    ("promptrank.com", 4, 2, 5, 5, "N", "N", "GEO", "Same idea, catchier."),
    ("answerrank.com", 4, 2, 5, 5, "N", "N", "GEO", "Same idea again — one of these three should be free."),
    ("geoaudit.com", 4, 2, 5, 4, "N", "N", "GEO", "Agency deliverable. 'GEO' collides with geography — real ambiguity risk."),
    ("modelvisibility.com", 4, 2, 3, 4, "N", "N", "GEO", "Clearer than 'GEO', longer."),
    ("shareofmodel.com", 4, 2, 3, 4, "N", "N", "GEO", "Riffs on 'share of voice' — the metric this industry needs."),
    ("aicitations.com", 4, 2, 4, 4, "N", "N", "GEO", "Plain description of the deliverable."),
    ("brandinai.com", 4, 2, 4, 4, "N", "N", "GEO", "How does my brand appear inside AI answers. Slightly awkward spoken."),

    # ---- SLOP ECONOMY. The viral term is worthless; the product category around it is not.
    ("slopdetector.com", 4, 2, 4, 5, "N", "N", "Slop", "slopdetector.ORG already exists as a live site — the .com is the upgrade path."),
    ("slopfilter.com", 4, 2, 5, 5, "N", "N", "Slop", "Filtering AI content is a product people will pay for."),
    ("slopcheck.com", 4, 2, 5, 5, "N", "N", "Slop", "Short, clear, verb-like."),
    ("slopscore.com", 4, 2, 5, 5, "N", "N", "Slop", "Coins a metric. Metrics get licensed."),
    ("antislop.com", 3, 2, 5, 5, "N", "N", "Slop", "Movement framing rather than product."),
    ("workslop.com", 3, 2, 5, 5, "N", "N", "Slop", "Coined 2025-26 for AI-generated workplace filler. Narrow but current."),
    ("humanverified.com", 5, 3, 4, 5, "N", "N", "Slop", "The positive framing, and the more durable one — provenance outlives the slang."),
    ("provenhuman.com", 5, 3, 5, 5, "N", "N", "Slop", "Same idea, punchier. My pick of this group."),
    ("humanmade.com", 4, 3, 5, 5, "N", "N", "Slop", "Broadest of the provenance names; likely long taken."),
    ("madebyhumans.com", 4, 2, 4, 5, "N", "N", "Slop", "Certification-mark framing."),
    ("contentprovenance.com", 4, 3, 3, 4, "N", "N", "Slop", "The formal industry term (C2PA lineage). Enterprise buyer."),

    # ---- LONGEVITY / HEALTHSPAN. $6.8T wellness market; anti-aging alone >$120B by 2030.
    ("healthspanlab.com", 4, 3, 4, 5, "N", "N", "Longevity", "'Healthspan' is displacing 'lifespan' as the commercial term."),
    ("healthspanscore.com", 4, 3, 3, 5, "N", "N", "Longevity", "Metric framing again."),
    ("longevityclinic.com", 5, 3, 3, 5, "N", "N", "Longevity", "Literal business type, high customer value. Expect taken."),
    ("longevityresidences.com", 4, 2, 2, 4, "N", "N", "Longevity", "Named as an emerging wellness-real-estate category for 2026. Long."),
    ("biomarkerlab.com", 4, 3, 4, 5, "N", "N", "Longevity", "Consumer biomarker testing is scaling fast."),
    ("microplastictest.com", 4, 2, 3, 4, "N", "N", "Longevity", "Microplastics are forecast to become a routinely measured marker."),
    ("ovarianage.com", 4, 2, 4, 4, "N", "N", "Longevity", "Women's healthspan and ovarian aging is a specifically flagged 2026 frontier."),
    ("glp1clinic.com", 4, 3, 4, 4, "N", "Y", "Longevity", "HARD FILTER — contains a digit. Real category, unusable name."),
    ("healthspanindex.com", 3, 2, 3, 4, "N", "N", "Longevity", "Index framing, weaker than score."),

    # ---- CREATOR ECONOMY, MATURED. 45% of Gen Z/millennials self-identify as creators.
    ("creatorstack.com", 4, 3, 5, 5, "N", "N", "Creator", "Tooling framing for a saturating market."),
    ("creatorops.com", 4, 3, 5, 5, "N", "N", "Creator", "Ops discipline for creator businesses."),
    ("creatorpayouts.com", 4, 2, 3, 5, "N", "N", "Creator", "Payments is where creator-economy money actually is."),
    ("creatortax.com", 4, 2, 5, 5, "N", "N", "Creator", "Boring, unglamorous, genuinely needed — usually a good sign."),
    ("brandsafety.com", 4, 3, 4, 5, "N", "N", "Creator", "Long-standing adtech term, broader than creators. Expect taken."),

    # ---- DELIBERATE CONTROLS. Pure viral slang, included to prove the point.
    ("clanker.com", 2, 1, 5, 5, "N", "N", "Control", "CONTROL — viral anti-AI slur, huge volume, no commercial buyer. Expect a low score and a bad break-even."),
    ("skibidi.com", 1, 1, 5, 4, "N", "N", "Control", "CONTROL — peak brainrot slang. Zero business use."),
    ("delulu.com", 1, 1, 5, 5, "N", "N", "Control", "CONTROL — same. Included so you can see the model reject it."),
]

wb = load_workbook(WB)
ws = wb["Candidates"]

existing = {ws[f"A{r}"].value for r in range(5, FIRST) if ws[f"A{r}"].value}
dupes = sorted({d for d, *_ in C} & existing)
assert not dupes, f"batch 3 duplicates an earlier row: {dupes}"
assert len({d for d, *_ in C}) == len(C), "duplicate inside batch 3"
assert FIRST + len(C) - 1 <= LAST_ROW, "batch 3 overruns the formula rows"

for i, (dom, ci, cs, ln, rd, tm, hy, theme, note) in enumerate(C):
    r = FIRST + i
    for col, val in (("A", dom), ("D", ci), ("E", cs), ("F", ln), ("G", rd),
                     ("H", tm), ("I", hy), ("J", None), ("K", None), ("L", None),
                     ("W", "Not yet"), ("X", f"[B3/{theme}] {note}")):
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

ws["A2"] = ("Rows 5-112: equipment finance, checked 2026-08-03 — a mature niche, nothing clearing. "
            "Rows 113+: batch 3, emerging categories researched 2026-08-04 (agentic AI, GEO/AEO, "
            "slop provenance, longevity, creator economy) plus three viral-slang controls. "
            "Est. Resale Value stays EMPTY until you have a sourced number; work from BREAK-EVEN "
            "RESALE, which needs no estimate.")
ws["A2"].font = Font(name=FONT, size=10, italic=True)

wb.save(WB)
print(f"batch 3: wrote {len(C)} candidates to rows {FIRST}-{FIRST+len(C)-1}")
