// Shared concept-search relevance scoring, used by both the homepage's
// SearchBox (top-8 dropdown) and the concept catalogue's filter (whole-list
// inclusion) -- factored out so "does this concept match this query" means
// the same thing in both places rather than drifting into two definitions.
import type { Concept } from './ontology';

export function conceptSearchScore(concept: Concept, query: string): number {
  const q = query.toLowerCase();
  const label = concept.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (concept.aliases.some((a) => a.toLowerCase().includes(q))) return 50;
  if (concept.definition.toLowerCase().includes(q)) return 30;
  return 0;
}
