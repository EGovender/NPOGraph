# Vision

NPOGraph is an open-source knowledge platform that helps the nonprofit sector understand, design, and improve grantmaking through a shared semantic model.

## The problem

Every organization that touches grantmaking — a foundation's grants team, a nonprofit's development staff, a grants-management SaaS vendor, a fiscal sponsor's finance team — carries around its own private, informal model of what a "grant" is: what stages it moves through, what a "report" means, when a "payment" is allowed to happen, what makes a grant "compliant." These models mostly agree with each other, but not precisely, and none of them are written down anywhere a newcomer or a software team can consult.

The result is that every new tool, integration, and onboarding starts from scratch: re-deriving the same concepts, re-litigating the same edge cases (does an installment require a report first? can an award exist without a signed agreement?), and re-inventing the same vocabulary with slightly different words.

## The approach

NPOGraph starts from the belief that grantmaking is well-understood enough, and important enough, to deserve an open, shared, precisely-defined model — the same way industries with mature standards (accounting, shipping, healthcare data) have one.

Concretely, that means:

1. **Write it down in plain language first.** Before any ontology format, database schema, or API is designed, the concepts and relationships need to be described in terms a program officer or grants manager would recognize, not just an engineer.
2. **Treat it as a real, versioned artifact.** Changes to the model go through the same review process as code: proposed, discussed, and merged, with a visible history.
3. **Let the model drive everything downstream.** Once the concepts are stable, machine-readable representations (JSON-LD, OWL, RDF, SHACL) and an interactive explorer can be generated from — or checked against — the same source of truth, instead of drifting from it.
4. **Start narrow, design for breadth.** The first version of the ontology covers grantmaking end-to-end. The structure is deliberately chosen so that other nonprofit domains (fundraising, CRM, finance, programs) can be added later as extensions of a shared core, rather than requiring a rewrite.

## What success looks like

- A grants manager can look up "installment" or "compliance requirement" in NPOGraph and get a definition that matches how their organization actually works, with the surrounding relationships made explicit.
- A software team building a grants-management feature can start from NPOGraph's concepts and relationships instead of inventing their own, and can point back to NPOGraph as a source of truth in a design review.
- A newcomer to grantmaking can walk through the concepts in order — application, review, award, agreement, disbursement, reporting, closeout — and come away with an accurate mental model, not just a glossary.
- The project has enough outside contributors, and enough of a review process, that no single person's opinion silently becomes "the spec."

## What NPOGraph is not (yet)

This is not a grants-management product, a CRM, or a replacement for existing nonprofit software. It does not currently have any application code, API, or machine-readable ontology — see the [roadmap](04-roadmap.md) for how those are expected to follow once the underlying model is solid.
