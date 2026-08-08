# Properties & Rules

[Core Concepts](02-core-concepts.md) defines what each concept *is*. This describes what an instance of a concept *has* — its attributes — and the constraints on those attributes. Together with [Relationships](03-relationships.md), this is the rest of what the explorer's Properties and Rules tabs show.

## What's new here vs. Phase 1

Phase 1 modeled concepts (`owl:Class`) and the relationships between them (`owl:ObjectProperty`). It did not model concepts' own attributes — an `Award` has a definition and relates to a `Grant Agreement`, but nothing said it also has an amount, a currency, and a status. This adds that layer:

- **`ontology/source/properties.json`** — attributes (`owl:DatatypeProperty`), one entry per (concept, attribute) pair.
- **`ontology/source/business-rules.json`** — the cross-concept constraints already described in prose in [Relationships → Key relationship rules](03-relationships.md#key-relationship-rules-draft), transcribed as data and tagged with which concepts each one involves.
- **`ontology/commongood-atlas.property-shapes.ttl`** — generated SHACL `PropertyShape`s, one set per concept, enforcing each attribute's required-ness, datatype, and allowed values. This is real, checked validation (`tools/validate_ontology.py`), not just descriptive text.

## Not every concept has properties

Only concepts that represent something with its own tracked attributes — an award, a payment, a report — have entries in `properties.json`. Purely definitional or structural concepts (`Eligibility Criteria`, `Theory of Change`, `Grant Lifecycle` itself) don't, and that's intentional: forcing attributes onto a concept that doesn't have any in practice would be inventing detail the ontology can't back up. A concept with no properties still gets the auto-derived Identity and Classification groups below.

## Property groups

Every property belongs to one of these groups. `Identity`, `Classification`, and `Provenance` are never hand-authored in `properties.json` — they're derived automatically from fields concepts already have (see below), so there's exactly one place that data lives.

| Group | Examples | Where it comes from |
|---|---|---|
| Identity | id, label, alternate label, description | Derived from `concepts.json` (`id`, `label`, `aliases`, `definition`) |
| Classification | domain, type, category, broader concept | Base fields always derived from `concepts.json` (`category`, `subClassOf`); a concept-specific sub-classification (e.g. `Report.reportType`, `Indirect Cost Rate.rateType`) can additionally be hand-authored in `properties.json` when the concept genuinely has one |
| Lifecycle | status, start date, end date, stage | Hand-authored in `properties.json` |
| Financial | amount, currency, funding source | Hand-authored in `properties.json` |
| Governance | owner, approver, policy, restriction | Hand-authored in `properties.json` |
| Provenance | source, ontology version | Derived from `concepts.json` (`docRef`) and `ontology/source/meta.json` |

`Relationships` (recipient, funder, agreement, installments, ...) and `Validation` (required fields, allowed values, cardinality) are deliberately **not** separate groups in `properties.json`, even though the reference designs that inspired this feature list them as property groups. In CommonGood Atlas they already have dedicated homes — object-valued connections are `relationships.json` (surfaced in the Relationships tab), and per-property constraints are SHACL (surfaced in the Rules tab) — so duplicating them inside `properties.json` would just be two places for the same fact to drift apart.

## Example: Award

```json
{
  "id": "award-amount",
  "concept": "award",
  "name": "amount",
  "label": "Amount",
  "group": "financial",
  "datatype": "decimal",
  "required": true,
  "cardinality": "one",
  "allowedValues": null,
  "description": "The total amount committed under the Award."
}
```

This becomes an `owl:DatatypeProperty` (`npoprop:award-amount`, domain `npo:award`, range `xsd:decimal`) in `commongood-atlas.ttl`, and a SHACL constraint in `commongood-atlas.property-shapes.ttl` requiring exactly one `npoprop:award-amount` value of type `xsd:decimal` on anything shaped as `npo:award`. Properties live under their own `.../ontology/properties/` namespace (`npoprop:`), the same way relationships already live under `.../ontology/relations/` (`nporel:`) -- concepts, relationships, and properties each get their own slice of the IRI space.

Properties are minted per `properties.json` entry (its `id`, e.g. `award-amount`), not per bare attribute `name` (e.g. `amount`) -- many concepts share a `name` like `status` or `amount` with a *different* domain and, for enums, different allowed values (a `Report`'s `status` values aren't an `Award`'s). Sharing one global `npo:status` property across all of them would force a single `rdfs:domain`, which RDFS/OWL treats as "must be an instance of all of these classes at once" when repeated -- not the "applies separately to each" meaning intended here. Giving each (concept, attribute) pair its own property keeps every domain and range unambiguous, at the cost of some repeated names across the ontology; that's a deliberate v0.1 tradeoff, not an oversight.

Enum-valued properties (e.g. `award`'s `status`) carry an `allowedValues` list instead of `null`; that becomes a SHACL `sh:in` constraint rather than an OWL-level restriction — OWL declares the type, SHACL enforces the specific values, which is the conventional division of labor between the two.

## Business rules

`ontology/source/business-rules.json` transcribes the prose rules already in `03-relationships.md` without changing their meaning, and adds an explicit `concepts` list so the explorer can show "closeout requires all payments and reports" on the `Closeout` page, the `Payment` page, and the `Report` page, instead of only in the docs. These become `npo:BusinessRule` instances (under their own `.../ontology/rules/` namespace, `nporule:`) in the generated ontology, linked to the concepts they involve via `npo:appliesTo`.

## Phase 3.7 Milestone 3: reference-backed properties and controlled vocabularies

Every enum property up to this point (`award.status`, `fund.restrictionType`, and 33 others) stores its allowed values as a plain inline `allowedValues` array in `properties.json` -- no scheme, no definitions per value, no way to mark a value deprecated or map it to an external standard, and no way for two properties to share a vocabulary without copy-pasting the same array twice. This milestone adds a real controlled-vocabulary layer for properties that need more than that, without touching the other 31 enum properties -- see [Roadmap](04-roadmap.md) for why only five migrate now and the rest wait.

**`ontology/source/reference-data/*.json`** -- one file per scheme:

```json
{
  "id": "role-status",
  "label": "Role Status",
  "description": "Where a Role occupancy currently sits in its own lifecycle...",
  "domain": "role",
  "authorityType": "internal",
  "version": "1.0.0",
  "publicationStatus": "published",
  "values": [
    {
      "id": "role-status-active",
      "code": "active",
      "label": "Active",
      "definition": "The role occupancy is currently in effect.",
      "deprecated": false,
      "broader": null,
      "mappings": []
    }
  ]
}
```

A scheme becomes a `skos:ConceptScheme`; each of its values becomes a `skos:Concept` (`skos:inScheme` the scheme, `skos:notation` its short `code`, `skos:prefLabel` its display `label`, `skos:definition` its `definition`) -- real SKOS, not an CommonGood Atlas-invented shape wearing SKOS's name. `broader` becomes `skos:broader` (see Restriction Type below for why this isn't always a flat list); `replacedBy` becomes `dcterms:isReplacedBy` and requires `deprecated: true` on the same value; `mappings` (`{"relation": "exactMatch"|"closeMatch"|"broadMatch"|"narrowMatch"|"relatedMatch", "uri": "..."}`) becomes the matching `skos:*Match` triple to an external vocabulary term. None of the five schemes below actually populate `mappings` yet -- the generator supports it, but fabricating a mapping to an external standard just to exercise the field would be worse than leaving it empty until a real one is needed.

A scheme's own `publicationStatus` (draft/published/deprecated -- distinct from a *value's* `deprecated` flag, since a scheme can stay published while retiring one of its values) is itself drawn from the **Publication Status** scheme below, resolved to a real `skos:Concept` reference rather than a bare string -- the reference-data framework governs its own metadata the same way it governs everything else.

**The five "shared" vocabularies migrated as the proving ground:**

- **Role Status** (`role.status`) -- planned/active/suspended/ended/cancelled.
- **Organization Operating Status** (`organization.operatingStatus`) -- active/dissolved/merged/unknown.
- **Frequency** (`reporting-schedule.frequency`) -- monthly/quarterly/annual/one-time. Generic enough to back a different property later without a new scheme.
- **Restriction Type** (`fund.restrictionType`) -- unrestricted/donor-restricted/temporarily-restricted/permanently-restricted. The one scheme with real hierarchy: `temporarily-restricted` and `permanently-restricted` each set `broader: "restriction-type-donor-restricted"`, since both are kinds of donor restriction that differ only in whether it expires. `terms-and-conditions.restrictionType` (a simpler restricted/unrestricted enum on a different concept) was deliberately **not** folded into this scheme -- the two properties aren't proven to mean the same thing yet, and conflating them to save a migration would be a modeling decision, not a mechanical one; left as its own inline enum until that's actually decided.
- **Publication Status** (used only by reference-data schemes' own `publicationStatus` field, not by any ontology concept) -- draft/published/deprecated. The framework's self-describing bootstrap vocabulary.

**Three more added by the Programs, Results & Evidence enhancement**, using the same mechanism:

- **Issue Area** (`project.issueArea`) -- housing/education/health/environment/economic-development/arts-and-culture/food-security/human-rights. Flat, not assumed complete; new values can be proposed as real projects need them.
- **Claim Type** (`evidence-claim.claimType`) -- association/contribution/attribution/causation, required on every Evidence Claim. Ordered from weakest to strongest evidentiary interpretation and never treated as equivalent to one another -- this is the mechanism that keeps a causal interpretation of a project's relationship to a result an explicit, sourced claim rather than a plain graph fact.
- **Evidence Strength** (`evidence-claim.evidenceStrength`) -- anecdotal/limited/moderate/strong/inconclusive, required on every Evidence Claim, independent of `claimType`: a causation claim and an association claim can each be backed by strong or weak evidence.

**In `properties.json`**, a reference-backed property looks like this instead of carrying `allowedValues`:

```json
{
  "id": "role-status",
  "concept": "role",
  "name": "status",
  "datatype": "reference",
  "referenceScheme": "role-status",
  "allowedValues": null,
  ...
}
```

`datatype: "reference"` makes the property an `owl:ObjectProperty` (range `skos:Concept`) instead of an `owl:DatatypeProperty` -- its value is a resource, not a literal. Instance data (`ontology/source/example.json`) is unaffected: a role occupancy's `status` is still written as the plain string `"active"`, and the generator resolves it to `nporef:role-status-active` when building the RDF/JSON-LD -- the human-authored side of the ontology never has to spell out full reference-data IRIs by hand.

**SHACL enforcement** for a reference-backed property combines `sh:class skos:Concept` (the value must be a SKOS concept at all) with a scheme-membership check (`sh:node [ sh:property [ sh:path skos:inScheme ; sh:hasValue nporef:role-status ] ]`, i.e. it must be a concept specifically *in this scheme*) -- deliberately not an enumerated `sh:in` list of the scheme's current values, so a scheme can gain a new value without regenerating every shape that references it. Deprecated values still satisfy this shape; flagging their use is left to Milestone 6's planned deprecated-value warning, a softer signal than a hard SHACL failure.

## Versioning

`ontology/source/meta.json` holds a single ontology-wide `version` string, bumped whenever `concepts.json`, `relationships.json`, or `properties.json` change meaning (not on every typo fix). There is no per-concept version or authorship history — CommonGood Atlas doesn't track that yet, and the Technical tab says so rather than inventing it.
