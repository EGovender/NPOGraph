# Roadmap

This is a living plan, not a commitment with dates. Phases are ordered by dependency — each one assumes the previous is stable enough to build on — not by a fixed timeline. Completed milestones are summarized here; full implementation detail (design decisions, deviations, bugs found) lives in the linked docs, not duplicated in this file.

## Phase 0 — Vision and core concepts

- [x] Vision and guiding principles
- [x] First-draft core concepts (~40, grantmaking only)
- [x] First-draft relationships and lifecycle
- [x] Business rules, documented separately from relationships — see [Properties & Rules](06-properties-and-rules.md)
- [ ] Event model (what state transitions fire, e.g. "Award Approved", "Payment Released")
- [ ] Governance: how concept proposals are reviewed and accepted, and by whom

## Phase 1 — Machine-readable ontology

- [x] Canonical JSON source (`ontology/source/*.json`), generated into JSON-LD, OWL/Turtle, and RDF/XML — see [Data Model](05-data-model.md)
- [x] SHACL shapes for structural validation, enforced in CI (`.github/workflows/ontology.yml`)
- [x] Concept attributes and per-concept SHACL property shapes — see [Properties & Rules](06-properties-and-rules.md)
- [ ] SHACL/other validation of state-transition business rules, once an event model exists (Phase 0)

## Phase 2 — Interactive explorer

- [x] A static site (Astro + React, GitHub Pages) rendering the ontology as a browsable graph — live at [egovender.github.io/NPOGraph](https://egovender.github.io/NPOGraph/)
- [x] One page per concept, generated from the same source as the docs
- [x] Keyword search over concept names, aliases, and definitions
- [x] Property inspector (Overview / Properties / Relationships / Rules / Technical tabs), on both the concept page and the explorer's node detail panel
- [ ] Known gap: `indirect-cost-rate` and the `evaluation`/`output`/`outcome` trio have no documented relationships yet, so they appear disconnected in the graph — an honest reflection of the ontology, not a site bug; revisit alongside Phase 0's event-model work

## Phase 3 — Learning and design tools

- [x] "Learn" mode landed via the Phase 2 property inspector: purpose, business rules, and lifecycle position are on every concept page
- [x] Worked examples per concept and an end-to-end "story mode" walkthrough, both views of one fictional dataset — see [Worked Example](07-worked-example.md)
- [x] "Design" mode: a guided question set recommending a live-updating concept subset (`/design`)

## Phase 3.5 — Organizational foundation

An organization like a philanthropic intermediary can simultaneously be a grantmaker, a fiscal sponsor, a DAF sponsor, and a grantee — not permanently, but contextually, engagement by engagement. See [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md) for the full design.

- [x] **Milestone 1:** `Funder`/`Grantee`/`Fiscal Sponsor` reparented from `Organization` subtypes to reified `Organization Role` occupancies (`Organization --playsRole--> Organization Role --appliesWithin--> Philanthropic Arrangement`), so one organization can hold multiple independently-dated roles. Added `Organization Role`, `Organization Type`, `Philanthropic Intermediary`, `Funding Intermediary Role`, `Fund`, `Philanthropic Arrangement`, and direct `Award` party edges.
- [x] **Milestone 2 — Intermediary philanthropy:** concrete arrangement subtypes (Fiscal Sponsorship, Donor-Advised Fund, Regranting, Collaborative Fund); `Donor-Advised Fund`, `Sponsored Project`, `Grant Recommendation`, `Donor Advisor` added. See [details](08-organizations-roles-and-arrangements.md#milestone-2-intermediary-philanthropy).
- [x] **Milestone 3 — Second worked example + explorer views:** a fiscal-sponsorship thread proving one organization can hold two independently-dated roles; an explorer view selector and node-shape-by-kind differentiation. See [details](08-organizations-roles-and-arrangements.md#milestone-3-instance-data-and-explorer-views).
- [ ] **Milestone 4 — Enterprise architecture layer:** Business Capability, Business Process, Application System, Data Object, Integration, Policy, Organizational Unit — not started; only after the philanthropic structure above has had real use.

## Phase 3.6 — Product alpha readiness

Reconciled from an external 10-milestone alpha-readiness review against actual repo state; several of its concerns turned out already solid, so what remains below was the genuinely new work, in dependency order.

- [x] **Milestone 1 — Site trust & positioning:** version/last-updated display sourced from git history; homepage rewrite; nav polish; social-preview meta tags; a [Deployment Checklist](09-deployment-checklist.md).
- [x] **Milestone 2 — Concept catalogue:** live search, filters, sort, and URL-persisted state on `/concepts`.
- [x] **Milestone 3 — Graph exploration, part 2:** in-graph search, a deterministic layout, BFS path-finding, URL-persisted state, PNG export, fullscreen, and a keyboard-accessible list view.
- [x] **Milestone 4 — Philanthropic intermediary model, remaining slice:** three more worked-example threads (DAF, Regranting, Collaborative Fund) completing instance data for every Phase 3.5 arrangement type; a role-change diagram; a `legalNote` field on 8 concepts with real legal nuance.
- [x] **Milestone 5 — Design tool expansion:** questions reorganized into five labeled sections with seven new questions covering the Phase 3.5 layer; export to JSON/JSON-LD/Markdown; a shareable URL; "open in graph."
- [x] **Milestone 6 — Story mode polish:** a scenario selector splitting story mode into per-thread tabs, a scrollspy progress bar, and "open in graph" links.
- [x] **Milestone 6.5 — Graph engine migration (Cytoscape.js → D3):** explorer rendering/interaction rebuilt on `d3-force`/`d3-zoom`/`d3-drag`; expanded node-kind and relationship-type taxonomies with their own filters.
- [ ] **Milestone 7 — Governance, versioning & testing:** a concept-level maturity field (draft/under-review/stable/deprecated); a real `meta.json` version-bump discipline; a first test suite beyond SHACL validation.
- [ ] **Milestone 8 — Accessibility, performance & SEO:** a full keyboard/screen-reader pass, Lighthouse targets, a performance budget, sitemap/robots.
- [ ] **Milestone 9 — Publish `v0.1-alpha`:** release notes, changelog, a known-limitations doc, versioned artifacts, a GitHub release tag.

## Phase 3.7 — Nonprofit knowledge model & reference-data governance

Adopted from an external knowledge-model review, reconciled against actual repo state: a first-class Person/Role model, a SKOS-based controlled-vocabulary framework, and (planned) a split of the overloaded Organization Type concept. Sequenced before Phase 3.6's remaining milestones, since those build naturally on the role model and reference-data framework this phase establishes.

- [x] **Milestone 1 — Role foundation:** a shared `role` concept, a `person` entity, and `person-role`/`organization-role` as its subclasses; shared role properties (`effectiveFrom`/`effectiveTo`/`status`/`scope`/`notes`) inherited via `subClassOf`; the ontology-authored `kind` field adopted across all concepts, replacing the explorer's client-derived one.
- [x] **Milestone 2 — Organization role expansion:** six new `Organization Role` subclasses (Contractor/Vendor/Service Provider/Employer/Partner/Sponsoring Organization) with documented distinctions; role context broadened beyond `Philanthropic Arrangement` to also cover a bare `Organization`; `scope` converted to an enum. See [details](08-organizations-roles-and-arrangements.md#phase-37-milestone-2-contractorvendorservice-providerpartner-and-the-broadened-role-context-model).
- [x] **Milestone 3 — Reference-data framework:** a SKOS-based controlled-vocabulary framework (`ontology/source/reference-data/*.json`), with generator and SHACL support, proven on five shared vocabularies (Role Status, Organization Operating Status, Frequency, Restriction Type, Publication Status). See [details](06-properties-and-rules.md#phase-37-milestone-3-reference-backed-properties-and-controlled-vocabularies).
- [ ] **Milestone 4 — Organization classification split:** migrate `organization-type` into `legal-form`/`tax-status`/`organization-classification` as governed reference-data vocabularies; migrate `organization-tax-status` to reference the new Tax Status scheme; grantmaking-domain vocabularies (Application/Review/Decision/Award/Payment/Report Status, Award Type).
- [ ] **Milestone 5 — Explorer support:** a top-level "Reference Data" nav page; `PropertyInspector` tab variants for Role and Reference-scheme kinds; node shapes driven by the authoritative `kind` field; expanded search across reference values and codes.
- [ ] **Milestone 6 — Examples, docs & hardening:** a third worked-example thread (one person holding multiple concurrent roles); `docs/10-knowledge-model-implementation.md` and `docs/11-reference-data-and-controlled-vocabularies.md`; narrow-scope validator hardening (role-holder-type, scheme-membership, deprecated-value, effective-date-range checks); final validation pass.

## Phase 3.8 — UX & information architecture

Adopted from an external UX review, reconciled against the actual site (not just its description): the ontology and its tooling are solid, but the site is organized around its features rather than the tasks/audiences that arrive with different questions. Confirmed concretely in the code: `/explore` and `/design`'s `<h1>`s ("Explore", "Design") don't match their nav labels ("Graph", "Model Your Program"); the graph sidebar exposes ten filter/legend sections at once with 8–9px labels and a duplicate Kind/Shapes legend; concept search has no persistent entry point outside the homepage; light-mode muted text measures 3.4:1 contrast against a 4.5:1 requirement; and there's no global `:focus-visible` treatment. Independent of Phase 3.7's ontology-model work (pure site/IA layer), so it can proceed in parallel; its Milestone 8 supersedes the overlapping accessibility items in Phase 3.6 Milestone 8 rather than duplicating them.

- [x] **Milestone 1 — Navigation & wayfinding clarity:** aligned page `<h1>`s (and `<title>`s) with their nav labels (`Explore` → "Graph Explorer", `Design` → "Model Your Program"); an eyebrow label on the Worked Example page; a persistent, compact concept-search entry point in the site header on every page but the homepage, reusing the existing `SearchBox`/`search.ts` and the nav's existing mobile-collapse behavior.
- [ ] **Milestone 2 — Homepage audience journeys:** replace the four equal-weight CTAs with audience-oriented journey cards (worked example / model your program / browse concepts), demote the graph to a secondary "already familiar with knowledge graphs?" link, add concrete "what can this help with" examples, and expand the "Pre-alpha" line into a one-sentence explanation.
- [ ] **Milestone 3 — Graph explorer: progressive disclosure:** collapse the ten-section sidebar into a small always-visible set (search, view, graph/list switch) plus a collapsible "Advanced filters" group; merge the duplicate Kind/Shapes legend; add active-filter chips with a reset; enlarge control buttons and node/relationship labels; reorder mobile layout so the graph appears before filters.
- [ ] **Milestone 4 — Concept catalogue scanning:** a responsive card grid with a compact-list alternative, a sticky search/filter toolbar, visible active-filter chips, truncated definitions in grid mode, category jump links, and matched-term highlighting.
- [ ] **Milestone 5 — Concept page reorganization:** regroup the six inspector tabs by user intent (Overview / In Practice / Connections / Data Model / Technical) instead of ontology structure; add a breadcrumb, prev/next navigation, related-concept cards, and URL-persisted tab state.
- [ ] **Milestone 6 — Model Your Program clarity:** explain the always-included foundation concepts before any question is answered; show the reason behind each recommended concept; rename "Not included" to "Not currently selected"; collapse JSON/JSON-LD/Markdown into a "Developer exports" section; add a plain-language operating-model summary.
- [ ] **Milestone 7 — Worked Example onboarding:** default to one scenario (not "All") with scenario cards showing a complexity level; make the lifecycle stage bar clickable; humanize property values (currency, dates, statuses) behind a "view technical data" toggle.
- [ ] **Milestone 8 — Accessibility & visual hierarchy:** darken light-mode muted text to meet 4.5:1 contrast; add a global `:focus-visible` treatment across all interactive elements; strengthen page-title and section visual hierarchy. Supersedes the equivalent items in Phase 3.6 Milestone 8.

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
