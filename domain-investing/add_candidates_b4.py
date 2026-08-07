"""Batch 4 — agentic AI, focused. Researched 2026-08-04.

This is the only theme in the file with a real price band behind it:

    AgenticIntelligence.com   $150,000   Afternic 2026 (registered 2023)
    AgenticAi.com             $120,000   Spaceship, May 2025
    AgenticIndustry.com         $6,400   2026

Read the third one carefully. It is the honest comp. "Agentic + noun" is a proven pattern with
buyers, but the median outcome looks like $6,400, not $150,000 - the headline sales are
category-defining words, and there are only a handful of those. At a break-even around $700 for
a high-scoring name, a $6,400 outcome still clears comfortably, which is the actual case for
this batch. Do not underwrite it at $150k.

Vocabulary is taken from the 2026 protocol stack rather than invented: MCP (agent-to-tool, now
under the Linux Foundation's Agentic AI Foundation), A2A (agent-to-agent), ACP and WebMCP;
plus the live commercial problems - autonomous machine-to-machine payments (Stripe, Coinbase),
agent identity and permissioning, orchestration, evals and observability.

Excludes the 14 agent* names already in batch 3.
"""

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Alignment

WB = "/home/user/AlphaEdge/domain-investing/domain-portfolio-tracker.xlsx"
FONT, BLUE = "Arial", "0000FF"
NO_FILL = PatternFill(fill_type=None)
FIRST = 166  # batches 1-3 occupy rows 5-165
LAST_ROW = 304

# domain, CommercialIntent, CompSupport, Length, Radio, TM, Hyphen, Group, Note
C = [
    # ---- THE PROVEN PATTERN: "agentic + noun". Comp Support 4-5 is earned here, not guessed.
    ("agenticcommerce.com", 5, 5, 4, 5, "N", "N", "Agentic+", "Agents transacting is the biggest live commercial problem in the space. Closest in kind to the $150k sale."),
    ("agenticpayments.com", 5, 5, 4, 5, "N", "N", "Agentic+", "Stripe and Coinbase are both shipping machine-to-machine payment rails."),
    ("agenticsecurity.com", 5, 5, 4, 5, "N", "N", "Agentic+", "Autonomy creates the attack surface; a named 2026 problem after the ChatGPT agent hack."),
    ("agenticfinance.com", 5, 4, 4, 5, "N", "N", "Agentic+", "Vertical compound, high-value buyer pool."),
    ("agenticworkflows.com", 5, 4, 3, 5, "N", "N", "Agentic+", "Orchestration is the layer where Cognition and AnySphere are valued in the billions."),
    ("agenticsystems.com", 4, 4, 4, 5, "N", "N", "Agentic+", "Broad and institutional. Reads like a consultancy or a platform."),
    ("agenticcloud.com", 4, 4, 4, 5, "N", "N", "Agentic+", "Infrastructure framing."),
    ("agenticdata.com", 4, 4, 5, 5, "N", "N", "Agentic+", "Short, clean, obvious enterprise buyer."),
    ("agenticcore.com", 4, 4, 5, 5, "N", "N", "Agentic+", "'Core' is on the reported 2026 investor keyword list."),
    ("agenticlabs.com", 4, 4, 5, 5, "N", "N", "Agentic+", "'Labs' is likewise on that list, and reads as a company name."),
    ("agenticnetwork.com", 4, 4, 4, 5, "N", "N", "Agentic+", "Fits the A2A interoperability story."),
    ("agenticsearch.com", 4, 4, 4, 5, "N", "N", "Agentic+", "Perplexity at $9B makes this a live category."),
    ("agentichealth.com", 4, 4, 4, 5, "N", "N", "Agentic+", "Vertical compound into the highest-value sector there is."),
    ("agenticretail.com", 4, 4, 4, 5, "N", "N", "Agentic+", "Vertical compound, clear buyer."),
    ("agenticenterprise.com", 4, 4, 3, 4, "N", "N", "Agentic+", "Enterprise framing, slightly long."),
    ("agenticinfrastructure.com", 4, 4, 2, 4, "N", "N", "Agentic+", "Precise but 21 characters. Length is the weakness."),

    # ---- PROTOCOL AND INTEROP LAYER. MCP/A2A vocabulary, now Linux Foundation governed.
    ("agentprotocol.com", 5, 3, 4, 5, "N", "N", "Protocol", "The generic term above MCP/A2A/ACP. Strong if any of them converge."),
    ("agentgateway.com", 5, 3, 4, 5, "N", "N", "Protocol", "Gateways are where agent traffic gets controlled and billed."),
    ("agentrouter.com", 4, 3, 5, 5, "N", "N", "Protocol", "Same layer, shorter."),
    ("agentbroker.com", 4, 3, 5, 5, "N", "N", "Protocol", "Brokering between agents — the A2A middle."),
    ("agentdirectory.com", 4, 3, 4, 5, "N", "N", "Protocol", "Agent discovery is genuinely unsolved."),
    ("agentinterop.com", 4, 3, 4, 4, "N", "N", "Protocol", "Exact word the standards bodies use. 'Interop' is jargon-y spoken."),
    ("contextprotocol.com", 4, 3, 3, 4, "N", "N", "Protocol", "Adjacent to Anthropic's Model Context Protocol. Open standard, not a brand — but check before relying on the association."),

    # ---- AGENT COMMERCE AND PAYMENTS. Startups raising specifically to build these rails.
    ("agentcommerce.com", 5, 4, 4, 5, "N", "N", "Payments", "Non-'agentic' variant of the top pick; likely gone, worth testing."),
    ("agentwallet.com", 5, 3, 5, 5, "N", "N", "Payments", "An agent needs somewhere to hold funds. Concrete and short."),
    ("agentcheckout.com", 4, 3, 4, 5, "N", "N", "Payments", "The merchant side of the same problem."),
    ("machinepayments.com", 4, 3, 4, 5, "N", "N", "Payments", "M2M framing — survives even if 'agent' falls out of fashion."),
    ("autonomouspayments.com", 4, 3, 2, 4, "N", "N", "Payments", "Precise, and the longest name here."),
    ("agentspend.com", 4, 3, 5, 5, "N", "N", "Payments", "Spend management for agents. Reads like a real SaaS."),

    # ---- SECURITY, IDENTITY, PERMISSIONING. The named unsolved problem of 2026.
    ("agentsecurity.com", 5, 4, 4, 5, "N", "N", "Security", "Plainest statement of the category."),
    ("agentguard.com", 4, 3, 5, 5, "N", "N", "Security", "Product-shaped and brandable."),
    ("agentfirewall.com", 4, 3, 4, 5, "N", "N", "Security", "Borrowed metaphor that enterprise buyers already understand."),
    ("agentsandbox.com", 4, 3, 4, 5, "N", "N", "Security", "Sandboxing is how you actually contain an agent."),
    ("agentpermissions.com", 4, 3, 3, 5, "N", "N", "Security", "The authorisation half of agent identity."),
    ("agentconsent.com", 3, 2, 4, 4, "N", "N", "Security", "Narrower, more legal-flavoured."),

    # ---- OPS, EVALS, MEMORY. Where the money goes once agents are in production.
    ("agentmemory.com", 5, 3, 4, 5, "N", "N", "AgentOps", "Memory is the hardest unsolved piece of agent design."),
    ("agentevals.com", 4, 3, 5, 4, "N", "N", "AgentOps", "Evaluation is a real budget line. 'Evals' is insider but universal in the field."),
    ("agentobservability.com", 4, 3, 2, 4, "N", "N", "AgentOps", "Exact enterprise term, punishingly long."),
    ("contextengineering.com", 4, 3, 3, 5, "N", "N", "AgentOps", "Has largely replaced 'prompt engineering' as the serious term."),
]

wb = load_workbook(WB)
ws = wb["Candidates"]

existing = {ws[f"A{r}"].value for r in range(5, FIRST) if ws[f"A{r}"].value}
dupes = sorted({d for d, *_ in C} & existing)
assert not dupes, f"batch 4 duplicates an earlier row: {dupes}"
assert len({d for d, *_ in C}) == len(C), "duplicate inside batch 4"
assert FIRST + len(C) - 1 <= LAST_ROW, (
    f"batch 4 needs rows {FIRST}-{FIRST+len(C)-1} but formulas stop at {LAST_ROW}")

for i, (dom, ci, cs, ln, rd, tm, hy, grp, note) in enumerate(C):
    r = FIRST + i
    for col, val in (("A", dom), ("D", ci), ("E", cs), ("F", ln), ("G", rd),
                     ("H", tm), ("I", hy), ("J", None), ("K", None), ("L", None),
                     ("W", "Not yet"), ("X", f"[B4/{grp}] {note}")):
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
print(f"batch 4: wrote {len(C)} candidates to rows {FIRST}-{FIRST+len(C)-1}")
print(f"formula rows remaining after this batch: {LAST_ROW - (FIRST + len(C) - 1)}")
