# Contributing to CommonGood Atlas

CommonGood Atlas is an ontology and documentation project before it's a software project. The most valuable contributions right now come from people who understand grantmaking in practice - program officers, grants managers, fiscal sponsors, compliance staff - as much as from engineers.

## The easiest way to contribute

You don't need to know GitHub, ontology terminology, RDF, OWL, or SHACL to suggest a change. Go to
**[/contribute](https://egovender.github.io/commongood-atlas/contribute)** on the site, or click
**Contribute** in the navigation, and pick what you want to suggest:

- A missing or incorrect **concept**
- A **relationship** that should connect differently
- A **property** a concept is missing
- A **business rule** or condition
- A **scenario or example**
- A **reference or terminology note**
- A **documentation** fix
- A **site bug** or **feature request**

Each of these opens a short guided form (a GitHub Issue Form) that asks for a plain-language
description and a real-world example - not ontology syntax. On concept pages and in the graph
explorer, the same links are available pre-filled with the concept you're looking at.

Submitting the form does **not** change the ontology by itself. It opens a public GitHub issue
that a maintainer reviews and discusses with you before anything is incorporated - see
[Contribution Lifecycle](#contribution-lifecycle) below.

## What you can contribute right now

- **Challenge a definition.** If a concept in [Core Concepts](docs/02-core-concepts.md) doesn't match how your organization actually works, open an issue describing the mismatch.
- **Propose a missing concept.** If something important to grantmaking isn't represented, open an issue with a proposed name and working definition.
- **Refine a relationship or rule.** If a rule in [Relationships](docs/03-relationships.md) has exceptions in practice, open an issue or PR with the counter-example.
- **Improve clarity.** Typos, ambiguous wording, and better examples are always welcome as direct PRs.

## Contribution lifecycle

Every guided-form submission is a GitHub issue labeled `contribution`, plus an `area:*` and
`type:*` label describing what kind of change it proposes. It moves through a single `status:*`
label (only one at a time) as it's reviewed:

```text
status:proposed  →  status:under-review  →  status:accepted  →  status:ready-for-pr  →  status:published
                            ↓                       ↓
                   status:needs-info          status:declined
```

- **`status:proposed`** - newly submitted, not yet triaged.
- **`status:needs-info`** - a maintainer asked a follow-up question; moves back to
  `status:under-review` once answered.
- **`status:under-review`** - being actively evaluated.
- **`status:accepted`** - accepted, with a maintainer comment documenting the modeling decision
  (for example, *"Accepted as a separate concept rather than a status on Award because an
  amendment has its own effective date, reason, and approval."*). This comment becomes part of the
  project's design history.
- **`status:declined`** - declined, with a reason documented in a comment.
- **`status:ready-for-pr`** - accepted and ready for someone (the submitter or a maintainer) to
  open the implementing PR.
- **`status:published`** - merged and live on the deployed site.

Site bugs, feature requests, and general feedback use the simpler `status:triage` in place of this
lifecycle, since they don't go through a modeling decision.

## Process

1. **Small wording fixes** (typos, clarity) can go straight to a PR.
2. **Anything that changes meaning** - a new concept, a redefinition, a new or removed relationship, a business rule - should start as an issue for discussion before a PR (the guided forms above do this automatically). This keeps the ontology from drifting based on a single contributor's assumptions.
3. When opening an issue proposing a change, include:
   - The concept(s) or relationship(s) affected
   - Why the current version doesn't work (a concrete example is more useful than an abstract argument)
   - A proposed replacement, if you have one
4. PRs that touch `docs/02-core-concepts.md` or `docs/03-relationships.md` should reference the issue that discussed the change (for example, a PR titled "Add Grant Amendment concept" with `Closes #27` in its description).
5. If your change adds, renames, or redefines a concept, relationship, attribute, or business rule, also update the matching entry in `ontology/source/concepts.json`, `relationships.json`, `properties.json`, or `business-rules.json`, then run `tools/generate_ontology.py` and `tools/validate_ontology.py` and commit the regenerated files under `ontology/`. If the change affects a concept used in the worked example (`ontology/source/example.json`), the generator will fail loudly if the example now violates the schema (an unknown property, an invalid enum value, a missing required field) - fix the example rather than working around the check. See [Data Model](docs/05-data-model.md), [Properties & Rules](docs/06-properties-and-rules.md), and [Worked Example](docs/07-worked-example.md) for the full policy - CI will reject a PR where the generated ontology files are out of date. Never hand-edit `ontology/commongood-atlas.ttl`, `.rdf`, `.nt`, `.jsonld`, `.property-shapes.ttl`, or `.example.*` directly.
6. The [explorer site](site/README.md) reads `ontology/source/*.json` directly at build time, so a concept/relationship change should just work there once synced (`npm run sync-data` inside `site/`) - it never needs its own separate edit for ontology content. Bugs or improvements to the site itself (search, the graph view, page layout) can go straight to a PR.
7. Once a contribution's PR is merged and deployed, change its originating issue's label from `status:ready-for-pr` to `status:published`.

## Style for concept definitions

- One to three sentences. If it needs more, the concept is probably too broad and should be split.
- No implementation details (no field names, types, or references to specific software).
- Prefer the term practitioners actually use over a more "correct"-sounding synonym; note common alternate names in the definition (see how "Letter of Inquiry (LOI)" is written for an example).

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you're expected to uphold it.
