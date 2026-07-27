// Which of the graph explorer's 7 visual node kinds a concept renders as.
// The first four are derived by walking the subClassOf chain (a subtype
// picks up its ancestor's kind, e.g. Funder -> organization-role,
// Philanthropic Intermediary -> organization) -- same rule
// getPropertiesForConcept/getOutgoingRelationships already use for
// properties and relationships. Concepts that don't subclass any of those
// four families fall back to their `category`: everything in
// funding-structure that isn't already a fund/arrangement is grant-program
// setup (Grant Program, Funding Opportunity, Funding Cycle, Eligibility
// Criteria, Budget); everything in the five categories that make up the
// original grant-lifecycle model is `grant`. What's left (organization
// types, person-level roles, the cross-cutting Grant Lifecycle marker
// concept) is `other`.
import type { Concept } from './ontology';

export type ConceptKind =
  | 'organization'
  | 'organization-role'
  | 'grant-program'
  | 'grant'
  | 'fund'
  | 'arrangement'
  | 'other';

const GRANT_LIFECYCLE_CATEGORIES = new Set([
  'application-and-review',
  'award-and-agreement',
  'disbursement',
  'compliance-and-reporting',
  'outcomes-and-closeout',
]);

export function conceptKind(concept: Concept, conceptsById: Map<string, Concept>): ConceptKind {
  let current: Concept | undefined = concept;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.id === 'organization-role') return 'organization-role';
    if (current.id === 'fund') return 'fund';
    if (current.id === 'philanthropic-arrangement') return 'arrangement';
    if (current.id === 'organization') return 'organization';
    current = current.subClassOf ? conceptsById.get(current.subClassOf) : undefined;
  }
  if (concept.category === 'funding-structure') return 'grant-program';
  if (GRANT_LIFECYCLE_CATEGORIES.has(concept.category)) return 'grant';
  return 'other';
}

// All 7 kinds, used for both the shape legend and the kind-filter checkbox
// list -- 'other' is a real, checkable bucket like the rest, not a special
// case appended separately.
export const KIND_LEGEND: { kind: ConceptKind; label: string }[] = [
  { kind: 'organization', label: 'Organization' },
  { kind: 'organization-role', label: 'Organization Role' },
  { kind: 'grant-program', label: 'Grant Program' },
  { kind: 'grant', label: 'Grant' },
  { kind: 'fund', label: 'Fund' },
  { kind: 'arrangement', label: 'Arrangement' },
  { kind: 'other', label: 'Other' },
];
