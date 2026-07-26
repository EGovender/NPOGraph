# Organizations, Roles & Arrangements

[Relationships](03-relationships.md) already says, in passing: "the same legal entity can act as a Funder in one relationship and a Grantee in another (e.g., a community foundation re-granting government funds)." That sentence has always been true in practice. Nothing before this document made it true *structurally* — `Funder`, `Grantee`, and `Fiscal Sponsor` were permanent subtypes of `Organization`, so an organization was either a Funder or it wasn't, full stop. This document makes the multi-role case a first-class part of the ontology, not just an aside in the prose.

The motivating case is an intermediary organization — a foundation that simultaneously runs its own grantmaking, sponsors other groups' projects fiscally, hosts donor-advised funds, and receives regranted funds from other funders. No single one of `Funder`/`Grantee`/`Fiscal Sponsor` describes such an organization; all of them might, depending on which engagement you're looking at.

## Is Funder an organization type or a contextual role?

A contextual role — and specifically, a **reified** one, not just a relabeled class.

Here's why reification (making the role-occupancy itself a thing you can point at, not just a type an organization has) is necessary rather than a nice-to-have. `Organization Role` needs its own attributes — when the role started, when it ended, whether it's still active. If "Org X is a Funder" were still expressed as a direct type on the Organization individual itself (`OrgX a npo:funder`), there would be exactly one place to hang `effectiveFrom`/`effectiveTo` for that organization's *entire* funding history — every award it has ever funded would have to share one pair of dates. That breaks the moment an organization funds one arrangement in 2019 and a different one in 2023, or is a Funder in one arrangement while simultaneously a Grantee in another. Reparenting `Funder` under a new "role" concept without reifying it would only relabel the same non-contextual claim; it wouldn't make it contextual.

So the pattern is:

```
Organization --playsRole--> Organization Role --appliesWithin--> Philanthropic Arrangement
```

Each `Organization Role` is its own individual: one specific organization, occupying one specific role, scoped to one specific arrangement, with its own `effectiveFrom`/`effectiveTo`/`status`. An intermediary organization has *multiple* `Organization Role` individuals pointing back to it via `playsRole` — one per engagement — not one global type.

`Funder`, `Grantee`, and `Fiscal Sponsor` are now subclasses of `Organization Role`, not `Organization`. Their concept ids, IRIs, and aliases are unchanged — only where they sit in the hierarchy and how their definitions are worded changed (they now read "the role an organization occupies when..." rather than "an organization that...").

## Can one organization hold multiple roles?

Yes, by construction. An organization has as many `playsRole` edges as it has real engagements, each landing on a distinct `Organization Role` individual. There's no upper bound and no requirement that the roles be different types — the same organization could hold two separate `Funder` occupancies for two unrelated grant programs, each with its own dates.

Contrast with the pre-refactor model, where this was structurally impossible to express without contradiction: an Organization individual was either typed `npo:funder` or it wasn't, and typing it as both `npo:funder` and `npo:grantee` simultaneously would have been legal RDF but meaningless — nothing distinguished "acts as funder in context A" from "acts as grantee in context B."

## Fund vs. Grant Program

A `Grant Program` describes a giving *strategy or area* — "Environmental Justice Grants," standing, named, thematic. A `Fund` is the financial resource pool that backs giving — a designated sum of money, with a currency, a restriction status, and open/close dates.

They're related but distinct: `Grant Program --fundedBy--> Fund` (a program draws on a fund), and separately `Award --fundedFrom--> Fund` (a specific award draws from a fund directly — useful when an award isn't tidily attached to one program, or when tracking exactly which pool of money paid for it matters more than which strategy it served).

## Intermediary vs. source of funds

Three different things, deliberately kept apart, because collapsing them is exactly the mistake that made intermediary organizations hard to represent:

1. **`Philanthropic Intermediary`** — a *classification*. What kind of organization this commonly is. A tag, roughly: "this organization is known for doing intermediary work."
2. **`Funding Intermediary Role`** — a *role occupancy*. What capacity this organization is acting in, for one specific arrangement. An organization classified as a Philanthropic Intermediary exercises that classification by holding a `Funding Intermediary Role` (via `playsRole`) within a given `Philanthropic Arrangement`.
3. **`Award`'s direct party edges** — a *fact about one award*: `awardedBy` (who originally committed the funds), `awardedTo` (who ultimately receives them), `fundedFrom` (which Fund paid for it), `managedBy` (who administers it day to day).

These three can name three different organizations on the same award. That's the entire point: a Funder awards money, an Intermediary channels it, and a Grantee receives it, and none of those has to be the organization managing the paperwork.

## How fiscal sponsorship and donor-advised funds fit (conceptually, for now)

At this level, both are instances of the base `Philanthropic Arrangement` concept — a structured relationship that channels funding outside a direct Funder → Award → Grantee path. An organization connects to an arrangement either loosely (`Organization --participatesIn--> Philanthropic Arrangement`, no role tracked) or precisely (an `Organization Role`, scoped via `appliesWithin`, when the specific capacity and its dates matter).

**Fiscal Sponsorship Arrangement**, **Donor-Advised Fund Arrangement**, **Regranting Arrangement**, and **Collaborative Fund Arrangement** are now built as `subClassOf philanthropic-arrangement` — see "Milestone 2: Intermediary philanthropy" below for how each attaches.

## Which party awards, funds, administers, and pays a grant

| Relationship | Answers |
|---|---|
| `award --awardedBy--> organization` | Who originally committed the funding |
| `award --awardedTo--> organization` | Who ultimately receives it |
| `award --fundedFrom--> fund` | Which pool of money paid for it |
| `award --managedBy--> organization` | Who administers it day to day |

In a direct grant, all the organization-valued answers are the same two parties (funder, grantee) as before — nothing about the simple case gets more complicated. In intermediary philanthropy, they can diverge: a foundation (`awardedBy`) grants through an intermediary (`managedBy`) to a sponsored group (`awardedTo`), funded from a specific donor-advised pool (`fundedFrom`).

## A consequence of reification worth knowing about: SHACL respects the subclass chain

Reparenting `Funder`/`Grantee`/`Fiscal Sponsor` under `Organization Role` doesn't just change where they sit in a diagram — it means every existing individual typed as one of them is now also, automatically, a SHACL-instance of `Organization Role`. `sh:targetClass` resolves subclass instances as part of the core SHACL specification, independent of whatever RDFS-inference mode a validator run uses for the rest of the data graph. Concretely: `Organization Role` requires a `status` value, so both existing worked-example individuals (`Ocean Conservation Fund`, typed `Funder`, and `Coastal Watch Alliance`, typed `Grantee`) needed a `status` added to satisfy it — SHACL validation caught this immediately when this milestone's ontology was first regenerated, and it was the correct thing to fix (these individuals *are* role occupancies now, so they legitimately need the attribute every role occupancy needs), not a check worth loosening.

The generator's own example-consistency check (`tools/generate_ontology.py`) was updated to walk the same `subClassOf` chain when resolving which properties apply to a concept, so it now flags a missing inherited required property (or an unknown property that's actually valid on an ancestor concept) the same way SHACL does, instead of only checking a concept's own directly-declared properties.

## Milestone 2: Intermediary philanthropy

The arrangement subtypes, Donor-Advised Fund, Sponsored Project, Grant Recommendation, and Donor Advisor are now built. Two open questions from Milestone 1 are resolved here, and two concepts from the original proposal were deliberately not added because they'd duplicate what's already modeled:

- **Donor Advisor is a person-level concept, not an `organization-role` subtype.** Milestone 1 left this open ("a person-role, if donor-advisors are more often individuals than organizations"). In practice a donor advisor is almost always the original individual donor (or their family member/designee), not an organization — so `Donor Advisor` sits alongside `Program Officer`, `Reviewer`, and `Grant Administrator` as a standalone person-level concept, with no `subClassOf` and no properties of its own, matching how those three are already modeled. `Fund --advisedBy-->` never got added under this name; the equivalent fact is `Donor Advisor --advises--> Donor-Advised Fund`, in the direction that matches this project's convention of the more specific/active concept being the relationship's subject.
- **"Sponsored Project Arrangement" was not added as a separate concept.** The original proposal listed it alongside Fiscal Sponsorship Arrangement, but on inspection they describe the same real-world relationship viewed from two sides — a fiscal sponsor administering funds for a sponsored project *is* the sponsored-project arrangement. Adding both would mean two concepts for one fact. `Fiscal Sponsorship Arrangement --supports--> Sponsored Project` covers it: the arrangement is the relationship, `Sponsored Project` is the party without independent legal status inside it.
- **"Funding Intermediary Arrangement" was not added as a separate concept**, for the same reason: it would overlap almost entirely with `Regranting Arrangement` (an organization receiving funds and redistributing them is exactly what a funding intermediary does). `Regranting Arrangement` covers both regranting proper and general intermediary fund-channeling; `Funding Intermediary Role` (Milestone 1) already covers the role an organization occupies while doing it.

What was built, and where it attaches:

- **`Fiscal Sponsorship Arrangement`**, **`Donor-Advised Fund Arrangement`**, **`Regranting Arrangement`**, **`Collaborative Fund Arrangement`** — each `subClassOf philanthropic-arrangement`, inheriting its `effectiveDate`/`terminationDate`/`status`/`governingDocument` properties.
- **`Donor-Advised Fund`** — `subClassOf fund`, inheriting its `restrictionType`/`currency`/`openingDate`/`closingDate`/`status` properties. Related to its arrangement via `Donor-Advised Fund Arrangement --governs--> Donor-Advised Fund`, and to its advisor via `Donor Advisor --advises--> Donor-Advised Fund`.
- **`Sponsored Project`** — a standalone concept (not `subClassOf organization`, deliberately: it lacks independent legal status, which is the entire point). Own properties: `startDate`, `endDate`, `status` (required). Related via `Fiscal Sponsorship Arrangement --supports--> Sponsored Project` and `Sponsored Project --fiscallySponsoredBy--> Organization`.
- **`Grant Recommendation`** — a standalone concept with `date` (required), `status` (required: pending/approved/declined), and an optional `amount`. `Donor Advisor --makesRecommendation--> Grant Recommendation --recommendsRecipient--> Organization`, `--concernsFund--> Fund`, and, once accepted, `--leadsToAward--> Award` — a distinct predicate from `Decision --resultsInAward--> Award` because a recommendation and a decision are not the same kind of approval (see the business rule below).
- **A new business rule**: a Grant Recommendation is non-binding — the sponsoring organization, not the Donor Advisor, retains legal authority over whether an Award actually results. This is a defining legal feature of donor-advised funds, not incidental detail.
- `Collaborative Fund Arrangement --pools--> Fund` and `Regranting Arrangement --regrantsTo--> Organization` round out each remaining subtype with one concrete edge, so every arrangement subtype has at least one relationship beyond what it inherits from the base `Philanthropic Arrangement`.

## Milestone 3: instance data and explorer views

Two things were missing after Milestone 2: the reification pattern and the whole organizational-foundation layer had zero instance-data coverage, and the explorer had no way to browse the ontology except as one undifferentiated graph. Both are addressed now, and a second gap was found and fixed along the way.

**A second thread in the worked example.** [ontology/source/example.json](../ontology/source/example.json) still tells one direct-grant story (Ocean Conservation Fund funds Coastal Watch Alliance), but now also follows a second, connected engagement: Ocean Conservation Fund turns out to be an `Organization` in its own right — not just a `Funder` — and, separately from that Funder occupancy, also plays a `Fiscal Sponsor` role for Tidewater Youth Ocean Corps (a `Sponsored Project`), funded by a different foundation (Pacific Coastal Trust) through a `Fiscal Sponsorship Arrangement`. This is the first real instance data for `Organization`, `Organization Role` occupancy (with dates), `Fund`, and `Philanthropic Arrangement`, and it's the first proof that one organization can hold two independently-dated roles — the exact case this whole phase exists to make representable. It also exercises the `Award` party edges from Milestone 1 (`awardedBy`/`awardedTo`/`managedBy`/`fundedFrom`) diverging across three different organizations for the first time. See [Worked Example](07-worked-example.md) for how the two threads share one file.

**A second inheritance gap, same shape as Milestone 1's.** Writing that second thread required relationships like `Organization --playsRole--> Funder` (an individual typed `funder`, not the generic `organization-role`) and `Fiscal Sponsorship Arrangement --administeredBy--> Organization` (a relationship declared on the ancestor `philanthropic-arrangement`, used by a subtype instance). Both failed the generator's own `validate_example` check, which compared an individual's concept to a relationship's declared subject/object *exactly* rather than allowing a subtype — the identical mistake Milestone 1 found and fixed for properties, just never applied to relationships. Fixed the same way: a new `ancestor_ids` helper walks the `subClassOf` chain, and `validate_example` now accepts a subtype wherever an ancestor concept is declared. The site had the same gap in `getOutgoingRelationships`/`getIncomingRelationships` (an arrangement subtype's concept page never showed relationships declared on `Philanthropic Arrangement`) — fixed with the same chain-walk, refactored into a shared `getAncestorChain` alongside `getPropertiesForConcept`.

That site fix turned out to satisfy most of what "per-type inspector tab variants" was asking for, without new tabs: `Fiscal Sponsor`'s Relationships tab now shows `applies within Philanthropic Arrangement` and `Organization plays Fiscal Sponsor` automatically, inherited from `Organization Role`, and `Organization`'s tab shows `plays Organization Role` the same way it always did. A bespoke "Roles" tab on `Organization` or "occupants" tab on `Organization Role` would just be re-displaying these same schema-level facts a second time. What a dedicated tab *would* add — which real organizations occupy a role, concretely — is exactly what the Example tab now shows: it was extended to hold more than one individual per concept (`getExamplesForConcept` returns an array, not a single individual), since `Organization` and `Award` each now have two instances across the two threads. Opening `Organization`'s Example tab shows both Ocean Conservation Fund and Pacific Coastal Trust; opening `Fiscal Sponsor`'s shows the specific occupancy. Per-type tabs were judged redundant with this rather than skipped for lack of time.

**Explorer views and shapes.** `/explore` gained a view selector (`site/src/data/explorer-views.ts`) — Full Ontology, Grant Lifecycle (everything except the 15 organizational-foundation concepts), Organizations & Roles, and Funds & Arrangements (each a curated concept allowlist, composable with the existing category checkboxes) — and node-shape differentiation by concept kind: `Organization` (and `Philanthropic Intermediary`) render as a rounded rectangle, `Organization Role` subtypes as a diamond, `Fund` subtypes as a hexagon, `Philanthropic Arrangement` subtypes as a tag, everything else as the original ellipse. Shape is a secondary encoding alongside the existing category color, with a legend in the sidebar — consistent with never relying on color alone.

## What's still deferred

- **Org-level "Grant Administrator" role** — deliberately *not* added, unchanged from Milestone 1's reasoning: the existing `Grant Administrator` concept stays a person-level role, and award-level administration is covered by `award --managedBy--> organization`.
- **Donor-Advised Fund / Grant Recommendation instance data** — the worked example's second thread covers fiscal sponsorship, not the donor-advised-fund path added in Milestone 2. `Donor Advisor`, `Donor-Advised Fund`, `Donor-Advised Fund Arrangement`, and `Grant Recommendation` remain schema-only, same status they've had since Milestone 2.
- **Enterprise-architecture layer** (Business Capability, Business Process, Application System, Data Object, Integration, Policy, Organizational Unit) — explicitly out of scope until the philanthropic structure above has had real use. Planned for Milestone 4.
