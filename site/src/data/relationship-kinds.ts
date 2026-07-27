// Which of the graph explorer's relationship-type filter buckets a
// relationship belongs to. Unlike concept kind, this can't be derived from
// any existing field: the ontology is schema-level, not per-instance data,
// so each of the ~60 predicates is used by only one (or a small handful of)
// relationship(s) -- there's no reusable "type" to key off. This is a
// one-time hand classification instead, verified against every
// subject/predicate/object triple in ontology/source/*.json.
//
// 'structural' isn't listed here -- it's assigned directly by GraphExplorer
// to the subClassOf edges it synthesizes itself, which never appear in
// relationships.json.
export type RelationshipKind =
  | 'structural'
  | 'organizational'
  | 'funding'
  | 'process'
  | 'compliance'
  | 'outcomes';

export const RELATIONSHIP_KIND_LABELS: Record<RelationshipKind, string> = {
  structural: 'Structural (is a)',
  organizational: 'Organizational',
  funding: 'Funding & program setup',
  process: 'Application & decision',
  compliance: 'Award, disbursement & compliance',
  outcomes: 'Outcomes & closeout',
};

const PREDICATE_KIND: Record<string, RelationshipKind> = {
  // Organizational -- role/occupancy/who's-involved edges.
  playsRole: 'organizational',
  hasLegalForm: 'organizational',
  actsOnBehalfOf: 'organizational',
  appliesWithin: 'organizational',
  participatesIn: 'organizational',
  administeredBy: 'organizational',
  heldBy: 'organizational',
  awardedBy: 'organizational',
  awardedTo: 'organizational',
  managedBy: 'organizational',
  fiscallySponsoredBy: 'organizational',
  conductedByReviewer: 'organizational',
  associatedWithGrantProgram: 'organizational',
  responsibleForReport: 'organizational',
  responsibleForComplianceRequirement: 'organizational',
  advises: 'organizational',
  supports: 'organizational',
  regrantsTo: 'organizational',
  recommendsRecipient: 'organizational',

  // Funding & program setup.
  maintainsGrantProgram: 'funding',
  issuesFundingOpportunity: 'funding',
  occursDuringFundingCycle: 'funding',
  specifiesEligibilityCriteria: 'funding',
  mayRequireLetterOfInquiry: 'funding',
  fundedBy: 'funding',
  fundedFrom: 'funding',
  includesBudget: 'funding',
  governs: 'funding',
  pools: 'funding',
  concernsFund: 'funding',

  // Application & decision.
  submitsApplication: 'process',
  respondsToFundingOpportunity: 'process',
  undergoesReview: 'process',
  evaluatedAgainstReviewCriteria: 'process',
  mayIncludeSiteVisit: 'process',
  producesDecision: 'process',
  resultsInAward: 'process',
  makesRecommendation: 'process',
  leadsToAward: 'process',

  // Award, disbursement & compliance.
  formalizedByGrantAgreement: 'compliance',
  specifiesTermsAndConditions: 'compliance',
  mayIncludeMatchingRequirement: 'compliance',
  maySpecifyRestrictedFunding: 'compliance',
  maySpecifyUnrestrictedFunding: 'compliance',
  hasPaymentSchedule: 'compliance',
  brokenIntoInstallment: 'compliance',
  mayHavePaymentCondition: 'compliance',
  disbursedAsPayment: 'compliance',
  mayRequestBudgetModification: 'compliance',
  modifiesGrantAgreement: 'compliance',
  attachesComplianceRequirement: 'compliance',
  includesReportingSchedule: 'compliance',
  mayIncludeAudit: 'compliance',
  obligatesReport: 'compliance',

  // Outcomes & closeout.
  assessedAgainstLogicModel: 'outcomes',
  assessedAgainstTheoryOfChange: 'outcomes',
  assessesOutput: 'outcomes',
  assessesOutcome: 'outcomes',
  reachesCloseout: 'outcomes',
  followsGrantLifecycle: 'outcomes',
};

export function relationshipKind(predicate: string): RelationshipKind {
  return PREDICATE_KIND[predicate] ?? 'organizational';
}
