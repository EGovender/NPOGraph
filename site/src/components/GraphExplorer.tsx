import cytoscape, { type Core, type NodeSingular } from 'cytoscape';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, getCategory } from '../data/categories';
import type { Concept, Relationship } from '../data/ontology';

interface Props {
  concepts: Concept[];
  relationships: Relationship[];
  base: string;
}

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);
  return isDark;
}

export default function GraphExplorer({ concepts, relationships, base }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const isDark = useIsDark();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const conceptsById = useMemo(() => new Map(concepts.map((c) => [c.id, c])), [concepts]);

  // Build the graph once.
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = [
      ...concepts.map((c) => ({
        data: { id: c.id, label: c.label, category: c.category },
      })),
      ...relationships.map((r) => ({
        data: { id: r.id, source: r.subject, target: r.object, label: r.label },
      })),
      ...concepts
        .filter((c) => c.subClassOf)
        .map((c) => ({
          data: { id: `${c.id}-subclass-of`, source: c.id, target: c.subClassOf as string, label: 'is a' },
          classes: 'subclass-edge',
        })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      minZoom: 0.2,
      maxZoom: 2.5,
      wheelSensitivity: 0.3,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele: NodeSingular) => {
              const cat = getCategory(ele.data('category'));
              return isDark ? cat.colorDark : cat.colorLight;
            },
            label: 'data(label)',
            color: isDark ? '#ffffff' : '#0b0b0b',
            'font-size': 9,
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'text-background-color': isDark ? '#1a1a19' : '#fcfcfb',
            'text-background-opacity': 0.85,
            'text-background-padding': '1px',
            width: 16,
            height: 16,
            'border-width': 0,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.2,
            'line-color': isDark ? '#3a3a38' : '#d7d6cf',
            'target-arrow-color': isDark ? '#3a3a38' : '#d7d6cf',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.7,
            'curve-style': 'bezier',
            opacity: 0.6,
          },
        },
        {
          selector: 'edge.subclass-edge',
          style: {
            'line-style': 'dashed',
            'target-arrow-shape': 'triangle-tee',
            opacity: 0.5,
          },
        },
        {
          selector: 'node.selected',
          style: {
            'border-width': 3,
            'border-color': isDark ? '#ffffff' : '#0b0b0b',
            'font-size': 11,
            'font-weight': 700,
          },
        },
        {
          selector: '.connected',
          style: { opacity: 1 },
        },
        {
          selector: '.faded',
          style: { opacity: 0.12 },
        },
        {
          selector: '.category-hidden',
          style: { display: 'none' },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        fit: true,
        padding: 40,
        randomize: true,
        nodeRepulsion: () => 40000,
        idealEdgeLength: () => 140,
        nodeOverlap: 20,
        componentSpacing: 120,
        edgeElasticity: () => 100,
        nestingFactor: 5,
        gravity: 60,
        numIter: 2000,
      } as cytoscape.LayoutOptions,
    });

    cy.on('tap', 'node', (evt) => {
      selectNode(cy, evt.target.id());
    });
    cy.on('tap', (evt) => {
      if (evt.target === cy) clearSelection(cy);
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // Rebuild only when the underlying data changes; theme/selection are handled separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concepts, relationships]);

  // Re-apply theme-dependent colors when the color scheme flips.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style()
      .selector('node')
      .style({
        'background-color': (ele: NodeSingular) => {
          const cat = getCategory(ele.data('category'));
          return isDark ? cat.colorDark : cat.colorLight;
        },
        color: isDark ? '#ffffff' : '#0b0b0b',
      })
      .selector('node.selected')
      .style({ 'border-color': isDark ? '#ffffff' : '#0b0b0b' })
      .selector('edge')
      .style({
        'line-color': isDark ? '#3a3a38' : '#d7d6cf',
        'target-arrow-color': isDark ? '#3a3a38' : '#d7d6cf',
      })
      .update();
  }, [isDark]);

  // Apply category visibility filter.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().forEach((n) => {
      n.toggleClass('category-hidden', hiddenCategories.has(n.data('category')));
    });
  }, [hiddenCategories]);

  function selectNode(cy: Core, id: string) {
    setSelectedId(id);
    const node = cy.getElementById(id);
    const neighborhood = node.closedNeighborhood();
    cy.elements().removeClass('selected connected faded');
    node.addClass('selected');
    neighborhood.addClass('connected');
    cy.elements().not(neighborhood).addClass('faded');
  }

  function clearSelection(cy: Core) {
    setSelectedId(null);
    cy.elements().removeClass('selected connected faded');
  }

  function toggleCategory(id: string) {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedConcept = selectedId ? conceptsById.get(selectedId) : undefined;
  const selectedOutgoing = selectedConcept
    ? relationships.filter((r) => r.subject === selectedConcept.id)
    : [];
  const selectedIncoming = selectedConcept
    ? relationships.filter((r) => r.object === selectedConcept.id)
    : [];

  return (
    <div className="graph-explorer">
      <aside className="graph-sidebar">
        <h2 className="graph-sidebar-title">Categories</h2>
        <ul className="category-filter">
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <label>
                <input
                  type="checkbox"
                  checked={!hiddenCategories.has(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                />
                <span
                  className="search-result-swatch"
                  style={{ background: `light-dark(${cat.colorLight}, ${cat.colorDark})` }}
                />
                {cat.label}
              </label>
            </li>
          ))}
        </ul>
        <p className="muted graph-hint">Click a node to see its relationships. Click the background to clear.</p>
      </aside>

      <div className="graph-canvas" ref={containerRef} role="img" aria-label="NPOGraph concept relationship graph" />

      <aside className="graph-detail">
        {selectedConcept ? (
          <>
            <h2 className="graph-detail-title">{selectedConcept.label}</h2>
            <p className="secondary">{selectedConcept.definition}</p>
            {selectedOutgoing.length > 0 && (
              <>
                <h3 className="graph-detail-subhead">Outgoing</h3>
                <ul className="graph-detail-list">
                  {selectedOutgoing.map((r) => (
                    <li key={r.id}>
                      {r.label} <strong>{conceptsById.get(r.object)?.label}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {selectedIncoming.length > 0 && (
              <>
                <h3 className="graph-detail-subhead">Incoming</h3>
                <ul className="graph-detail-list">
                  {selectedIncoming.map((r) => (
                    <li key={r.id}>
                      <strong>{conceptsById.get(r.subject)?.label}</strong> {r.label}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <a className="graph-detail-link" href={`${base}concepts/${selectedConcept.id}`}>
              Open full concept page &rarr;
            </a>
          </>
        ) : (
          <p className="muted">Select a concept to see its details and relationships.</p>
        )}
      </aside>
    </div>
  );
}
