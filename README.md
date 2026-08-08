# Biomining & Biometallurgy Laboratory — V11

GitHub Pages source: **`/docs`** on the **`main`** branch.

## Easy replacement
To replace the visible website later, delete the `docs` folder and upload the new `docs` folder. Keep `.github/workflows/` if you want publication auto-updates to continue.

## Publication system
The homepage shows only the latest 8 publications so the section stays clean. The search box searches the **entire locally indexed catalogue**, not only the 8 visible records.

The updater runs every 6 hours and also runs once when the updater files are first pushed. It attempts, in order:

1. Google Scholar via SerpApi when `SERPAPI_KEY` exists, with pagination beyond the first 100 results.
2. Direct Google Scholar profile access when no SerpApi key is configured (best effort; Scholar can return HTTP 403).
3. SINTA's public Google-Scholar mirror for recent Scholar items and metrics.
4. The public ResearchGate publication profile as a broad catalogue fallback.
5. Crossref records connected to ORCID `0000-0002-4137-6253` as a metadata fallback.

This design keeps the search index much broader even when Google Scholar blocks an automated request.

## Automatic publication-title translation
New publication titles are translated and cached for all website languages. Existing translations are reused, so each scheduled update translates only missing titles.

- Optional `DEEPL_API_KEY`: recommended for the most reliable automated translation.
- Without it, the workflow automatically tries the `deep-translator` Google Translate fallback.
- The original publication title is always preserved and displayed below a translated title for bibliographic accuracy.
- Official **journal names are not translated**, because they are proper bibliographic titles.

## Optional GitHub secrets
Repository → **Settings → Secrets and variables → Actions**

- `SERPAPI_KEY` — recommended if you want the Google Scholar profile to be the complete authoritative publication source on every run.
- `DEEPL_API_KEY` — optional reliable publication-title translation provider.
- `JCR_JSON_URL` — optional licensed/verified Journal Impact Factor JSON feed.

The website still works without these secrets and uses public fallbacks.

## Title style
All website headings and publication titles are normalized so they **do not end with a full stop**.
