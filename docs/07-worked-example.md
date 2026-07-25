# Worked Example

Everything before this document describes the ontology's *schema*: what a concept is, what attributes it has, how concepts relate. None of it says what an actual grant looks like. This is one worked example that does — a single, fictional grant followed from a funder opening a grant program through closeout, with concrete values filled in instead of definitions.

## Why one example, not one per concept

The roadmap originally framed this as two things: "worked examples per concept" and an end-to-end "story mode." They turned out to be the same underlying data looked at two ways — a single coherent scenario, threaded through the concepts it actually touches, is both more useful and far less work to keep consistent than 42 independent snippets. A concept's own page shows just its instance from the scenario (when the scenario touches that concept); the [Story page](#the-story-page) walks the whole thing in order.

Not every concept appears in the example — concepts that are purely definitional or structural in the scenario chosen (`Eligibility Criteria`, `Theory of Change`, `Logic Model`, most organizational roles) don't get an instance just to pad out coverage. That's the same judgment call as [Properties & Rules](06-properties-and-rules.md) made about which concepts get attributes: an example instance you had to invent a reason for isn't actually illustrating anything.

## Where it lives

`ontology/source/example.json` — hand-maintained, same tier as `concepts.json`/`relationships.json`/`properties.json`. Each entry in `individuals` is one named individual: which concept it's an instance of, a label, a `narrative` sentence (used for the Story page), and a `properties` object whose keys must match a `name` defined for that concept in `properties.json` (checked at generation time — a typo'd property name fails the build, not silently gets dropped). `relationships` connects individuals using the *same* predicates already defined in `relationships.json` — the example doesn't invent its own vocabulary, it uses the schema.

## Generated as real RDF

`tools/generate_ontology.py` turns this into actual `owl:NamedIndividual` instances — `ontology/npograph.example.ttl`, `.nt`, and `.jsonld` — under their own `.../ontology/examples/` namespace (`ex:`), separate from the class-level `npograph.ttl` so schema and example data don't mix in the file someone would import to get the ontology itself.

Because they're typed as instances of real concepts (`ex:coastal-watch-fy26-award a npo:award`), the per-concept SHACL property shapes from [Properties & Rules](06-properties-and-rules.md) apply to them automatically — `tools/validate_ontology.py` validates the example individuals against the same required-ness/datatype/allowed-values constraints as everything else. If the example used an invalid `status` value or omitted a required property, validation would fail. This is the actual point of building it as RDF instead of just prose: it's proof the schema is usable, not just descriptive.

## The Story page

`site/src/pages/story.astro` renders the individuals in narrative order with their `narrative` sentences, linking each step to its concept page. It's the "walk through a single grant from application to closeout" item from the roadmap's Phase 3.
