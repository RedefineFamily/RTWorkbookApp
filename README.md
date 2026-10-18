# RT Workbook App

- `index.html` — the Religious Trauma Recovery Workbook + chat. Pasted into the GoDaddy page at redefinefam.com/workbook. Talks to the Cloudflare Worker `religioustrauma` (religioustrauma.crystal-170.workers.dev).
- `assessment.html` — the 10-statement True/False assessment. Deployed by direct upload to Cloudflare as `frosty-boat-1c91` → https://frosty-boat-1c91.crystal-170.workers.dev/ (upload it as `index.html`). Kit landing page 9603430 redirects here with `#email={{ subscriber.email_address }}`.
- `worker-access-check.js` — drop-in for the `religioustrauma` Worker: admits Kit purchasers of product 293921 ($8 workbook) and anyone tagged `workbook-free`.

Funnel: Kit landing page → assessment (Cloudflare) → workbook (GoDaddy page + Worker). Strategy 1 free, Strategies 2–8 and chat $8 via Kit Commerce.
