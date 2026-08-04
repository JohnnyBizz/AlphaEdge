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
| **Market Frequency** | How often domains sell and at what prices, with a calibrator that converts a break-even into a percentile. Sourced. |

## The scoring rubric

| Criterion | Weight |
|---|---|
| Commercial intent | 30% |
| Extension | 22% |
| Comp support | 22% |
| Length & memorability | 16% |
| Radio test | 10% |

("Acquisition margin" was removed — the Value Ratio does that job properly, against a real price.)

**Hard filters** reject a name regardless of score: trademark risk, hyphens or digits, four or
more words, plural/singular confusion with an established site.

**Verdicts:** `BUY` (Value Ratio ≥ safety multiple) · `MARGINAL` (ratio 1.0–2.0) ·
`PASS` (ratio < 1.0) · `NEEDS PRICE` / `NEEDS VALUATION` (missing input) ·
`REJECT` (hard filter failed).

## The number that matters: BREAK-EVEN RESALE

The first version of this model asked you to estimate what a name was worth, then compared that
to its price. That put a guess on the critical path, and the guesses were wrong — populated
estimates ran **6–30x above** independent valuations, and since Est. Resale Value drives
Max Rational Bid, Margin and Verdict, every downstream number inherited the error.

The model now inverts the question. Instead of guessing a value, it computes what a name
**would have to be worth**:

```
Break-even Resale = (Acquisition Cost + Carry) ÷ (P(sale) × (1 − commission))
```

You need no estimate to use it. A `.com` at $22.99 with $55 of carry must resell for roughly
**$920** just to break even — so the only question is whether the name is plausibly a
four-figure name. For `brewingfinancing.com`, independently valued at $59–$285, it plainly
isn't: Value Ratio 0.31x, verdict `PASS`.

**Est. Resale Value now requires a Valuation Source.** A number without one returns
`NEEDS VALUATION` rather than silently propagating.

### P(sale) scales with quality

Previously every name got the same 9.6% probability regardless of score, so name quality drove
the score but had **zero** effect on the economics. That was incoherent. Now:

```
Effective annual rate = base sell-through × (score ÷ pivot) ^ sensitivity
```

At the default pivot 3.0 and sensitivity 1.0 the relationship is linear — a 4.5 name is assumed
to sell 1.5x as often as a 3.0 name. **This is a modelling assumption, not measured data.**
Set sensitivity to 0 on the Assumptions tab to switch it off and revert to a flat rate.

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

## Market frequency — the reality check

Sourced on the Market Frequency tab, from 480,667 .com sales (Jan 2024 – May 2026):

| Price band | Share of sales | Clears this floor |
|---|---|---|
| Under $100 | 30.5% (derived) | 100% |
| $100 – $999 | 56.5% (median $255) | 69.5% |
| $1,000 – $9,999 | 12.4% | 13.0% |
| $10,000 – $99,999 | 0.6% | 0.64% |
| $100,000+ | 0.04% (198 sales in 28 months) | 0.04% |

**87% of .com sales close under $1,000.** Median .com sale is $818; Sedo's all-TLD median is $549.
Volume runs roughly 700 sales/day above $100, plus ~3x that below it.

The tab includes a calibrator: enter a break-even and it log-interpolates what share of sales
clear it. A $700 break-even sits at **21.8% — roughly one sale in 4.6**. So the name has to sell
*and* fetch an above-median price. Two independent things.

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

On appraisals: automated valuations (GoDaddy's, HumbleWorth's) are estimates, not evidence, and
a marketplace asking price is neither — it is what a seller hopes for. But an unsourced number
of your own is worse than any of them. The rule the file enforces is that every valuation names
its origin, so you can weigh it later.

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
