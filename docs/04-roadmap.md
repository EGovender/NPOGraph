# Roadmap

This is a living plan, not a commitment with dates. Phases are ordered by dependency — each one assumes the previous is stable enough to build on — not by a fixed timeline.

## Phase 0 — Vision and core concepts (current)

- [x] Vision and guiding principles
- [x] First-draft core concepts (~40, grantmaking only)
- [x] First-draft relationships and lifecycle
- [ ] Business rules documented in detail, separate from relationships
- [ ] Event model (what state transitions fire, e.g. "Award Approved", "Payment Released")
- [ ] Governance: how concept proposals are reviewed and accepted, and by whom

## Phase 1 — Machine-readable ontology

- [x] Canonical JSON representation of concepts and relationships (`ontology/source/*.json`)
- [x] JSON-LD context and graph (`ontology/context.jsonld`, `ontology/npograph.jsonld`)
- [x] OWL ontology (`ontology/npograph.ttl`)
- [x] RDF export (`ontology/npograph.rdf`, `ontology/npograph.nt`)
- [x] SHACL shapes for structural validation (`ontology/npograph.shapes.ttl`)
- [x] A documented process for keeping formats in sync with the docs — see [Data Model](05-data-model.md); enforced in CI via `.github/workflows/ontology.yml`
- [ ] SHACL/other validation of business rules once an event model exists (see Phase 0)

## Phase 2 — Interactive explorer

- [ ] A static site (likely GitHub Pages) that renders the concepts and relationships as a browsable, linked knowledge graph
- [ ] One page per concept, generated from the same source as the docs
- [ ] Basic keyword search over concept names and definitions

## Phase 3 — Learning and design tools

- [ ] "Learn" mode: each concept page includes purpose, business rules, lifecycle position, and worked examples
- [ ] "Design" mode: answer a series of questions about an organization's grantmaking practices and get back a recommended subset of the ontology relevant to them
- [ ] Worked end-to-end example ("story mode") walking through a single grant from application to closeout

## Phase 4 — Semantic search and AI assistant

- [ ] Semantic (not just keyword) search over the ontology
- [ ] An assistant that reasons over the ontology's actual relationships (e.g., "what depends on reports?") rather than general-purpose chat

## Phase 5 — Extension beyond grantmaking

- [ ] A defined pattern for extending the core ontology into adjacent domains (fundraising, CRM, finance, programs, volunteers) as separate modules
- [ ] At least one additional domain module built out as a proof of the extension pattern

## Explicitly out of scope for now

- Building a grants-management product or any end-user application beyond the explorer
- Committing to any specific tech stack for phases 2+ before phase 0/1 are stable
- Any AI-agent code-generation capability (auto-generating APIs/schemas from the ontology) — interesting long-term, not a near-term goal

## How this roadmap changes

Anyone can propose reordering, adding, or dropping an item via an issue or PR. See [CONTRIBUTING.md](../CONTRIBUTING.md).
