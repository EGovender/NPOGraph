// Graph explorer shape/filter support for `Concept.kind` (see ontology.ts).
// Kind used to be derived client-side from each concept's subClassOf chain
// and category; as of Phase 3.7 Milestone 1 it's authored directly in
// ontology/source/concepts.json instead, so this is just a passthrough --
// kept as its own function (rather than reading `concept.kind` inline
// everywhere) so callers don't need to care that the source moved.
import type { Concept, ConceptKind } from './ontology';

export function conceptKind(concept: Concept): ConceptKind {
  return concept.kind;
}

// Used for both the shape legend and the kind-filter checkbox list.
export const KIND_LEGEND: { kind: ConceptKind; label: string }[] = [
  { kind: 'organization', label: 'Organization' },
  { kind: 'person', label: 'Person' },
  { kind: 'organization-role', label: 'Organization Role' },
  { kind: 'person-role', label: 'Person Role' },
  { kind: 'fund', label: 'Fund' },
  { kind: 'grant-program', label: 'Grant Program' },
  { kind: 'arrangement', label: 'Arrangement' },
  { kind: 'classification', label: 'Classification' },
  { kind: 'process', label: 'Process' },
  { kind: 'entity', label: 'Entity' },
];
