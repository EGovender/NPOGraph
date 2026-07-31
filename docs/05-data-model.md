# Data Model & Machine-Readable Formats

This describes how the plain-language ontology in [Core Concepts](02-core-concepts.md) and [Relationships](03-relationships.md) becomes machine-readable, and how the two are kept from drifting apart.

## Source of truth stays in prose

Per [Guiding Principle #1](01-guiding-principles.md), the prose docs are what gets reviewed and debated. Nothing here changes that. What follows is a structured *mirror* of that prose, not a replacement for it.

```
docs/02-core-concepts.md   ─┐
docs/03-relationships.md   ─┴─▶  ontology/source/*.json   ─▶  tools/generate_ontology.py  ─▶  ontology/*.ttl, *.rdf, *.nt, *.jsonld
                                  (canonical, hand-maintained)   (generated, never hand-edited)
```

- **`ontology/source/concepts.json`** and **`ontology/source/relationships.json`** are a structured transcription of the two docs above: one JSON object per concept/relationship, with a stable `id`, matching the prose definitions. They are hand-maintained, not generated.
- **Everything under `ontology/*.ttl`, `*.rdf`, `*.nt`, `*.jsonld`** is generated from the JSON source by `tools/generate_ontology.py` and must never be hand-edited — regenerate instead.
- **`ontology/commongood-atlas.shapes.ttl`** (SHACL) is hand-authored separately: it encodes structural completeness rules (e.g., every class needs a label and a definition) that the generator's output must satisfy, checked by `tools/validate_ontology.py`.

## Sync policy

Any PR that adds, renames, or redefines a concept or relationship in `docs/02-core-concepts.md` or `docs/03-relationships.md` **must** update the corresponding entry in `ontology/source/*.json` in the same PR, then run:

```bash
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
.venv/bin/python tools/generate_ontology.py
.venv/bin/python tools/validate_ontology.py
```

and commit the regenerated files under `ontology/`. CI (`.github/workflows/ontology.yml`) re-runs the generator and fails the build if the committed output doesn't match what generation produces, so drift between the JSON source and the generated formats can't merge silently. CI does not check the JSON source against the prose docs — that agreement is enforced by review, not tooling, for now.

## Canonical JSON schema

### `ontology/source/concepts.json`

Each concept is:

| field | meaning |
|---|---|
| `id` | Stable kebab-case identifier, used to build the concept's IRI and to reference it from `relationships.json`. Never reused for a different concept once published. |
| `label` | Display name, matching the heading used in `02-core-concepts.md`. |
| `aliases` | Other names practitioners use for the same concept (e.g., `"NOFO"` for Funding Opportunity). |
| `category` | Which section of `02-core-concepts.md` the concept belongs to. |
| `definition` | The one-to-three sentence definition, copied from the docs. |
| `subClassOf` | Optional parent concept `id`, only set where the docs explicitly describe one concept as a specialization of another. |
| `docRef` | Relative path/anchor into the docs for traceability. |

### `ontology/source/relationships.json`

Each relationship is:

| field | meaning |
|---|---|
| `id` | Stable identifier for the relationship. |
| `subject` | Concept `id` the relationship starts from. |
| `predicate` | camelCase property name (becomes an `owl:ObjectProperty` local name). |
| `object` | Concept `id` the relationship points to. |
| `label` | Short human-readable phrase (e.g., "is formalized by"). |
| `description` | Fuller explanation, copied from the docs. |
| `docRef` | Relative path/anchor into the docs for traceability. |

## Namespace

Concepts and relationships are minted under:

```
https://egovender.github.io/commongood-atlas/ontology/
```

This is a placeholder aligned with where the Phase 2 explorer is expected to be hosted (GitHub Pages, per the [roadmap](04-roadmap.md)). If CommonGood Atlas ever gets a dedicated domain, the namespace can change — every IRI is generated from `ontology/source/*.json`, so it's a one-line change in `tools/generate_ontology.py`, not a rewrite.

- Concepts: `.../ontology/{concept-id}` — `owl:Class`
- Relationships: `.../ontology/relations/{predicate}` — `owl:ObjectProperty`

## Generated artifacts

Running `tools/generate_ontology.py` produces, all from the same in-memory graph:

- `ontology/commongood-atlas.ttl` — the OWL ontology in Turtle syntax (classes, subclass axioms, object properties with domain/range, labels, definitions). This is the primary, most human-reviewable format.
- `ontology/commongood-atlas.rdf` — the same graph as RDF/XML, for tools that expect it.
- `ontology/commongood-atlas.nt` — the same graph as sorted N-Triples, for diff-friendly RDF interchange.
- `ontology/context.jsonld` — a JSON-LD `@context` mapping the field names above to real terms (`rdfs:label`, `skos:definition`, `skos:altLabel`, etc).
- `ontology/commongood-atlas.jsonld` — the full graph as JSON-LD, using that context.

## What's intentionally not covered yet

Business rules (the "Key relationship rules" list in `03-relationships.md`) are not yet encoded as SHACL constraints — most of them describe temporal/state conditions (e.g., "closeout requires all payments made") that don't map cleanly onto SHACL's shape-validation model without also modeling instance data and events, which is out of scope until the [event model](04-roadmap.md) work happens. The current SHACL shapes only validate the *structure* of the ontology itself (every class has a label and definition; every object property has a domain and range) — see `ontology/commongood-atlas.shapes.ttl`.
