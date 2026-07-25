# Contributing to NPOGraph

NPOGraph is an ontology and documentation project before it's a software project. The most valuable contributions right now come from people who understand grantmaking in practice — program officers, grants managers, fiscal sponsors, compliance staff — as much as from engineers.

## What you can contribute right now

- **Challenge a definition.** If a concept in [Core Concepts](docs/02-core-concepts.md) doesn't match how your organization actually works, open an issue describing the mismatch.
- **Propose a missing concept.** If something important to grantmaking isn't represented, open an issue with a proposed name and working definition.
- **Refine a relationship or rule.** If a rule in [Relationships](docs/03-relationships.md) has exceptions in practice, open an issue or PR with the counter-example.
- **Improve clarity.** Typos, ambiguous wording, and better examples are always welcome as direct PRs.

## Process

1. **Small wording fixes** (typos, clarity) can go straight to a PR.
2. **Anything that changes meaning** — a new concept, a redefinition, a new or removed relationship, a business rule — should start as an issue for discussion before a PR. This keeps the ontology from drifting based on a single contributor's assumptions.
3. When opening an issue proposing a change, include:
   - The concept(s) or relationship(s) affected
   - Why the current version doesn't work (a concrete example is more useful than an abstract argument)
   - A proposed replacement, if you have one
4. PRs that touch `docs/02-core-concepts.md` or `docs/03-relationships.md` should reference the issue that discussed the change.

## Style for concept definitions

- One to three sentences. If it needs more, the concept is probably too broad and should be split.
- No implementation details (no field names, types, or references to specific software).
- Prefer the term practitioners actually use over a more "correct"-sounding synonym; note common alternate names in the definition (see how "Letter of Inquiry (LOI)" is written for an example).

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you're expected to uphold it.
