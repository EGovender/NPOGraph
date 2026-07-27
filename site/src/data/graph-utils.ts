// Pure helpers for GraphExplorer.tsx, kept separate from the component so
// the path-finding and layout-seeding logic can be reasoned about (and
// tested) independently of React/D3 wiring.
import type { Concept, Relationship } from './ontology';

export interface PathStep {
  fromId: string;
  toId: string;
  label: string;
}

/**
 * BFS shortest path between two concepts, treating every relationship (and
 * subClassOf edge) as traversable in either direction -- "how are these two
 * concepts connected" is a connectivity question, not a directed-flow one.
 * Returns the ordered list of steps, an empty array if start === end, or
 * null if no path exists in the given relationship set.
 */
export function findShortestPath(
  startId: string,
  endId: string,
  concepts: Concept[],
  relationships: Relationship[]
): PathStep[] | null {
  if (startId === endId) return [];

  const adjacency = new Map<string, { to: string; label: string }[]>();
  const addEdge = (a: string, b: string, label: string) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    adjacency.get(a)!.push({ to: b, label });
  };
  for (const r of relationships) {
    addEdge(r.subject, r.object, r.label);
    addEdge(r.object, r.subject, r.label);
  }
  for (const c of concepts) {
    if (c.subClassOf) {
      addEdge(c.id, c.subClassOf, 'is a');
      addEdge(c.subClassOf, c.id, 'has specialization');
    }
  }

  const visited = new Set<string>([startId]);
  const queue: string[] = [startId];
  const cameFrom = new Map<string, { from: string; label: string }>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === endId) break;
    for (const { to, label } of adjacency.get(current) ?? []) {
      if (!visited.has(to)) {
        visited.add(to);
        cameFrom.set(to, { from: current, label });
        queue.push(to);
      }
    }
  }

  if (!visited.has(endId)) return null;

  const steps: PathStep[] = [];
  let cur = endId;
  while (cur !== startId) {
    const step = cameFrom.get(cur)!;
    steps.unshift({ fromId: step.from, toId: cur, label: step.label });
    cur = step.from;
  }
  return steps;
}

/**
 * Deterministic starting positions for a force-directed (cose) layout, one
 * per concept id, arranged in a fixed grid ordered by id. cose with
 * randomize:true picks a new random starting point on every run, which is
 * why the explorer's layout used to look different on every visit; seeding
 * it with the same starting positions (and running with randomize:false)
 * makes the physics simulation itself the only source of movement, and that
 * simulation has no remaining randomness, so the same element set always
 * settles into the same layout.
 */
export function seededGridPositions(ids: string[], spacing = 90): Map<string, { x: number; y: number }> {
  const sorted = [...ids].sort();
  const cols = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));
  const positions = new Map<string, { x: number; y: number }>();
  sorted.forEach((id, i) => {
    positions.set(id, { x: (i % cols) * spacing, y: Math.floor(i / cols) * spacing });
  });
  return positions;
}
