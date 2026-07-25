// Data-access layer over the ontology, synced at build time from
// ontology/source/*.json at the repo root (see scripts/sync-ontology-data.mjs
// and docs/05-data-model.md). Nothing here should hand-author ontology
// content -- it only shapes/looks up what's already in the JSON.
import conceptsData from './generated/concepts.json';
import relationshipsData from './generated/relationships.json';

export interface Concept {
  id: string;
  label: string;
  aliases: string[];
  category: string;
  definition: string;
  subClassOf: string | null;
  docRef: string;
}

export interface Relationship {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  label: string;
  description: string;
  docRef: string;
}

export const concepts = conceptsData as Concept[];
export const relationships = relationshipsData as Relationship[];

const CONCEPTS_BY_ID = new Map(concepts.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return CONCEPTS_BY_ID.get(id);
}

export function requireConcept(id: string): Concept {
  const c = getConcept(id);
  if (!c) throw new Error(`Unknown concept id: ${id}`);
  return c;
}

export interface RelatedConcept {
  relationship: Relationship;
  concept: Concept;
}

/** Relationships where the given concept is the subject ("this concept ... other concept"). */
export function getOutgoingRelationships(conceptId: string): RelatedConcept[] {
  return relationships
    .filter((r) => r.subject === conceptId)
    .map((r) => ({ relationship: r, concept: requireConcept(r.object) }));
}

/** Relationships where the given concept is the object ("other concept ... this concept"). */
export function getIncomingRelationships(conceptId: string): RelatedConcept[] {
  return relationships
    .filter((r) => r.object === conceptId)
    .map((r) => ({ relationship: r, concept: requireConcept(r.subject) }));
}

/** Concepts whose subClassOf points at the given concept. */
export function getSubtypes(conceptId: string): Concept[] {
  return concepts.filter((c) => c.subClassOf === conceptId);
}

const GITHUB_BLOB_BASE = 'https://github.com/EGovender/NPOGraph/blob/main/';

export function docUrl(docRef: string): string {
  return GITHUB_BLOB_BASE + docRef;
}

const GITHUB_ONTOLOGY_BASE = 'https://github.com/EGovender/NPOGraph/blob/main/ontology/';

export const machineFormats = [
  { label: 'OWL (Turtle)', href: GITHUB_ONTOLOGY_BASE + 'npograph.ttl' },
  { label: 'RDF/XML', href: GITHUB_ONTOLOGY_BASE + 'npograph.rdf' },
  { label: 'N-Triples', href: GITHUB_ONTOLOGY_BASE + 'npograph.nt' },
  { label: 'JSON-LD', href: GITHUB_ONTOLOGY_BASE + 'npograph.jsonld' },
];
