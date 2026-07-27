// SVG path generators for the graph explorer's 7 node kinds, keyed to
// ConceptKind (graph-kinds.ts). Framework-independent pure functions --
// GraphExplorer.tsx sets the `d` attribute directly, no React/D3 coupling
// here. Sizes are the shape's full width/height in local (pre-transform)
// SVG units; each generator is centered on (0, 0) so a node's <g> only
// needs a `translate(x, y)`.
import { symbol, symbolCircle, symbolDiamond, symbolTriangle } from 'd3-shape';
import type { ConceptKind } from './graph-kinds';

function polygon(points: [number, number][]): string {
  return `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z`;
}

function roundedRect(size: number, radius = size * 0.22): string {
  const h = size / 2;
  return [
    `M${-h + radius},${-h}`,
    `H${h - radius}`,
    `A${radius},${radius} 0 0 1 ${h},${-h + radius}`,
    `V${h - radius}`,
    `A${radius},${radius} 0 0 1 ${h - radius},${h}`,
    `H${-h + radius}`,
    `A${radius},${radius} 0 0 1 ${-h},${h - radius}`,
    `V${-h + radius}`,
    `A${radius},${radius} 0 0 1 ${-h + radius},${-h}`,
    'Z',
  ].join('');
}

function hexagon(size: number): string {
  const w = size / 2;
  const h = size / 2;
  return polygon([
    [-w * 0.5, -h],
    [w * 0.5, -h],
    [w, 0],
    [w * 0.5, h],
    [-w * 0.5, h],
    [-w, 0],
  ]);
}

function pentagonFlag(size: number): string {
  const w = size / 2;
  const h = size / 2;
  return polygon([
    [-w, -h],
    [w * 0.3, -h],
    [w, 0],
    [w * 0.3, h],
    [-w, h],
  ]);
}

function octagon(size: number): string {
  const w = size / 2;
  const cut = w * 0.4142; // regular octagon corner cut
  return polygon([
    [-w + cut, -w],
    [w - cut, -w],
    [w, -w + cut],
    [w, w - cut],
    [w - cut, w],
    [-w + cut, w],
    [-w, w - cut],
    [-w, -w + cut],
  ]);
}

const d3SymbolPath = (type: typeof symbolCircle, size: number) =>
  symbol().type(type).size(size * size)() as string;

export function nodeShapePath(kind: ConceptKind, size: number): string {
  switch (kind) {
    case 'organization':
      return roundedRect(size);
    case 'organization-role':
      return d3SymbolPath(symbolDiamond, size);
    case 'grant-program':
      return d3SymbolPath(symbolTriangle, size);
    case 'grant':
      return octagon(size);
    case 'fund':
      return hexagon(size);
    case 'arrangement':
      return pentagonFlag(size);
    case 'other':
    default:
      return d3SymbolPath(symbolCircle, size);
  }
}
