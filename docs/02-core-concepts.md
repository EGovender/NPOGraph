# Core Concepts (v0.1)

This is the first-draft set of core grantmaking concepts — roughly 40, grouped by where they sit in the grant lifecycle. Each entry is a working definition, not a final one; see [CONTRIBUTING.md](../CONTRIBUTING.md) for how to propose changes.

Definitions are intentionally implementation-agnostic: no field names, no database types. See [Relationships](03-relationships.md) for how these concepts connect, and the [Roadmap](04-roadmap.md) for when machine-readable versions of these will exist.

## Organizational entities

1. **Organization** — Any legal entity participating in grantmaking, either as a funder or a recipient. The general category that Funder and Grantee specialize.
2. **Funder** — An organization (foundation, government agency, corporation, or individual) that provides funding through grants.
3. **Grantee** — An organization or individual that receives a grant award. Also called a recipient or subrecipient when funds are re-granted.
4. **Fiscal Sponsor** — An organization that accepts and administers grant funds on behalf of a project or group that isn't itself a legal entity able to receive grants directly.
5. **Program Officer** — An individual at a funder responsible for managing a portfolio of grants, from soliciting or reviewing applications through monitoring active awards.
6. **Reviewer** — An individual (staff, board member, or external peer reviewer) who evaluates an application against review criteria.
7. **Grant Administrator** — An individual at the grantee organization responsible for compliance, reporting, and financial management of an award.

## Funding structure

8. **Grant Program** — A funder's standing area of giving (e.g., "Environmental Justice Grants"), under which funding opportunities are issued over time.
9. **Funding Opportunity** — A specific, time-bound invitation to apply for funding under a grant program, with defined eligibility, focus area, and deadlines. Often called an RFP (Request for Proposals) or NOFO (Notice of Funding Opportunity).
10. **Funding Cycle** — A recurring period (e.g., quarterly, annual) within a grant program during which applications are accepted and decided.
11. **Eligibility Criteria** — The conditions an organization or project must meet to apply to a funding opportunity.
12. **Budget** — A structured estimate of costs associated with a proposed or funded project, broken into categories (e.g., personnel, overhead, direct program costs).

## Application and review

13. **Letter of Inquiry (LOI)** — A brief, preliminary submission used by some funders to screen interest before inviting a full application.
14. **Application** — A grantee's formal submission requesting funding under a specific funding opportunity, including a proposal narrative and budget.
15. **Review** — The process of evaluating an application, producing a recommendation and often a score, conducted by one or more reviewers.
16. **Review Criteria** — The published or internal standards (e.g., alignment with mission, feasibility, budget reasonableness) against which applications are scored.
17. **Site Visit** — An optional step where a funder representative visits or meets with an applicant to assess capacity or verify claims before a decision.
18. **Decision** — The outcome of the review process for an application: approved, declined, or approved with conditions.

## Award and agreement

19. **Award** — A funder's formal commitment to provide a specific amount of funding to a grantee, following an approved application or decision.
20. **Grant Agreement** — The legal document, signed by both funder and grantee, that formalizes an award's terms, conditions, and obligations.
21. **Terms and Conditions** — The specific obligations, restrictions, and expectations attached to an award (e.g., allowable uses of funds, reporting requirements).
22. **Restricted Funding** — Funding that must be used for a specific purpose, project, or time period defined in the grant agreement.
23. **Unrestricted Funding** — Funding a grantee may use at its discretion in support of its general mission.
24. **Matching Requirement** — A condition requiring the grantee to raise or contribute additional funds alongside the award, often as a ratio (e.g., 1:1 match).
25. **Amendment** — A formally agreed change to an existing grant agreement's terms, budget, timeline, or amount, made after the original agreement was signed.

## Disbursement

26. **Payment Schedule** — The agreed timing and amounts by which award funds will be disbursed to the grantee.
27. **Installment** — A single scheduled portion of an award's total funds, to be disbursed at a defined point or upon meeting a condition.
28. **Payment** — An actual transfer of funds from funder to grantee against an award, corresponding to one or more installments.
29. **Payment Condition** — A requirement (e.g., a submitted report, a milestone reached) that must be satisfied before a scheduled payment is released.
30. **Budget Modification** — A grantee-requested, funder-approved change to how awarded funds are allocated across budget categories, without changing the total award amount.

## Compliance and reporting

31. **Compliance Requirement** — An obligation attached to an award that the grantee must satisfy to remain in good standing (e.g., timely reporting, allowable use of funds, insurance).
32. **Reporting Schedule** — The agreed cadence and due dates for narrative and financial reports over the life of an award.
33. **Report** — A grantee's submission to the funder describing progress, outcomes, and/or use of funds, per the reporting schedule. Narrative and financial reports are common subtypes.
34. **Audit** — A formal, independent examination of a grantee's financial records, either as a general organizational requirement or specific to a grant.
35. **Indirect Cost Rate** — The negotiated or de minimis rate at which a grantee may charge overhead/administrative costs against an award.

## Outcomes and closeout

36. **Theory of Change** — A grantee's or funder's articulated model of how specific activities are expected to lead to desired long-term change.
37. **Logic Model** — A structured diagram connecting a project's inputs, activities, outputs, and outcomes, used to plan and evaluate a grant-funded project.
38. **Output** — A direct, countable product of grant-funded activity (e.g., number of workshops held, people served).
39. **Outcome** — A change in condition, behavior, knowledge, or status that results from grant-funded activity, distinct from an output.
40. **Evaluation** — A structured assessment of whether a grant-funded project achieved its intended outputs and outcomes.
41. **Closeout** — The formal conclusion of a grant award once all funds are disbursed, all reports are submitted and accepted, and all compliance requirements are satisfied.

## Cross-cutting

42. **Grant Lifecycle** — The end-to-end sequence a grant moves through, from funding opportunity through application, review, award, disbursement, reporting, and closeout. See [Relationships](03-relationships.md) for the full sequence.

---

This list is a starting point (v0.1), not a final ontology. Open an issue or PR to propose a missing concept, challenge a definition, or suggest a merge/split — see [CONTRIBUTING.md](../CONTRIBUTING.md).
