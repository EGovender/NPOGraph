// Data-access layer over the ontology, synced at build time from
// ontology/source/*.json at the repo root (see scripts/sync-ontology-data.mjs
// and docs/05-data-model.md, docs/06-properties-and-rules.md). Nothing here
// should hand-author ontology content -- it only shapes/looks up what's
// already in the JSON.
import conceptsData from './generated/concepts.json';
import relationshipsData from './generated/relationships.json';
import propertiesData from './generated/properties.json';
import businessRulesData from './generated/business-rules.json';
import metaData from './generated/meta.json';
import exampleData from './generated/example.json';
import { getCategory } from './categories';

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

export type PropertyGroupSource = 'lifecycle' | 'financial' | 'governance' | 'classification';
export type PropertyDatatype = 'string' | 'decimal' | 'date' | 'boolean' | 'enum';

export interface Property {
  id: string;
  concept: string;
  name: string;
  label: string;
  group: PropertyGroupSource;
  datatype: PropertyDatatype;
  required: boolean;
  cardinality: 'one' | 'many';
  allowedValues: string[] | null;
  description: string;
}

export interface BusinessRule {
  id: string;
  label: string;
  description: string;
  concepts: string[];
  docRef: string;
}

export interface ExampleIndividual {
  id: string;
  concept: string;
  label: string;
  properties: Record<string, string>;
  narrative: string;
}

export interface ExampleRelationshipEntry {
  predicate: string;
  subject: string;
  object: string;
}

export interface WorkedExample {
  id: string;
  title: string;
  summary: string;
  individuals: ExampleIndividual[];
  relationships: ExampleRelationshipEntry[];
}

export const concepts = conceptsData as Concept[];
export const relationships = relationshipsData as Relationship[];
export const properties = propertiesData as Property[];
export const businessRules = businessRulesData as BusinessRule[];
export const ontologyVersion: string = (metaData as { version: string }).version;
export const workedExample = exampleData as WorkedExample;

const CONCEPTS_BY_ID = new Map(concepts.map((c) => [c.id, c]));

export function getConcept(id: string): Concept | undefined {
  return CONCEPTS_BY_ID.get(id);
}

const EXAMPLE_BY_CONCEPT = new Map(workedExample.individuals.map((i) => [i.concept, i]));

/** The worked example's individual for this concept, if the scenario touches it. */
export function getExampleForConcept(conceptId: string): ExampleIndividual | undefined {
  return EXAMPLE_BY_CONCEPT.get(conceptId);
}

const EXAMPLE_INDIVIDUALS_BY_ID = new Map(workedExample.individuals.map((i) => [i.id, i]));

export function requireExampleIndividual(id: string): ExampleIndividual {
  const i = EXAMPLE_INDIVIDUALS_BY_ID.get(id);
  if (!i) throw new Error(`Unknown example individual id: ${id}`);
  return i;
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

/** Hand-authored attributes for a concept (lifecycle/financial/governance/classification), sorted. */
export function getPropertiesForConcept(conceptId: string): Property[] {
  return properties
    .filter((p) => p.concept === conceptId)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Business rules that name this concept, sorted. */
export function getBusinessRulesForConcept(conceptId: string): BusinessRule[] {
  return businessRules
    .filter((r) => r.concepts.includes(conceptId))
    .sort((a, b) => a.id.localeCompare(b.id));
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

export const ONTOLOGY_NAMESPACE = 'https://egovender.github.io/NPOGraph/ontology/';

export function conceptIri(conceptId: string): string {
  return ONTOLOGY_NAMESPACE + conceptId;
}

export function conceptJsonLd(concept: Concept): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@id': 'npo:' + concept.id,
    '@type': 'owl:Class',
    label: concept.label,
    definition: concept.definition,
    category: concept.category,
  };
  if (concept.aliases.length > 0) node.altLabel = concept.aliases;
  if (concept.subClassOf) node.subClassOf = 'npo:' + concept.subClassOf;
  return node;
}

/** A single row in the Properties/Technical tabs: a label + a value that may
 * itself be a set of constraints (required/cardinality/allowedValues) rather
 * than a plain string. */
export interface DisplayField {
  label: string;
  value: string;
  property?: Property;
  href?: string;
}

export interface DisplayGroup {
  id: string;
  label: string;
  fields: DisplayField[];
}

const GROUP_LABELS: Record<string, string> = {
  identity: 'Identity',
  classification: 'Classification',
  lifecycle: 'Lifecycle',
  financial: 'Financial',
  governance: 'Governance',
  provenance: 'Provenance',
};

/**
 * The Properties tab's groups for a concept. Identity, the base of
 * Classification, and Provenance are always derived from fields the concept
 * already has -- see docs/06-properties-and-rules.md for why those are never
 * hand-authored a second time in properties.json.
 */
export function getPropertyGroups(concept: Concept): DisplayGroup[] {
  const authored = getPropertiesForConcept(concept.id);
  const byGroup = (g: PropertyGroupSource) => authored.filter((p) => p.group === g);
  const category = getCategory(concept.category);
  const parent = concept.subClassOf ? getConcept(concept.subClassOf) : undefined;

  const groups: DisplayGroup[] = [];

  const identityFields: DisplayField[] = [
    { label: 'ID', value: concept.id },
    { label: 'Label', value: concept.label },
    { label: 'Description', value: concept.definition },
  ];
  if (concept.aliases.length > 0) {
    identityFields.splice(2, 0, { label: 'Alternate Labels', value: concept.aliases.join(', ') });
  }
  groups.push({ id: 'identity', label: GROUP_LABELS.identity, fields: identityFields });

  const classificationFields: DisplayField[] = [
    { label: 'Type', value: 'owl:Class' },
    { label: 'Category', value: category.label },
  ];
  if (parent) {
    classificationFields.push({ label: 'Broader Concept', value: parent.label, href: `concepts/${parent.id}` });
  }
  for (const p of byGroup('classification')) {
    classificationFields.push({ label: p.label, value: p.description, property: p });
  }
  groups.push({ id: 'classification', label: GROUP_LABELS.classification, fields: classificationFields });

  for (const groupId of ['lifecycle', 'financial', 'governance'] as const) {
    const props = byGroup(groupId);
    if (props.length === 0) continue;
    groups.push({
      id: groupId,
      label: GROUP_LABELS[groupId],
      fields: props.map((p) => ({ label: p.label, value: p.description, property: p })),
    });
  }

  groups.push({
    id: 'provenance',
    label: GROUP_LABELS.provenance,
    fields: [
      { label: 'Source', value: concept.docRef, href: docUrl(concept.docRef) },
      { label: 'Ontology Version', value: ontologyVersion },
    ],
  });

  return groups;
}
