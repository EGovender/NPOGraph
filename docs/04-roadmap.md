# Roadmap

This is a living plan, not a commitment with dates. Phases are ordered by dependency — each one assumes the previous is stable enough to build on — not by a fixed timeline.

## Phase 0 — Vision and core concepts (current)

- [x] Vision and guiding principles
- [x] First-draft core concepts (~40, grantmaking only)
- [x] First-draft relationships and lifecycle
- [x] Business rules documented in detail, separate from relationships — see [Properties & Rules](06-properties-and-rules.md) and `ontology/source/business-rules.json`
- [ ] Event model (what state transitions fire, e.g. "Award Approved", "Payment Released")
- [ ] Governance: how concept proposals are reviewed and accepted, and by whom

## Phase 1 — Machine-readable ontology

- [x] Canonical JSON representation of concepts and relationships (`ontology/source/*.json`)
- [x] JSON-LD context and graph (`ontology/context.jsonld`, `ontology/npograph.jsonld`)
- [x] OWL ontology (`ontology/npograph.ttl`)
- [x] RDF export (`ontology/npograph.rdf`, `ontology/npograph.nt`)
- [x] SHACL shapes for structural validation (`ontology/npograph.shapes.ttl`)
- [x] A documented process for keeping formats in sync with the docs — see [Data Model](05-data-model.md); enforced in CI via `.github/workflows/ontology.yml`
- [x] Concept attributes (`owl:DatatypeProperty`) and per-concept SHACL property shapes (required-ness, datatype, allowed values) — see [Properties & Rules](06-properties-and-rules.md), `ontology/source/properties.json`, `ontology/npograph.property-shapes.ttl`
- [ ] SHACL/other validation of state-transition business rules once an event model exists (see Phase 0)

## Phase 2 — Interactive explorer

- [x] A static site (Astro + React, on GitHub Pages) that renders the concepts and relationships as a browsable, linked knowledge graph — see `site/`, live at [egovender.github.io/NPOGraph](https://egovender.github.io/NPOGraph/)
- [x] One page per concept, generated from the same source as the docs (`site/src/pages/concepts/[id].astro`, reading `ontology/source/*.json`)
- [x] Basic keyword search over concept names, aliases, and definitions (`site/src/components/SearchBox.tsx`)
- [x] Property inspector (Overview / Properties / Relationships / Rules / Technical tabs) on both the concept page and the explorer's node detail panel — see `site/src/components/PropertyInspector.tsx`, styled after Neo4j Bloom's inspector + graph controls (zoom/fit), aiming for a friendlier feel than Bloom's
- [ ] Known gap: a handful of concepts (`indirect-cost-rate`, and the `evaluation`/`output`/`outcome` trio) have no documented relationships yet, so they appear disconnected in the graph explorer — that's an honest reflection of the current ontology, not a site bug. Worth revisiting when Phase 0's business-rules/event-model work happens.

## Phase 3 — Learning and design tools

- [x] Most of "Learn" mode landed early via the Phase 2 property inspector: purpose (Overview tab), business rules (Rules tab), and lifecycle position (Properties tab's Lifecycle group) are already on every concept page
- [x] Worked examples per concept and the end-to-end "story mode" walkthrough turned out to be one dataset viewed two ways — see [Worked Example](07-worked-example.md): a single fictional grant (`ontology/source/example.json`) generated as real, SHACL-validated `owl:NamedIndividual`s (`ontology/npograph.example.ttl`/`.jsonld`), surfaced as an Example tab on the concepts it touches and as the full sequence at `site/src/pages/story.astro`
- [x] "Design" mode: a hybrid question set (`site/src/data/design-questions.ts`) — mostly independent yes/no toggles, plus a few `showIf`-gated follow-ups and one single-select branch where a real dependency exists — recommending a live-updating concept subset at `site/src/pages/design.astro`

## Phase 3.5 — Organizational foundation

Prompted by a gap the grantmaking-only model couldn't express: an organization like a philanthropic intermediary can simultaneously be a grantmaker, a fiscal sponsor, a DAF sponsor, and a grantee/subrecipient — not one of these permanently, but each contextually, engagement by engagement. See [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md) for the full design.

- [x] **Milestone 1 (this phase):** `Funder`, `Grantee`, and `Fiscal Sponsor` reparented from `Organization` subtypes to `Organization Role` subtypes, with role occupancy reified (`Organization --playsRole--> Organization Role --appliesWithin--> Philanthropic Arrangement`) so the same organization can hold multiple, independently-dated roles. Added `Organization Role`, `Organization Type`, `Philanthropic Intermediary`, `Funding Intermediary Role`, `Fund`, and `Philanthropic Arrangement` (48 concepts total), plus direct `Award` party edges (`awardedBy`/`awardedTo`/`fundedFrom`/`managedBy`) so intermediary philanthropy can name different organizations for each.
- [x] **Milestone 2 — Intermediary philanthropy:** concrete arrangement subtypes (`Fiscal Sponsorship Arrangement`, `Donor-Advised Fund Arrangement`, `Regranting Arrangement`, `Collaborative Fund Arrangement`) as `subClassOf philanthropic-arrangement`; `Donor-Advised Fund` as a `Fund` subtype; `Sponsored Project`; `Grant Recommendation`; `Donor Advisor` (56 concepts total). See [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md#milestone-2-intermediary-philanthropy) for two scope refinements made during implementation: no separate "Sponsored Project Arrangement" or "Funding Intermediary Arrangement" (each would duplicate an existing concept), and `Donor Advisor` modeled as a person-level concept rather than an `Organization Role` subtype.
- [ ] **Milestone 3 — Second worked example + explorer views:** a donor-advised-fund or fiscal-sponsorship scenario proving the model past the direct-grant case (the current worked example only exercises a direct `Funder`/`Grantee` pair); an explorer view selector (grant lifecycle / organizations & roles / funds & arrangements / full ontology); visual node-shape differentiation by concept kind; per-type inspector tab variants (Organization gets Classification/Roles tabs; Role gets "organizations playing this role"/"applicable arrangements" tabs).
- [ ] **Milestone 4 — Enterprise architecture layer:** Business Capability, Business Process, Application System, Data Object, Integration, Policy, Organizational Unit — explicitly not started; only after the philanthropic structure above has had real use.

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
