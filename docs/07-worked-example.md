# Worked Example

Everything before this document describes the ontology's *schema*: what a concept is, what attributes it has, how concepts relate. None of it says what an actual grant looks like. This is the worked example that does — five connected, fictional scenarios followed with concrete values filled in instead of definitions: a direct grant from a funder opening a grant program through closeout, and four ways funding can flow through intermediaries (fiscal sponsorship, a donor-advised fund, regranting, and a collaborative fund).

## Why one example file, not one per concept

The roadmap originally framed this as two things: "worked examples per concept" and an end-to-end "story mode." They turned out to be the same underlying data looked at two ways — a single coherent scenario, threaded through the concepts it actually touches, is both more useful and far less work to keep consistent than dozens of independent snippets. A concept's own page shows its instance(s) from the scenario (when the scenario touches that concept); the [Story page](#the-story-page) walks the whole thing in order.

Not every concept appears in the example — concepts that are purely definitional or structural in the scenarios chosen (`Eligibility Criteria`, `Theory of Change`, `Logic Model`, most person-level roles) don't get an instance just to pad out coverage. That's the same judgment call as [Properties & Rules](06-properties-and-rules.md) made about which concepts get attributes: an example instance you had to invent a reason for isn't actually illustrating anything.

## Five threads, one file

Phase 3.5 Milestone 3 added a second thread to the same file rather than a second, independent example: Ocean Conservation Fund — already the Funder in the direct-grant thread — turns out to be an `Organization` in its own right, and in a second, separately-dated engagement it also occupies a `Fiscal Sponsor` role for a `Sponsored Project` (Tidewater Youth Ocean Corps), funded by a different foundation (Pacific Coastal Trust) through a `Fiscal Sponsorship Arrangement`. Reusing the same organization across both threads is deliberate: it's the first real instance data proving the thing Milestone 1 was built to make possible — one organization holding two independently-dated `Organization Role` occupancies — see [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md#milestone-3-instance-data-and-explorer-views) for what this thread does and doesn't cover.

Phase 3.6 Milestone 4 added three more: Ocean Conservation Fund also hosts a Donor-Advised Fund and picks up a third and fourth role occupancy (`Funder`, `Fiscal Sponsor`, and now `Funding Intermediary` — regranting a larger foundation's money to a smaller local group), and a fifth, independent thread follows two other organizations pooling money into a Collaborative Fund Arrangement. See [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md#milestone-4-the-rest-of-the-instance-data-role-change-diagrams-and-legal-review-flags) for what each thread covers and the role-change diagram.

Because a concept like `Organization` or `Award` now has several individuals, `getExamplesForConcept` (site) returns an array rather than a single individual, and the Example tab renders each one as its own card. An individual's optional `act` field marks the first step of a new thread (e.g. `"A Second Engagement: Fiscal Sponsorship"`); the Story page renders a heading whenever it changes and leaves it off every other step in that thread.

## Where it lives

`ontology/source/example.json` — hand-maintained, same tier as `concepts.json`/`relationships.json`/`properties.json`. Each entry in `individuals` is one named individual: which concept it's an instance of, a label, a `narrative` sentence (used for the Story page), an optional `act` (see above), and a `properties` object whose keys must match a `name` defined for that concept in `properties.json` (checked at generation time — a typo'd property name fails the build, not silently gets dropped). `relationships` connects individuals using the *same* predicates already defined in `relationships.json` — the example doesn't invent its own vocabulary, it uses the schema. A relationship's declared subject/object concept doesn't have to match an individual's concept exactly — a subtype is accepted too (e.g. a `fiscal-sponsorship-arrangement` individual can use `administeredBy`, declared on its ancestor `philanthropic-arrangement`), the same subclass-aware rule `getPropertiesForConcept` already applied to properties.

## Generated as real RDF

`tools/generate_ontology.py` turns this into actual `owl:NamedIndividual` instances — `ontology/npograph.example.ttl`, `.nt`, and `.jsonld` — under their own `.../ontology/examples/` namespace (`ex:`), separate from the class-level `npograph.ttl` so schema and example data don't mix in the file someone would import to get the ontology itself.

Because they're typed as instances of real concepts (`ex:coastal-watch-fy26-award a npo:award`), the per-concept SHACL property shapes from [Properties & Rules](06-properties-and-rules.md) apply to them automatically — `tools/validate_ontology.py` validates the example individuals against the same required-ness/datatype/allowed-values constraints as everything else. If the example used an invalid `status` value or omitted a required property, validation would fail. This is the actual point of building it as RDF instead of just prose: it's proof the schema is usable, not just descriptive.

## The Story page

`site/src/pages/story.astro` renders the individuals in narrative order with their `narrative` sentences, linking each step to its concept page. It's the "walk through a single grant from application to closeout" item from the roadmap's Phase 3.
