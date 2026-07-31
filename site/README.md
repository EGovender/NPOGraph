# CommonGood Atlas explorer

The interactive explorer for the [CommonGood Atlas](../README.md) grantmaking ontology — search, browse, and graph-visualize the concepts, relationships, properties, and business rules defined in `../ontology/source/*.json`. Built with [Astro](https://astro.build) (static output) and React islands for the interactive graph ([D3](https://d3js.org/): `d3-force`, `d3-zoom`, `d3-drag`, `d3-shape`) and the property inspector.

Live at [egovender.github.io/commongood-atlas](https://egovender.github.io/commongood-atlas/).

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

`src/data/ontology.ts` and `src/data/categories.ts` are the only modules that should know about the ontology's shape. Everything else — pages, components — imports from there. The underlying JSON is never hand-edited inside `site/`; it's synced from `../ontology/source/` by `scripts/sync-ontology-data.mjs` (see the repo root's `docs/05-data-model.md` for why). `src/data/design-questions.ts` is the one exception — it's application logic (a recommendation heuristic layered on top of the ontology), not ontology content, so it's hand-authored directly in `site/`; see its file header for why.

## Structure

```
src/
├── data/          # typed data-access layer (ontology.ts, categories.ts) + generated/ (gitignored)
│                  # + design-questions.ts (hand-authored site logic, not synced ontology data)
├── layouts/       # BaseLayout.astro
├── components/    # SearchBox, GraphExplorer (React + D3, 'full' and 'mini' modes),
│                  # PropertyInspector (Overview/Example/Properties/Relationships/Rules/Technical),
│                  # DesignWizard
└── pages/
    ├── index.astro              # home + search
    ├── explore.astro            # graph explorer + property inspector
    ├── design.astro             # "Design mode" questionnaire -> recommended concept subset
    ├── story.astro              # the worked example walked end to end
    └── concepts/
        ├── index.astro          # full concept list, grouped by category
        └── [id].astro           # one page per concept: mini neighborhood graph + property inspector
```
