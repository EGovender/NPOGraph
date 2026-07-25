// Category display metadata for the ontology's 8 concept categories (see
// docs/02-core-concepts.md at the repo root for the underlying definitions).
//
// Colors are the 8-slot categorical palette assigned in a FIXED order (never
// cycled/reassigned) -- see the dataviz skill's palette.md. Because a graph
// layout can place any two categories next to each other on screen (an
// "all-pairs" context), the palette's per-pair color-vision-deficiency
// guarantees only hold for the first 3-4 slots; using all 8 here is a
// deliberate tradeoff. It's mitigated by never relying on color alone: every
// node in the explorer always shows its text label, every category appears
// in a visible legend, and the legend doubles as a category filter.

export interface CategoryMeta {
  id: string;
  label: string;
  colorLight: string;
  colorDark: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'organizational-entities', label: 'Organizational Entities', colorLight: '#2a78d6', colorDark: '#3987e5' },
  { id: 'funding-structure', label: 'Funding Structure', colorLight: '#eb6834', colorDark: '#d95926' },
  { id: 'application-and-review', label: 'Application & Review', colorLight: '#1baf7a', colorDark: '#199e70' },
  { id: 'award-and-agreement', label: 'Award & Agreement', colorLight: '#eda100', colorDark: '#c98500' },
  { id: 'disbursement', label: 'Disbursement', colorLight: '#e87ba4', colorDark: '#d55181' },
  { id: 'compliance-and-reporting', label: 'Compliance & Reporting', colorLight: '#008300', colorDark: '#008300' },
  { id: 'outcomes-and-closeout', label: 'Outcomes & Closeout', colorLight: '#4a3aa7', colorDark: '#9085e9' },
  { id: 'cross-cutting', label: 'Cross-Cutting', colorLight: '#e34948', colorDark: '#e66767' },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): CategoryMeta {
  const cat = BY_ID.get(id);
  if (!cat) throw new Error(`Unknown category id: ${id}`);
  return cat;
}
