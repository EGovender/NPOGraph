// Data-access layer over the reference-data (controlled-vocabulary) schemes
// synced at build time from ontology/source/reference-data/*.json (see
// scripts/sync-ontology-data.mjs and docs/06-properties-and-rules.md). One
// JSON file per scheme, so it's loaded as a directory rather than a single
// static import like the rest of ./generated/*.json.
export type ReferenceMappingRelation = 'exactMatch' | 'closeMatch' | 'broadMatch' | 'narrowMatch' | 'relatedMatch';

export interface ReferenceValueMapping {
  relation: ReferenceMappingRelation;
  uri: string;
}

export interface ReferenceValue {
  id: string;
  code: string;
  label: string;
  definition: string;
  deprecated: boolean;
  broader: string | null;
  replacedBy?: string;
  mappings: ReferenceValueMapping[];
}

export interface ReferenceScheme {
  id: string;
  label: string;
  description: string;
  domain: string;
  authorityType: 'internal' | 'external';
  version: string;
  publicationStatus: string;
  values: ReferenceValue[];
}

const modules = import.meta.glob<{ default: ReferenceScheme }>('./generated/reference-data/*.json', {
  eager: true,
});

const schemesById = new Map<string, ReferenceScheme>(
  Object.values(modules).map((m) => [m.default.id, m.default])
);

export function getReferenceScheme(schemeId: string): ReferenceScheme {
  const scheme = schemesById.get(schemeId);
  if (!scheme) throw new Error(`Unknown reference-data scheme: ${schemeId}`);
  return scheme;
}

/** Non-deprecated values, in scheme-declared order -- the set worth showing
 * someone deciding what to put in a reference-backed property. */
export function getActiveReferenceValues(schemeId: string): ReferenceValue[] {
  return getReferenceScheme(schemeId).values.filter((v) => !v.deprecated);
}
