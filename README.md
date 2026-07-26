<p align="center">
  <img src="site/public/logo.svg" alt="NPOGraph — Nonprofit Knowledge Network" width="360" />
</p>

# NPOGraph

**An open knowledge platform for understanding, designing, and improving how mission-driven organizations operate.**

> Status: early-stage / pre-alpha. See the [roadmap](docs/04-roadmap.md).

**[Explore the live ontology →](https://egovender.github.io/NPOGraph/)**

## What is NPOGraph?

NPOGraph is an open-source effort to build a shared semantic model — an ontology — of how nonprofit organizations actually work, starting with **grantmaking**: funders, applications, reviews, awards, payments, compliance, and outcomes.

Rather than a static specification document, the goal is a living, explorable knowledge base: a place where someone new to grantmaking can learn how the pieces fit together, where an implementer can find a precise definition of a concept before modeling it in a database or API, and where the community can propose and discuss changes the way open-source software projects do.

The name is intentionally broader than "grants." The core ontology is designed to extend to other domains a nonprofit cares about — fundraising, CRM, programs, finance, volunteers — as separate modules built on a shared foundation, once the grantmaking core is solid.

## Why

Nonprofit software is fragmented: every CRM, grants-management system, and finance tool re-derives its own model of what a "grant," an "award," or a "report" means, usually implicitly, in code. There is no shared, open reference for these concepts the way there is for, say, web standards or accounting. NPOGraph is an attempt to build that reference — openly, incrementally, and in public.

## What's here today

```
NPOGraph/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── docs/
│   ├── 00-vision.md
│   ├── 01-guiding-principles.md
│   ├── 02-core-concepts.md
│   ├── 03-relationships.md
│   ├── 04-roadmap.md
│   ├── 05-data-model.md
│   ├── 06-properties-and-rules.md
│   ├── 07-worked-example.md
│   └── 08-organizations-roles-and-arrangements.md
├── ontology/
│   ├── source/                     # hand-maintained canonical JSON (concepts, relationships, properties, business rules, example)
│   ├── npograph.ttl                 # generated: OWL ontology (Turtle)
│   ├── npograph.rdf                 # generated: RDF/XML
│   ├── npograph.nt                  # generated: N-Triples
│   ├── context.jsonld               # generated: JSON-LD context
│   ├── npograph.jsonld              # generated: JSON-LD graph
│   ├── npograph.shapes.ttl          # hand-authored SHACL shapes (structural completeness)
│   ├── npograph.property-shapes.ttl # generated SHACL (per-concept property constraints)
│   └── npograph.example.{ttl,nt,jsonld} # generated: the worked example as real owl:NamedIndividuals
├── tools/
│   ├── generate_ontology.py    # ontology/source/*.json -> ontology/*.ttl,*.rdf,*.nt,*.jsonld,*.property-shapes.ttl,*.example.*
│   └── validate_ontology.py    # validates npograph.ttl + npograph.example.ttl against both shapes files
└── site/                      # Astro + React explorer app, deployed to GitHub Pages
    ├── scripts/sync-ontology-data.mjs  # copies ontology/source/*.json in at build time
    └── src/
        ├── data/                        # typed data-access layer over the synced JSON, + design-questions.ts
        ├── components/                  # SearchBox, GraphExplorer (cytoscape.js), PropertyInspector, DesignWizard, etc.
        └── pages/                       # /, /explore, /concepts, /concepts/[id], /design, /story
```

- **[Vision](docs/00-vision.md)** — what NPOGraph is trying to be and why it matters.
- **[Guiding Principles](docs/01-guiding-principles.md)** — the design values behind the ontology and the project.
- **[Core Concepts](docs/02-core-concepts.md)** — the ~56 grantmaking and organizational concepts that make up the ontology so far.
- **[Relationships](docs/03-relationships.md)** — how those concepts connect, including the end-to-end grant lifecycle.
- **[Roadmap](docs/04-roadmap.md)** — what comes after the docs: machine-readable formats, an interactive explorer, search, and beyond.
- **[Data Model](docs/05-data-model.md)** — how the prose docs become the machine-readable ontology, and how the two are kept in sync.
- **[Properties & Rules](docs/06-properties-and-rules.md)** — concept attributes (amount, status, dates, ...) and the constraints on them, surfaced in the explorer's Properties and Rules tabs.
- **[Worked Example](docs/07-worked-example.md)** — a single fictional grant, followed end to end as real (SHACL-validated) RDF individuals, behind the explorer's Example tab and Story page.
- **[Organizations, Roles & Arrangements](docs/08-organizations-roles-and-arrangements.md)** — why Funder/Grantee/Fiscal Sponsor are contextual roles an organization occupies rather than permanent types, and how Fund and Philanthropic Arrangement support intermediary philanthropy (e.g. fiscal sponsorship, donor-advised funds).

The ontology (`ontology/npograph.ttl` and friends) is machine-generated from `ontology/source/*.json`, which is itself a hand-maintained mirror of the prose docs — see [Data Model](docs/05-data-model.md) before editing anything under `ontology/`. The `site/` explorer app reads that same `ontology/source/*.json` at build time, so the docs, the ontology, and the explorer never describe three different things. Every concept page and every node in the graph explorer opens a property inspector (Overview / Example / Properties / Relationships / Rules / Technical tabs) — see [Properties & Rules](docs/06-properties-and-rules.md) and [Worked Example](docs/07-worked-example.md) for what backs those tabs. `/design` recommends a subset of the ontology from a short questionnaire; `/story` walks the worked example end to end.

### Regenerating the ontology

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
.venv/bin/python tools/generate_ontology.py
.venv/bin/python tools/validate_ontology.py
```

CI re-runs this on every change under `ontology/` or `tools/` and fails if the committed generated files don't match, or if SHACL validation fails.

### Running the explorer site locally

The site is an [Astro](https://astro.build) + React app and requires Node 22 (see `site/.nvmrc`):

```bash
cd site
nvm use   # or: nvm install 22
npm install
npm run dev
```

`npm run dev`/`npm run build` both sync `ontology/source/*.json` into `site/src/data/generated/` first (see `site/scripts/sync-ontology-data.mjs`) — that copy is generated, not committed. Pushes to `main` that touch `site/**` or `ontology/source/**` auto-deploy to GitHub Pages via `.github/workflows/deploy-site.yml`.

## Contributing

NPOGraph is meant to be built in the open, with contributions from people who understand grantmaking in practice, not just in theory. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose a new concept, question an existing one, or suggest a relationship.

## License

Documentation and ontology content are released under the [MIT License](LICENSE) unless noted otherwise.
