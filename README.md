# NPOGraph

**An open knowledge platform for understanding, designing, and improving how mission-driven organizations operate.**

> Status: early-stage / pre-alpha. The ontology and documentation are the current focus — no application code exists yet. See the [roadmap](docs/04-roadmap.md).

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
└── docs/
    ├── 00-vision.md
    ├── 01-guiding-principles.md
    ├── 02-core-concepts.md
    ├── 03-relationships.md
    └── 04-roadmap.md
```

- **[Vision](docs/00-vision.md)** — what NPOGraph is trying to be and why it matters.
- **[Guiding Principles](docs/01-guiding-principles.md)** — the design values behind the ontology and the project.
- **[Core Concepts](docs/02-core-concepts.md)** — the ~40 grantmaking concepts that make up the first version of the ontology.
- **[Relationships](docs/03-relationships.md)** — how those concepts connect, including the end-to-end grant lifecycle.
- **[Roadmap](docs/04-roadmap.md)** — what comes after the docs: machine-readable formats, an interactive explorer, search, and beyond.

There is no machine-readable ontology (JSON-LD, OWL, RDF, SHACL) or application code yet — that's deliberate. The plan is to get the concepts and relationships right in plain language first, since that's what most contributors can review and critique, before committing to formats and code.

## Contributing

NPOGraph is meant to be built in the open, with contributions from people who understand grantmaking in practice, not just in theory. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to propose a new concept, question an existing one, or suggest a relationship.

## License

Documentation and ontology content are released under the [MIT License](LICENSE) unless noted otherwise.
