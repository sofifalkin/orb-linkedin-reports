# Orbisk LinkedIn Reports

Monthly LinkedIn metrics reporting system for [Orbisk](https://orbisk.com) — B2B food waste AI.

## Structure

```
reports/
  monthly/       # Monthly company page HTML reports
  founders/      # Founder post tracking reports (Olaf van der Veen, Anastasia Dellis)
data/
  raw/           # Raw CSV exports from LinkedIn Analytics
  processed/     # JSON files derived from raw data
scripts/         # Node.js scripts for CSV → JSON processing
assets/
  css/           # Shared stylesheets
  js/            # Shared chart/UI scripts
  images/        # Logos, icons
```

## Report Types

| Report | Description |
|--------|-------------|
| Monthly company report | Followers, impressions, engagement, top posts |
| Founder post tracker | Per-post metrics for Olaf van der Veen & Anastasia Dellis |
| Ambassador benchmark *(planned)* | Creator/ambassador performance comparison |

## Usage

Open any `.html` file in `reports/` directly in a browser — no build step needed.

For CSV processing:
```bash
node scripts/process-csv.js data/raw/<file>.csv
```
