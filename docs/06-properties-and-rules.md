# Properties & Rules

[Core Concepts](02-core-concepts.md) defines what each concept *is*. This describes what an instance of a concept *has* — its attributes — and the constraints on those attributes. Together with [Relationships](03-relationships.md), this is the rest of what the explorer's Properties and Rules tabs show.

## What's new here vs. Phase 1

Phase 1 modeled concepts (`owl:Class`) and the relationships between them (`owl:ObjectProperty`). It did not model concepts' own attributes — an `Award` has a definition and relates to a `Grant Agreement`, but nothing said it also has an amount, a currency, and a status. This adds that layer:

- **`ontology/source/properties.json`** — attributes (`owl:DatatypeProperty`), one entry per (concept, attribute) pair.
- **`ontology/source/business-rules.json`** — the cross-concept constraints already described in prose in [Relationships → Key relationship rules](03-relationships.md#key-relationship-rules-draft), transcribed as data and tagged with which concepts each one involves.
- **`ontology/npograph.property-shapes.ttl`** — generated SHACL `PropertyShape`s, one set per concept, enforcing each attribute's required-ness, datatype, and allowed values. This is real, checked validation (`tools/validate_ontology.py`), not just descriptive text.

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

`Relationships` (recipient, funder, agreement, installments, ...) and `Validation` (required fields, allowed values, cardinality) are deliberately **not** separate groups in `properties.json`, even though the reference designs that inspired this feature list them as property groups. In NPOGraph they already have dedicated homes — object-valued connections are `relationships.json` (surfaced in the Relationships tab), and per-property constraints are SHACL (surfaced in the Rules tab) — so duplicating them inside `properties.json` would just be two places for the same fact to drift apart.

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

This becomes an `owl:DatatypeProperty` (`npoprop:award-amount`, domain `npo:award`, range `xsd:decimal`) in `npograph.ttl`, and a SHACL constraint in `npograph.property-shapes.ttl` requiring exactly one `npoprop:award-amount` value of type `xsd:decimal` on anything shaped as `npo:award`. Properties live under their own `.../ontology/properties/` namespace (`npoprop:`), the same way relationships already live under `.../ontology/relations/` (`nporel:`) -- concepts, relationships, and properties each get their own slice of the IRI space.

Properties are minted per `properties.json` entry (its `id`, e.g. `award-amount`), not per bare attribute `name` (e.g. `amount`) -- many concepts share a `name` like `status` or `amount` with a *different* domain and, for enums, different allowed values (a `Report`'s `status` values aren't an `Award`'s). Sharing one global `npo:status` property across all of them would force a single `rdfs:domain`, which RDFS/OWL treats as "must be an instance of all of these classes at once" when repeated -- not the "applies separately to each" meaning intended here. Giving each (concept, attribute) pair its own property keeps every domain and range unambiguous, at the cost of some repeated names across the ontology; that's a deliberate v0.1 tradeoff, not an oversight.

Enum-valued properties (e.g. `award`'s `status`) carry an `allowedValues` list instead of `null`; that becomes a SHACL `sh:in` constraint rather than an OWL-level restriction — OWL declares the type, SHACL enforces the specific values, which is the conventional division of labor between the two.

## Business rules

`ontology/source/business-rules.json` transcribes the prose rules already in `03-relationships.md` without changing their meaning, and adds an explicit `concepts` list so the explorer can show "closeout requires all payments and reports" on the `Closeout` page, the `Payment` page, and the `Report` page, instead of only in the docs. These become `npo:BusinessRule` instances (under their own `.../ontology/rules/` namespace, `nporule:`) in the generated ontology, linked to the concepts they involve via `npo:appliesTo`.

## Versioning

`ontology/source/meta.json` holds a single ontology-wide `version` string, bumped whenever `concepts.json`, `relationships.json`, or `properties.json` change meaning (not on every typo fix). There is no per-concept version or authorship history — NPOGraph doesn't track that yet, and the Technical tab says so rather than inventing it.
