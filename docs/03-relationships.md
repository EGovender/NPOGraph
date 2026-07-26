# Relationships

This describes how the concepts in [Core Concepts](02-core-concepts.md) connect, centered on the end-to-end grant lifecycle. Names in `code font` refer to concepts defined there.

## The grant lifecycle, end to end

1. A `Funder` maintains one or more `Grant Program`s, each of which issues `Funding Opportunity`s during defined `Funding Cycle`s.
2. A `Funding Opportunity` specifies `Eligibility Criteria`, and may require a `Letter of Inquiry` before a full `Application` is invited.
3. A `Grantee` (or a project operating under a `Fiscal Sponsor`) submits an `Application`, which includes a proposed `Budget`, in response to a `Funding Opportunity`.
4. The `Application` undergoes `Review` by one or more `Reviewer`s against published `Review Criteria`, optionally including a `Site Visit`.
5. Review produces a `Decision`. An approved `Decision` results in an `Award`.
6. The `Award` is formalized by a `Grant Agreement`, which specifies `Terms and Conditions` — including whether funding is `Restricted` or `Unrestricted`, and any `Matching Requirement`.
7. The `Award`'s funds are released according to a `Payment Schedule`, broken into `Installment`s. Each `Installment` may carry a `Payment Condition` that must be met before the corresponding `Payment` is made.
8. Over the life of the `Award`, the `Grantee` may request a `Budget Modification`, and either party may propose an `Amendment` to the `Grant Agreement`.
9. The `Grant Agreement` attaches `Compliance Requirement`s, including a `Reporting Schedule` that obligates the `Grantee` to submit `Report`s, and potentially an `Audit`.
10. Reports and other evidence are assessed against the project's `Logic Model` and/or `Theory of Change`, in terms of `Output`s and `Outcome`s, often through a formal `Evaluation`.
11. Once all `Payment`s are disbursed and all `Compliance Requirement`s (reports, audits) are satisfied, the `Award` reaches `Closeout`.

This sequence is the `Grant Lifecycle`.

```mermaid
flowchart TD
    GP[Grant Program] --> FO[Funding Opportunity]
    FO --> LOI[Letter of Inquiry]
    LOI --> APP[Application]
    FO --> APP
    APP --> REV[Review]
    REV --> DEC[Decision]
    DEC -->|approved| AWD[Award]
    AWD --> AGR[Grant Agreement]
    AGR --> PS[Payment Schedule]
    PS --> INST[Installment]
    INST --> PAY[Payment]
    AGR --> CR[Compliance Requirement]
    CR --> RS[Reporting Schedule]
    RS --> RPT[Report]
    RPT --> EVAL[Evaluation]
    EVAL --> OUT[Outcome]
    PAY --> CLOSE[Closeout]
    RPT --> CLOSE
```

## Key relationship rules (draft)

These are candidate business rules implied by the lifecycle above. They need review and are likely to have real-world exceptions — see [CONTRIBUTING.md](../CONTRIBUTING.md) to challenge or refine them.

- An `Award` cannot exist without a `Decision` that approved an `Application` (or, in funder-initiated giving, an equivalent internal approval).
- A `Payment` cannot exist without an `Award` and, typically, a `Grant Agreement` — though some funders disburse an initial installment before a fully signed agreement is in place.
- An `Installment`'s `Payment Condition`, if any, must be satisfied before its corresponding `Payment` is released.
- A `Compliance Requirement` is always attached to a specific `Award`, not to the `Grantee` in the abstract — the same organization can be in good standing on one award and delinquent on another.
- `Closeout` requires both financial conditions (all `Payment`s made or the award formally reduced) and reporting conditions (all required `Report`s accepted) to be true.
- An `Amendment` changes the `Grant Agreement` going forward; it does not retroactively alter `Payment`s or `Report`s already completed under the prior terms.

## Organizational relationships

- `Funder`, `Grantee`, and `Fiscal Sponsor` are specializations of `Organization Role`, not of `Organization` directly — an `Organization` **plays** a role (`Organization --playsRole--> Organization Role`), and that occupancy **applies within** a specific `Philanthropic Arrangement` (`Organization Role --appliesWithin--> Philanthropic Arrangement`). This is what lets the same legal entity act as a `Funder` in one relationship and a `Grantee` in another (e.g., a community foundation re-granting government funds) without contradiction — see [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md) for the full reasoning.
- An `Organization` also has a `hasLegalForm` relationship to an `Organization Type` (e.g., Public Charity, Private Foundation) — its legal/tax classification, independent of any role it plays.
- A `Philanthropic Intermediary` is an organization classification (an `Organization` known for facilitating philanthropy on others' behalf), distinct from the `Funding Intermediary Role` it actually occupies in a given arrangement — a classification isn't a role, and an organization can be classified as an intermediary without every one of its engagements exercising that role.
- A `Fiscal Sponsor` stands in for a `Grantee` that lacks independent legal status to receive an `Award` directly; the `Grant Agreement` is between the `Funder` and the `Fiscal Sponsor` on behalf of the sponsored project.
- An `Award` names its parties directly and separately: who `awardedBy` (the original funding source), who it's `awardedTo` (the ultimate recipient), what `Fund` it's `fundedFrom`, and who's `managedBy` (day-to-day administration) — in a direct grant these collapse to the same two organizations as always; in intermediary philanthropy they can name three or four different ones.
- A `Grant Program` is `fundedBy` a `Fund` — the financial pool behind the program's giving strategy, distinct from the program itself.
- A `Program Officer` is associated with one or more `Grant Program`s and typically owns the `Review` and ongoing monitoring relationship for `Award`s made under them.
- A `Grant Administrator` is the `Grantee`-side counterpart, typically responsible for `Report` submission and `Compliance Requirement` tracking.

## Open questions

- Does `Evaluation` belong strictly after `Closeout`, or can it run concurrently with an active `Award` (e.g., mid-grant evaluation informing a renewal)?
- Should `Decision` be its own concept, or folded into `Review` as an attribute?
- How should the specific arrangement subtypes (Fiscal Sponsorship, Donor-Advised Fund, Regranting, and the rest listed in [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md)) be distinguished — one shared `arrangementType` property, or a `subClassOf` hierarchy under `Philanthropic Arrangement`, matching how `Funder`/`Grantee`/`Fiscal Sponsor` are subtypes of `Organization Role`?

Open an issue to discuss any of these before they're resolved in a future revision. (Re-granting — a `Grantee` that is itself a `Funder` to sub-grantees — used to be an open question here; it's resolved by the `Organization Role` pattern above: the same `Organization` simply holds two separate role occupancies, one per arrangement.)
