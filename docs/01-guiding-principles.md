# Guiding Principles

These are the values the ontology and the project are held to. When a design decision is unclear, these are the tie-breakers.

## 1. Plain language before formalism

A concept isn't considered defined until it can be explained to a program officer or grants manager in a sentence or two, without jargon. OWL classes, JSON-LD contexts, and database schemas come later, and must trace back to a plain-language definition — not the other way around.

## 2. Practice over theory

Concepts and rules should reflect how grantmaking actually happens across real organizations, including the messy parts (verbal approvals, retroactive amendments, funders who skip formal review), not an idealized process. Where practice varies, the ontology should say so explicitly rather than picking one convention silently.

## 3. Precise, not exhaustive

Every concept should have a clear boundary — what it is and isn't — even if the first version doesn't cover every edge case or every type of funder. It's better to define 40 concepts precisely than 200 vaguely. Gaps get filled incrementally, in the open.

## 4. Everything is reviewable

The ontology is a versioned document, not a wiki page owned by one person. Changes to concepts or relationships go through the same proposal-and-review process regardless of who is proposing them.

## 5. Core stays narrow; breadth comes from extension

The grantmaking core should stay focused on grantmaking. Related domains (fundraising, CRM, finance, programs, volunteers) are expected to build on top of the core as separate modules later, rather than being folded in prematurely and diluting it.

## 6. Model drives implementation, not the reverse

Machine-readable formats, APIs, and any future application are meant to be derived from the ontology, and checked against it. If an implementation detail forces a change to a concept's definition, that change happens in the ontology docs first, with the reasoning recorded, not silently patched around in code.

## 7. Useful before impressive

A concept, diagram, or tool that's actually helpful to someone doing real grantmaking work beats a technically sophisticated one that isn't. When in doubt, favor the simpler artifact that more people can use and critique.
