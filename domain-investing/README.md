# Domain Investing — Rubric & Portfolio Tracker

`domain-portfolio-tracker.xlsx` — a scoring rubric and carry-tracking model for buying and
reselling domain names on GoDaddy/Afternic.

## Why this exists

Domain investing has a specific failure mode: you pay renewals on every name you own, every
year, forever, but only ~2% of listed names sell in a given year. Portfolios die from carry,
not from bad picks. This workbook makes carry visible and refuses to let a name into the
portfolio unless its expected proceeds beat its expected carry.

## Tabs

| Tab | Purpose |
|---|---|
| **Start Here** | Usage notes and colour legend. |
| **Assumptions** | Commission rate, sell-through rate, holding horizon, renewal costs. Drives every calculation in the file. Set this first. |
| **Rubric** | Six weighted criteria scored 1–5, plus the extension lookup table, hard filters, and verdict thresholds. |
| **Candidates** | One row per name under consideration. Returns a weighted score, a max rational bid, and a verdict. |
| **Closeout Screener** | Expired names in GoDaddy's $11→$5 closeout window. Scores name quality and asset quality separately, then returns bid timing. |
| **Portfolio** | Names owned. Tracks cumulative renewal carry, total cost basis, and break-even list price. |
| **Sales Log** | Completed sales, net of commission. Feeds realised P&L. |
| **Dashboard** | Portfolio summary, realised results, sell-through, pipeline counts. |
| **Comps** | Published market benchmarks with sources, for calibrating the Comp Support score. |

## The scoring rubric

| Criterion | Weight |
|---|---|
| Commercial intent | 25% |
| Extension | 20% |
| Comp support | 20% |
| Length & memorability | 15% |
| Radio test | 10% |
| Acquisition margin | 10% |

**Hard filters** reject a name regardless of score: trademark risk, hyphens or digits, four or
more words, plural/singular confusion with an established site.

**Verdicts:** `BUY` (score ≥ 4.00 and cost ≤ max rational bid) · `BUY IF CHEAPER` (score ≥ 4.00,
priced above the max bid) · `WATCH` (3.20–3.99) · `PASS` (< 3.20) · `REJECT` (hard filter failed).

## The number that matters

```
Max Rational Bid = (Net proceeds after commission × P(sale within horizon)) − Total renewal carry
```

where `P(sale within horizon) = 1 − (1 − sell-through rate) ^ horizon years`.

At the default 2% annual sell-through over a 5-year horizon that probability is about 9.6% —
so a name you believe resells for $9,000 is worth roughly $690 in expected net proceeds, minus
$55 of carry. Pay more than the resulting figure and the name is negative expected value even
if your resale estimate is correct.

## The Closeout Screener

Two batches of 108 hand-picked names in the equipment finance niche returned **zero** that were
both available and within max rational bid — 80 taken, 21 premium-listed at 13x–1518x over, and
7 at registration price that all scored below the BUY bar. Retail channels do not clear the model.

Closeouts do. A closeout is a 5-day reverse auction on an expired name: **$11 on day one, falling
$1/day to $5**, plus renewal — roughly $16–22 all-in. Same money as a hand-registered leftover,
but the name carries age, backlinks, prior use, and sometimes traffic.

The tab scores two things and blends them (60/40 by default, editable):

- **Name quality** — extension 25%, commercial intent 40%, length 20%, radio test 15%
- **Asset quality** — domain age 25%, backlink quality 35%, prior use 25%, traffic 15%

Domain age scores automatically from the years column (<2 = 1, 2–4 = 2, 5–9 = 3, 10–14 = 4,
15+ = 5). Four hard filters reject outright: spam/penalty history, adult or gambling history,
trademark risk, hyphen or digit.

The output is a bid-timing instruction, because strong names never survive to the floor:

| Verdict | Combined score | Guidance |
|---|---|---|
| `BUY` | ≥ 4.00 | Take it on day 1 at $11 |
| `BUY CHEAPER` | 3.40–3.99 | Wait to ~$8 (day 3), walk if outbid |
| `FLOOR ONLY` | 2.80–3.39 | Only at the $5 floor |
| `SKIP` | < 2.80 | Pass |
| `OVERPRICED` | any | All-in cost exceeds max rational bid |
| `REJECT` | any | Hard filter failed |

## Defaults

Set on the Assumptions tab, all editable:

- Commission **20%** — Afternic Boost with GoDaddy aftermarket nameservers. Basic is 15%;
  without GoDaddy nameservers it is 25–30%. $15 minimum per sale.
- Sell-through **2%/year**, holding horizon **5 years**.
- Renewals default per extension from the Rubric tab's lookup (.com $11, .ai $90, .io $40…).
- Required return multiple **10x** on acquisition cost.

## What it does not do

It does not check domain availability — nothing in the file talks to a registry. Column A holds the
full domain (`name.com`), so select it, copy, and paste straight into GoDaddy's bulk search (500 at
a time), then record the result in the Availability column. The Ext column derives itself from
column A via a last-dot lookup — don't type into it.

It also deliberately ignores automated appraisals. The Comp Support criterion asks whether
comparable names have actually sold instead, which is the only valuation signal with a real
buyer behind it.

## Editing

The workbook is generated by `build_tracker.py`. Edit the script and re-run it to regenerate,
then recalculate so formula values are cached:

```bash
pip install openpyxl
python build_tracker.py
python recalc.py domain-portfolio-tracker.xlsx 480   # from the xlsx skill
```

Note that regenerating overwrites any data you have entered — once you start using the file for
real, edit the workbook directly rather than re-running the script.

## Sources

Market benchmarks on the Comps tab are drawn from published industry reporting:

- [DNJournal YTD Top 100 Sales Charts](https://www.dnjournal.com/ytd-sales-charts.htm)
- [NameBio sales database](https://namebio.com)
- [GoDaddy aftermarket commission model update](https://www.godaddy.com/resources/news/godaddy-aftermarket-alignment-commission-model-update)
- [Domavest — sell-through rate benchmarks](https://www.domavest.com/2026/03/what-is-good-domain-sell-through-rate.html)
- [Monefy — domain investing profitability analysis](https://www.monefy.com/article/domain-investing-profitability-data-backed-answer)

Figures were current as of August 2026. Re-check before relying on them.
