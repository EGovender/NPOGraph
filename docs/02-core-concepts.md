# Core Concepts (v0.2)

This is the working set of core grantmaking and nonprofit-knowledge-model concepts — roughly 65, grouped by where they sit in the grant lifecycle or the organizational model. Each entry is a working definition, not a final one; see [CONTRIBUTING.md](../CONTRIBUTING.md) for how to propose changes.

Definitions are intentionally implementation-agnostic: no field names, no database types. See [Relationships](03-relationships.md) for how these concepts connect, and the [Roadmap](04-roadmap.md) for when machine-readable versions of these will exist.

## Organizational entities

As of Phase 3.7 Milestone 1, this section distinguishes four related-but-different ideas that earlier drafts didn't separate cleanly:

- **Entity vs. role** — an Organization or a Person is a stable, identifiable thing; a Role is a contextual capacity it occupies, which can change, end, or apply only within one arrangement, while the entity itself persists.
- **Person vs. Person Role** — a Person is a natural person; a Person Role (Employee, Reviewer, Donor Advisor, ...) is something a person *occupies*, not a permanent trait of who they are. The same person can hold several Person Roles at once, each independently dated and scoped.
- **Organization vs. Organization Role** — the same distinction, for organizations (see [Organizations, Roles & Arrangements](08-organizations-roles-and-arrangements.md) for the fuller treatment this milestone builds on).
- **Role type vs. role occupancy** — "Funder" or "Employee" as a concept is a reusable role *type*; a specific organization or person actually holding that role in a specific context (with its own start date, status, and scope) is a role *occupancy*. This ontology models occupancies as instances of the role-type concepts, not as a separate layer — see the worked example.

1. **Role** — A contextual capacity an agent (a Person or an Organization) occupies, distinct from the agent's permanent identity or classification. The shared parent of Person Role and Organization Role; carries the properties every role occupancy needs regardless of who holds it (effective dates, status, scope, notes), inherited by every subtype below.
2. **Person** — A natural person who participates in nonprofit, philanthropic, governance, employment, advisory, or service relationships. Also called an individual or natural person. A Person is not itself a role — see Person Role.
3. **Organization** — Any legal entity participating in grantmaking or philanthropy. An organization occupies one or more contextual roles (see Organization Role) rather than being permanently classified as a funder or a recipient.
4. **Person Role** — A contextual capacity a person occupies within an organization, award, application, agreement, arrangement, program, project, or other defined context. The person performing the same function for two different organizations, or in two different capacities for the same organization, holds two separate Person Role occupancies.
5. **Organization Role** — A contextual capacity an organization occupies within a specific arrangement or award — such as acting as a funder, grant recipient, or fiscal sponsor — rather than a permanent trait of the organization itself.
6. **Organization Type** — The legal and tax classification of what an organization fundamentally is (e.g., a public charity, private foundation, or government entity), independent of any role it plays in a specific relationship. Phase 3.7 Milestone 4 splits this into Legal Form, Tax Status, and Organization Classification as governed reference data.
7. **Employee** — The role a person occupies when they work for and are compensated by an organization.
8. **Board Member** — The role a person occupies when they serve on an organization's governing board.
9. **Program Officer** — The role a person occupies when they manage a portfolio of grants on behalf of a funder, from soliciting or reviewing applications through monitoring active awards.
10. **Reviewer** — The role a person occupies when they evaluate an application against review criteria, whether as staff, a board member, or an external peer reviewer.
11. **Grant Administrator** — The role a person occupies when they are responsible for compliance, reporting, and financial management of an award on behalf of the grantee organization.
12. **Donor** — The role a person occupies when they contribute charitable funds to an organization or fund, without necessarily holding advisory privileges over how they are used.
13. **Donor Advisor** — The role a person occupies when they hold non-binding privileges to recommend grants and investments from a Donor-Advised Fund, typically as the fund's original donor.
14. **Applicant Contact** — The role a person occupies when they serve as the primary point of contact for an application submitted on behalf of an organization or project.
15. **Authorized Signatory** — The role a person occupies when they are authorized to sign a grant agreement or other governing document on behalf of an organization.
16. **Consultant** — The role a person occupies when they provide paid, defined-scope services to an organization without being its employee.
17. **Funder** — The role an organization occupies when it provides funding to grantees through grant programs and awards. Also called a grantmaker.
18. **Grantee** — The role an organization occupies when it receives and administers grant funding awarded by a funder. Also called a recipient or subrecipient when funds are re-granted.
19. **Fiscal Sponsor** — The role an organization occupies when it provides the legal and administrative infrastructure that lets another entity or project receive charitable funding on its behalf.
20. **Philanthropic Intermediary** — An organization commonly known for facilitating philanthropy on behalf of others — such as by re-granting, fiscal sponsorship, or hosting donor-advised funds — regardless of which specific role it occupies in a given arrangement.
21. **Funding Intermediary Role** — The role an organization occupies when it channels funds between an original funding source and an ultimate grantee, without itself being the original funder or the final recipient.
22. **Sponsored Project** — A project or group carrying out charitable activity under a Fiscal Sponsor's legal and administrative umbrella, without being itself an independent Organization.

## Funding structure

23. **Grant Program** — A funder's standing area of giving (e.g., "Environmental Justice Grants"), under which funding opportunities are issued over time.
24. **Fund** — A designated pool of financial resources set aside for a purpose, distinct from the grant program or strategy that directs how it's used.
25. **Donor-Advised Fund (DAF)** — A Fund held by a sponsoring organization, over which a Donor Advisor holds non-binding privileges to recommend grants and investments.
26. **Funding Opportunity** — A specific, time-bound invitation to apply for funding under a grant program, with defined eligibility, focus area, and deadlines. Often called an RFP (Request for Proposals) or NOFO (Notice of Funding Opportunity).
27. **Funding Cycle** — A recurring period (e.g., quarterly, annual) within a grant program during which applications are accepted and decided.
28. **Eligibility Criteria** — The conditions an organization or project must meet to apply to a funding opportunity.
29. **Budget** — A structured estimate of costs associated with a proposed or funded project, broken into categories (e.g., personnel, overhead, direct program costs).
30. **Philanthropic Arrangement** — A structured relationship among organizations that channels philanthropic funding outside a direct funder-to-grantee award — such as a fiscal sponsorship or donor-advised fund arrangement.
31. **Fiscal Sponsorship Arrangement** — A Philanthropic Arrangement in which a Fiscal Sponsor accepts and administers charitable funds on behalf of a Sponsored Project that lacks independent legal status to receive them directly.
32. **Donor-Advised Fund Arrangement** — A Philanthropic Arrangement in which a Donor Advisor holds non-binding advisory privileges over grants made from a Donor-Advised Fund.
33. **Regranting Arrangement** — A Philanthropic Arrangement in which an organization receives funds and redistributes them to other organizations, acting as both a Grantee to the original source and a Funder or Funding Intermediary to the recipients.
34. **Collaborative Fund Arrangement** — A Philanthropic Arrangement in which multiple funders pool resources into a shared Fund and jointly direct or oversee its grantmaking.

## Application and review

35. **Letter of Inquiry (LOI)** — A brief, preliminary submission used by some funders to screen interest before inviting a full application.
36. **Application** — A grantee's formal submission requesting funding under a specific funding opportunity, including a proposal narrative and budget.
37. **Review** — The process of evaluating an application, producing a recommendation and often a score, conducted by one or more reviewers.
38. **Review Criteria** — The published or internal standards (e.g., alignment with mission, feasibility, budget reasonableness) against which applications are scored.
39. **Site Visit** — An optional step where a funder representative visits or meets with an applicant to assess capacity or verify claims before a decision.
40. **Decision** — The outcome of the review process for an application: approved, declined, or approved with conditions.
41. **Grant Recommendation** — A Donor Advisor's non-binding request that a Donor-Advised Fund make an award to a specific recipient; the fund's sponsoring organization retains final authority to accept or decline it.

## Award and agreement

42. **Award** — A funder's formal commitment to provide a specific amount of funding to a grantee, following an approved application or decision.
43. **Grant Agreement** — The legal document, signed by both funder and grantee, that formalizes an award's terms, conditions, and obligations.
44. **Terms and Conditions** — The specific obligations, restrictions, and expectations attached to an award (e.g., allowable uses of funds, reporting requirements).
45. **Restricted Funding** — Funding that must be used for a specific purpose, project, or time period defined in the grant agreement.
46. **Unrestricted Funding** — Funding a grantee may use at its discretion in support of its general mission.
47. **Matching Requirement** — A condition requiring the grantee to raise or contribute additional funds alongside the award, often as a ratio (e.g., 1:1 match).
48. **Amendment** — A formally agreed change to an existing grant agreement's terms, budget, timeline, or amount, made after the original agreement was signed.

## Disbursement

49. **Payment Schedule** — The agreed timing and amounts by which award funds will be disbursed to the grantee.
50. **Installment** — A single scheduled portion of an award's total funds, to be disbursed at a defined point or upon meeting a condition.
51. **Payment** — An actual transfer of funds from funder to grantee against an award, corresponding to one or more installments.
52. **Payment Condition** — A requirement (e.g., a submitted report, a milestone reached) that must be satisfied before a scheduled payment is released.
53. **Budget Modification** — A grantee-requested, funder-approved change to how awarded funds are allocated across budget categories, without changing the total award amount.

## Compliance and reporting

54. **Compliance Requirement** — An obligation attached to an award that the grantee must satisfy to remain in good standing (e.g., timely reporting, allowable use of funds, insurance).
55. **Reporting Schedule** — The agreed cadence and due dates for narrative and financial reports over the life of an award.
56. **Report** — A grantee's submission to the funder describing progress, outcomes, and/or use of funds, per the reporting schedule. Narrative and financial reports are common subtypes.
57. **Audit** — A formal, independent examination of a grantee's financial records, either as a general organizational requirement or specific to a grant.
58. **Indirect Cost Rate** — The negotiated or de minimis rate at which a grantee may charge overhead/administrative costs against an award.

## Outcomes and closeout

59. **Theory of Change** — A grantee's or funder's articulated model of how specific activities are expected to lead to desired long-term change.
60. **Logic Model** — A structured diagram connecting a project's inputs, activities, outputs, and outcomes, used to plan and evaluate a grant-funded project.
61. **Output** — A direct, countable product of grant-funded activity (e.g., number of workshops held, people served).
62. **Outcome** — A change in condition, behavior, knowledge, or status that results from grant-funded activity, distinct from an output.
63. **Evaluation** — A structured assessment of whether a grant-funded project achieved its intended outputs and outcomes.
64. **Closeout** — The formal conclusion of a grant award once all funds are disbursed, all reports are submitted and accepted, and all compliance requirements are satisfied.

## Cross-cutting

65. **Grant Lifecycle** — The end-to-end sequence a grant moves through, from funding opportunity through application, review, award, disbursement, reporting, and closeout. See [Relationships](03-relationships.md) for the full sequence.

---

This list is a working draft (v0.2), not a final ontology. Open an issue or PR to propose a missing concept, challenge a definition, or suggest a merge/split — see [CONTRIBUTING.md](../CONTRIBUTING.md).
