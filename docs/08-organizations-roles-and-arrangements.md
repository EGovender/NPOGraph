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

**Fiscal Sponsorship Arrangement**, **Donor-Advised Fund Arrangement**, and the other specific arrangement subtypes the broader proposal names (Regranting, Sponsored Project, Collaborative Fund) are *not* added yet — see "What's deferred" below. This document's job is only to confirm the base concept can hold them later as `subClassOf philanthropic-arrangement` additions without needing to be reworked.

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

## What's deferred

Everything below is real, was part of the original proposal, and isn't being dropped — it's just not built yet, and each item names where it will attach when it is:

- **Fiscal Sponsorship Arrangement**, **Donor-Advised Fund Arrangement**, **Regranting Arrangement**, **Sponsored Project Arrangement**, **Collaborative Fund Arrangement** — each `subClassOf philanthropic-arrangement`.
- **Donor-Advised Fund** as a distinct concept (a `Fund` with donor-advisory attached) — likely `subClassOf fund`.
- **Sponsored Project** — a project or group operating under a `Fiscal Sponsor`, not itself a full `Organization`.
- **Grant Recommendation** — the donor-advisor's non-binding request that a `Fund` make an award; would relate to `award` via something like `resultsInAward`, matching this project's existing naming pattern (compare `Decision --resultsInAward--> Award`).
- **Donor Advisor Role** — `subClassOf organization-role` (or a person-role, if donor-advisors are more often individuals than organizations — an open question for that milestone, not this one).
- **`Fund --advisedBy-->` a donor or advisor** — deferred alongside Donor Advisor Role, since its natural range is more often a person than an organization, and person-valued relationships aren't modeled yet.
- **Org-level "Grant Administrator" role** — deliberately *not* added. The existing `Grant Administrator` concept stays a person-level role (the staff member handling compliance/reporting at a grantee), unchanged. Award-level administration by an organization is covered by `award --managedBy--> organization` instead of a new role class — introducing a role for this would duplicate what the direct edge already says, for a case that (unlike Funder/Fiscal Sponsor) doesn't obviously need its own dated occupancy history.
- **A second worked example** — a donor-advised-fund or fiscal-sponsorship scenario, proving the model past the direct-grant case. Until it exists, the new relationships and the `Organization Role` reification pattern introduced here have no instance-data coverage — [ontology/source/example.json](../ontology/source/example.json) still only has a direct `Funder`/`Grantee` pair (Ocean Conservation Fund / Coastal Watch Alliance). That's an accepted, explicit gap for this milestone, not an oversight.
- **Explorer UI**: a view selector (grant lifecycle / organizations & roles / funds & arrangements / full ontology), visual differentiation by node kind (organization vs. role vs. fund vs. arrangement), and per-type inspector tab variants. None of this is needed for the data model to be correct, and none of it exists yet.
- **Enterprise-architecture layer** (Business Capability, Business Process, Application System, Data Object, Integration, Policy, Organizational Unit) — explicitly out of scope until the philanthropic structure above has had real use.
