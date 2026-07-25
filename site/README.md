# NPOGraph explorer

The interactive explorer for the [NPOGraph](../README.md) grantmaking ontology — search, browse, and graph-visualize the concepts and relationships defined in `../ontology/source/*.json`. Built with [Astro](https://astro.build) (static output) and a React island for the interactive graph ([cytoscape.js](https://js.cytoscape.org/)).

Live at [egovender.github.io/NPOGraph](https://egovender.github.io/NPOGraph/).

## Requirements

Node 22 (see `.nvmrc`) — the current Astro major version requires it. If you use [nvm](https://github.com/nvm-sh/nvm): `nvm install`.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server at `localhost:4321` (syncs ontology data first) |
| `npm run build` | Build the static site to `./dist/` (syncs ontology data first) |
| `npm run preview` | Preview a production build locally |
| `npm run sync-data` | Manually re-copy `../ontology/source/*.json` into `src/data/generated/` |

## How data flows in

`src/data/ontology.ts` and `src/data/categories.ts` are the only modules that should know about the ontology's shape. Everything else — pages, components — imports from there. The underlying JSON is never hand-edited inside `site/`; it's synced from `../ontology/source/` by `scripts/sync-ontology-data.mjs` (see the repo root's `docs/05-data-model.md` for why).

## Structure

```
src/
├── data/          # typed data-access layer (ontology.ts, categories.ts) + generated/ (gitignored)
├── layouts/       # BaseLayout.astro
├── components/    # CategoryBadge, SearchBox (React), GraphExplorer (React + cytoscape)
└── pages/
    ├── index.astro              # home + search
    ├── explore.astro            # graph explorer
    └── concepts/
        ├── index.astro          # full concept list, grouped by category
        └── [id].astro           # one page per concept
```
