# Deployment Checklist

A short, practical checklist for confirming the live site at [egovender.github.io/NPOGraph](https://egovender.github.io/NPOGraph/) actually matches the repository after a push to `main`. Most of this is already enforced automatically (see below); this exists for the cases automation can't cover — spot-checking the *deployed* result, not just the build.

## Automated (nothing to do, just know it's there)

- `.github/workflows/ontology.yml` regenerates `ontology/*.ttl`/`.rdf`/`.nt`/`.jsonld`/`.property-shapes.ttl`/`.example.*` from `ontology/source/*.json` and fails the build if the committed files don't match — the generated ontology can never silently drift from its source.
- `tools/validate_ontology.py` (same workflow) SHACL-validates the ontology and worked example against both shapes files.
- `.github/workflows/deploy-site.yml` runs on every push to `main` touching `site/**` or `ontology/source/**`; `npm run build`'s `prebuild` hook re-syncs `ontology/source/*.json` into the site every time, so the deployed site can't serve a stale copy.

## Manual spot-check, after a deploy you care about

1. Open the [Actions tab](https://github.com/EGovender/NPOGraph/actions) — confirm both `ontology` and `deploy-site` are green for the latest commit on `main`.
2. Open the live site's homepage — confirm the concept/relationship counts in the status line match `ontology/source/concepts.json`/`relationships.json` (`jq length`, or just count entries).
3. Confirm the homepage's "Ontology v… , updated …" line (footer, and the homepage status line) shows the version in `ontology/source/meta.json` and a date matching the latest commit that touched `ontology/source/`.
4. View-source (or a social-preview debugger) on the homepage and one concept page — confirm `og:title`/`og:description`/`og:image`/`twitter:*`/`<link rel="canonical">` are present and point at the live domain, not `localhost`.
5. If you changed anything under Phase 3.5's organizational-foundation concepts, open a couple of the newer concept pages (e.g. `fiscal-sponsorship-arrangement`, `donor-advised-fund`) live and confirm they render with the right category color and relationships — not just that the build succeeded.

If any of these disagree with the repository, the fix is almost always one of: a workflow didn't trigger (check its `paths:` filter), the build ran against a stale `site/src/data/generated/*.json` cached from a previous local run (delete and re-run `npm run sync-data`), or GitHub Pages itself hasn't finished propagating yet (wait a minute and recheck).
