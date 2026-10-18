# RT Workbook App

- `index.html` — the Religious Trauma Recovery Workbook + chat. Pasted into the GoDaddy page at redefinefam.com/workbook. Talks to the Cloudflare Worker `religioustrauma` (religioustrauma.crystal-170.workers.dev).
- `assessment.html` — the 10-statement True/False assessment. Deployed automatically by Cloudflare Pages (project `rtworkbookapp`, branch `assessment`, output dir `site/`) → https://rtworkbookapp.pages.dev/. Every push to the branch redeploys. `site/index.html` is the copy Pages serves; keep it in sync with `assessment.html` (or just edit `site/index.html`). The old direct-upload worker `frosty-boat-1c91` can be deleted. Kit landing page 9603430 redirects here with `#email={{ subscriber.email_address }}`.
- `worker-access-check.js` — drop-in for the `religioustrauma` Worker: admits Kit purchasers of product 293921 ($8 workbook) and anyone tagged `workbook-free`.

Funnel: Kit landing page → assessment (Cloudflare) → workbook (GoDaddy page + Worker). Strategy 1 free, Strategies 2–8 and chat $8 via Kit Commerce.
