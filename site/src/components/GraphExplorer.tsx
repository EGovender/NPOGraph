import cytoscape, { type Core, type NodeSingular } from 'cytoscape';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, getCategory } from '../data/categories';
import { EXPLORER_VIEWS, resolveLifecycleView } from '../data/explorer-views';
import {
  concepts as allConcepts,
  relationships as allRelationships,
  getBusinessRulesForConcept,
  getConcept,
  getIncomingRelationships,
  getOutgoingRelationships,
  getPropertyGroups,
  getSubtypes,
  type Concept,
} from '../data/ontology';
import PropertyInspector from './PropertyInspector';

/**
 * Which of the four visual node kinds a concept renders as -- walks the
 * subClassOf chain so subtypes pick up their ancestor's kind (e.g. Funder ->
 * role, Philanthropic Intermediary -> organization), same rule as
 * getPropertiesForConcept/getOutgoingRelationships use for properties and
 * relationships. Concepts outside these four families (most of the ontology)
 * render as the default ellipse.
 */
type ConceptKind = 'organization' | 'role' | 'fund' | 'arrangement' | 'other';

function conceptKind(concept: Concept, conceptsById: Map<string, Concept>): ConceptKind {
  let current: Concept | undefined = concept;
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.id === 'organization-role') return 'role';
    if (current.id === 'fund') return 'fund';
    if (current.id === 'philanthropic-arrangement') return 'arrangement';
    if (current.id === 'organization') return 'organization';
    current = current.subClassOf ? conceptsById.get(current.subClassOf) : undefined;
  }
  return 'other';
}

const SHAPE_LEGEND: { kind: ConceptKind; label: string; shape: string }[] = [
  { kind: 'organization', label: 'Organization', shape: 'round-rectangle' },
  { kind: 'role', label: 'Organization Role', shape: 'diamond' },
  { kind: 'fund', label: 'Fund', shape: 'hexagon' },
  { kind: 'arrangement', label: 'Arrangement', shape: 'tag' },
];

interface Props {
  base: string;
  /** 'full' (default): sidebar + canvas + property inspector, used on /explore.
   *  'mini': canvas only, scoped to one concept's neighborhood, used embedded
   *  on a concept's own page -- clicking a neighbor navigates to its page. */
  mode?: 'full' | 'mini';
  /** Required in mini mode: which concept to center the neighborhood on. */
  focusConceptId?: string;
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

export default function GraphExplorer({ base, mode = 'full', focusConceptId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const isDark = useIsDark();
  const isMini = mode === 'mini';

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string>('full');

  const conceptsById = useMemo(() => new Map(allConcepts.map((c) => [c.id, c])), []);

  // The active view's concept allowlist, or null for "no filter" (Full Ontology).
  const viewConceptIds = useMemo(() => {
    if (isMini) return null;
    if (viewId === 'lifecycle') {
      return new Set(resolveLifecycleView(allConcepts.map((c) => c.id)));
    }
    const view = EXPLORER_VIEWS.find((v) => v.id === viewId);
    return view?.conceptIds ? new Set(view.conceptIds) : null;
  }, [isMini, viewId]);

  const { concepts, relationships } = useMemo(() => {
    if (isMini && focusConceptId) {
      const neighborIds = new Set<string>([focusConceptId]);
      for (const r of allRelationships) {
        if (r.subject === focusConceptId) neighborIds.add(r.object);
        if (r.object === focusConceptId) neighborIds.add(r.subject);
      }
      const focus = conceptsById.get(focusConceptId);
      if (focus?.subClassOf) neighborIds.add(focus.subClassOf);
      for (const c of allConcepts) {
        if (c.subClassOf === focusConceptId) neighborIds.add(c.id);
      }
      return {
        concepts: allConcepts.filter((c) => neighborIds.has(c.id)),
        relationships: allRelationships.filter(
          (r) => neighborIds.has(r.subject) && neighborIds.has(r.object)
        ),
      };
    }
    if (!viewConceptIds) return { concepts: allConcepts, relationships: allRelationships };
    return {
      concepts: allConcepts.filter((c) => viewConceptIds.has(c.id)),
      relationships: allRelationships.filter(
        (r) => viewConceptIds.has(r.subject) && viewConceptIds.has(r.object)
      ),
    };
  }, [isMini, focusConceptId, conceptsById, viewConceptIds]);

  // Build the graph once.
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = [
      ...concepts.map((c) => ({
        data: { id: c.id, label: c.label, category: c.category, kind: conceptKind(c, conceptsById) },
      })),
      ...relationships.map((r) => ({
        data: { id: r.id, source: r.subject, target: r.object, label: r.label },
      })),
      ...concepts
        .filter((c) => c.subClassOf && neighborHas(concepts, c.subClassOf))
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
            shape: 'ellipse',
          },
        },
        {
          selector: 'node[kind="organization"]',
          style: { shape: 'round-rectangle' },
        },
        {
          selector: 'node[kind="role"]',
          style: { shape: 'diamond' },
        },
        {
          selector: 'node[kind="fund"]',
          style: { shape: 'hexagon' },
        },
        {
          selector: 'node[kind="arrangement"]',
          style: { shape: 'tag' },
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
          selector: 'node.focus',
          style: {
            'border-width': 3,
            'border-color': isDark ? '#ffffff' : '#0b0b0b',
            width: 22,
            height: 22,
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
      layout: isMini
        ? { name: 'breadthfirst', fit: true, padding: 24, spacingFactor: 1.1, directed: false }
        : ({
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
          } as cytoscape.LayoutOptions),
    });

    if (isMini && focusConceptId) {
      cy.getElementById(focusConceptId).addClass('focus');
      cy.on('tap', 'node', (evt) => {
        const id = evt.target.id();
        if (id !== focusConceptId) window.location.href = `${base}concepts/${id}`;
      });
    } else {
      cy.on('tap', 'node', (evt) => {
        selectNode(cy, evt.target.id());
      });
      cy.on('tap', (evt) => {
        if (evt.target === cy) clearSelection(cy);
      });
    }

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

  function zoomBy(factor: number) {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({ level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } });
  }

  function fitToView() {
    cyRef.current?.fit(undefined, 30);
  }

  const controls = (
    <div className="graph-controls">
      <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.3)}>
        +
      </button>
      <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.3)}>
        &minus;
      </button>
      <button type="button" aria-label="Fit to view" onClick={fitToView}>
        &#x2922;
      </button>
    </div>
  );

  if (isMini) {
    return (
      <div className="graph-canvas-wrap graph-canvas-mini">
        <div className="graph-canvas" ref={containerRef} role="img" aria-label={`Neighborhood graph for ${focusConceptId}`} />
        {controls}
      </div>
    );
  }

  const selectedConcept = selectedId ? conceptsById.get(selectedId) : undefined;

  return (
    <div className="graph-explorer">
      <aside className="graph-sidebar">
        <h2 className="graph-sidebar-title">View</h2>
        <ul className="view-selector">
          {EXPLORER_VIEWS.map((view) => (
            <li key={view.id}>
              <label>
                <input
                  type="radio"
                  name="explorer-view"
                  checked={viewId === view.id}
                  onChange={() => setViewId(view.id)}
                />
                {view.label}
              </label>
            </li>
          ))}
        </ul>
        <p className="muted graph-hint">{EXPLORER_VIEWS.find((v) => v.id === viewId)?.description}</p>

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

        <h2 className="graph-sidebar-title">Shapes</h2>
        <ul className="shape-legend">
          {SHAPE_LEGEND.map((entry) => (
            <li key={entry.kind}>
              <span className={`shape-swatch shape-swatch-${entry.kind}`} />
              {entry.label}
            </li>
          ))}
          <li>
            <span className="shape-swatch shape-swatch-other" />
            Everything else
          </li>
        </ul>

        <p className="muted graph-hint">Click a node to see its details. Click the background to clear.</p>
      </aside>

      <div className="graph-canvas-wrap">
        <div className="graph-canvas" ref={containerRef} role="img" aria-label="NPOGraph concept relationship graph" />
        {controls}
      </div>

      <aside className="graph-detail">
        {selectedConcept ? (
          <PropertyInspector
            concept={selectedConcept}
            parent={selectedConcept.subClassOf ? getConcept(selectedConcept.subClassOf) : undefined}
            subtypes={getSubtypes(selectedConcept.id)}
            outgoing={getOutgoingRelationships(selectedConcept.id)}
            incoming={getIncomingRelationships(selectedConcept.id)}
            propertyGroups={getPropertyGroups(selectedConcept)}
            businessRules={getBusinessRulesForConcept(selectedConcept.id)}
            base={base}
            showOpenPageLink
          />
        ) : (
          <p className="muted">Select a concept to see its details and relationships.</p>
        )}
      </aside>
    </div>
  );
}

function neighborHas(concepts: { id: string }[], id: string): boolean {
  return concepts.some((c) => c.id === id);
}
