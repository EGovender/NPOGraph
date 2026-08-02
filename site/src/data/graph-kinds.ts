// Graph explorer shape/filter support for `Concept.kind` (see ontology.ts).
// Kind used to be derived client-side from each concept's subClassOf chain
// and category; as of Phase 3.7 Milestone 1 it's authored directly in
// ontology/source/concepts.json instead, so this is just a passthrough --
// kept as its own function (rather than reading `concept.kind` inline
// everywhere) so callers don't need to care that the source moved.
import type { Concept, ConceptKind } from './ontology';
import { getCategory } from './categories';

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

// Node fill color is driven by category, not kind (a graph layout mixes
// categories freely, so color stays the category's job -- see categories.ts).
// Most kinds nonetheless map to exactly one category in practice, so the
// Kind key's shape swatch can honestly borrow that category's color instead
// of a generic neutral tone, making the key/filter visually match what the
// graph itself shows. Two kinds are genuine exceptions -- 'process' spans
// all five lifecycle categories and 'entity' spans two -- and stay neutral
// (undefined) rather than imply a single color that isn't true on the graph.
const KIND_CATEGORY: Partial<Record<ConceptKind, string>> = {
  organization: 'organizational-entities',
  person: 'organizational-entities',
  'organization-role': 'organizational-entities',
  'person-role': 'organizational-entities',
  classification: 'organizational-entities',
  'grant-program': 'funding-structure',
  fund: 'funding-structure',
  arrangement: 'funding-structure',
};

/** The category color to use for a kind's swatch on the Kind key, or
 * undefined for kinds that span multiple categories on the graph. */
export function kindSwatchColor(kind: ConceptKind): { light: string; dark: string } | undefined {
  const categoryId = KIND_CATEGORY[kind];
  if (!categoryId) return undefined;
  const cat = getCategory(categoryId);
  return { light: cat.colorLight, dark: cat.colorDark };
}
