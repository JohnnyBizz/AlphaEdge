"""Rebuild the workbook from scratch, in order. Every figure in the file comes from these steps."""
import subprocess, sys, pathlib
HERE = pathlib.Path(__file__).parent
STEPS = [
    "build_tracker.py",          # base workbook; wipes everything, so it must come first
    "add_candidates.py",         # batch 1  rows 5-60
    "apply_availability.py",     # batch 1 GoDaddy results
    "add_candidates_b2.py",      # batch 2  rows 61-112
    "apply_availability_b2.py",  # batch 2 GoDaddy results
    "add_candidates_b3.py",      # batch 3  rows 113-165
    "add_candidates_b4.py",      # batch 4  rows 166-204
    "apply_valuations.py",       # sourced valuations only
    "add_closeout_screener.py",
    "add_market_frequency.py",
]
for step in STEPS:
    print(f"--- {step}")
    r = subprocess.run([sys.executable, str(HERE / step)], capture_output=True, text=True)
    print(r.stdout.strip() or r.stderr.strip())
    if r.returncode:
        sys.exit(f"FAILED at {step}")
print("--- chain complete; run recalc.py next")
