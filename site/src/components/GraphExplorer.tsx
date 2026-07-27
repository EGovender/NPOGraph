import cytoscape, { type Core, type NodeSingular } from 'cytoscape';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, getCategory } from '../data/categories';
import { EXPLORER_VIEWS, resolveLifecycleView } from '../data/explorer-views';
import { findShortestPath, seededGridPositions, type PathStep } from '../data/graph-utils';
import { conceptSearchScore } from '../data/search';
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

/** Reads ?view=&concept=&q=&concepts= once on mount; full-mode only. */
function readInitialURLState() {
  if (typeof window === 'undefined') {
    return { view: 'full', concept: null as string | null, q: '', customConcepts: null as string[] | null };
  }
  const params = new URLSearchParams(window.location.search);
  const customConcepts = params.get('concepts');
  return {
    view: params.get('view') ?? 'full',
    concept: params.get('concept'),
    q: params.get('q') ?? '',
    // An ad-hoc concept allowlist (e.g. from the Design tool's "open in
    // graph"), distinct from the named views in explorer-views.ts -- takes
    // priority over `view` when present.
    customConcepts: customConcepts ? customConcepts.split(',').filter(Boolean) : null,
  };
}

export default function GraphExplorer({ base, mode = 'full', focusConceptId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const isDark = useIsDark();
  const isMini = mode === 'mini';

  // All of these start at their SSR-safe defaults, matching the
  // server-rendered HTML, rather than reading the URL eagerly in the
  // initializer -- doing that would make the client's first render disagree
  // with the SSR-ed markup (view/concept/search/custom-selection would
  // already reflect the URL on the client but not on the server) and
  // trigger a React hydration-mismatch, discarding and re-rendering the
  // whole tree. Restored after mount instead, in the effect below.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const [viewId, setViewId] = useState<string>('full');
  const [customConceptIds, setCustomConceptIds] = useState<Set<string> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pathFromId, setPathFromId] = useState('');
  const [pathToId, setPathToId] = useState('');
  const [pathResult, setPathResult] = useState<PathStep[] | null | undefined>(undefined);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    if (isMini) return;
    const url = readInitialURLState();
    if (url.customConcepts) setCustomConceptIds(new Set(url.customConcepts));
    if (url.view !== 'full') setViewId(url.view);
    if (url.concept) setSelectedId(url.concept);
    if (url.q) setSearchQuery(url.q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMini]);

  const conceptsById = useMemo(() => new Map(allConcepts.map((c) => [c.id, c])), []);

  // The active view's concept allowlist, or null for "no filter" (Full Ontology).
  // A custom ad-hoc list (from the Design tool) always wins over the named views.
  const viewConceptIds = useMemo(() => {
    if (isMini) return null;
    if (customConceptIds) return customConceptIds;
    if (viewId === 'lifecycle') {
      return new Set(resolveLifecycleView(allConcepts.map((c) => c.id)));
    }
    const view = EXPLORER_VIEWS.find((v) => v.id === viewId);
    return view?.conceptIds ? new Set(view.conceptIds) : null;
  }, [isMini, viewId, customConceptIds]);

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

  // Keep the URL in sync with view/concept/search so the current state is
  // shareable and survives a reload -- full mode only, replacing (not
  // pushing) history so filtering doesn't spam the back button.
  useEffect(() => {
    if (isMini || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (customConceptIds) {
      params.set('concepts', Array.from(customConceptIds).join(','));
    } else if (viewId !== 'full') {
      params.set('view', viewId);
    }
    if (selectedId) params.set('concept', selectedId);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [isMini, viewId, customConceptIds, selectedId, searchQuery]);

  // Build the graph once (or whenever the underlying element set changes).
  useEffect(() => {
    if (!containerRef.current) return;

    const positions = isMini ? null : seededGridPositions(concepts.map((c) => c.id));

    const elements = [
      ...concepts.map((c) => ({
        data: { id: c.id, label: c.label, category: c.category, kind: conceptKind(c, conceptsById) },
        ...(positions ? { position: positions.get(c.id) } : {}),
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
          selector: 'edge.path-edge',
          style: {
            width: 3,
            'line-color': isDark ? '#5fc3a8' : '#387866',
            'target-arrow-color': isDark ? '#5fc3a8' : '#387866',
            opacity: 1,
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
            // Seeded with deterministic starting positions (see
            // seededGridPositions) so the force simulation -- the only thing
            // that moves nodes from there -- has no remaining randomness,
            // and the same element set settles into the same layout on
            // every visit instead of a new random one each time.
            randomize: false,
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
        setPathResult(undefined);
        setSearchQuery('');
        setSelectedId(evt.target.id());
      });
      cy.on('tap', (evt) => {
        if (evt.target === cy) setSelectedId(null);
      });
      // Apply whatever selection/search/path state is already active (e.g.
      // restored from the URL after mount) now that the graph exists to
      // apply it to -- a freshly built cytoscape instance has no classes on
      // it yet regardless of what the React state already says.
      applyHighlight(cy);
    }

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // Rebuild only when the underlying data changes; theme/highlighting are
    // handled by their own effects below.
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

  // Applies whichever of path-find / search / plain selection is active, in
  // that priority order, to the current graph. This is the ONLY place that
  // touches the selected/connected/faded/path-edge classes -- previously
  // three separate effects each independently decided when to clear or set
  // them based on their own stale closures, which meant they could disagree
  // about (and clobber) each other's outcome when several fired in the same
  // React commit (e.g. restoring a selection from the URL on mount, while a
  // freshly-mounted search effect's empty-query branch was still reasoning
  // from the pre-restoration value of selectedId). Consolidating into one
  // idempotent function -- called here on every relevant state change, and
  // again directly from the graph-build effect after a rebuild -- removes
  // that race entirely: there is exactly one function that decides the
  // outcome, and it always recomputes from the current values.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || isMini) return;
    applyHighlight(cy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, searchQuery, pathResult, isMini]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query || isMini) return [];
    return concepts
      .map((c) => ({ concept: c, score: conceptSearchScore(c, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.concept);
  }, [concepts, searchQuery, isMini]);

  function applyHighlight(cy: Core) {
    cy.elements().removeClass('selected connected faded path-edge');

    const path = pathResult;
    if (path && path.length > 0) {
      const nodeIds = new Set<string>([path[0].fromId, ...path.map((s) => s.toId)]);
      const pathNodes = cy.nodes().filter((n) => nodeIds.has(n.id()));
      const pathEdges = cy.edges().filter((e) =>
        path.some(
          (step) =>
            (e.data('source') === step.fromId && e.data('target') === step.toId) ||
            (e.data('source') === step.toId && e.data('target') === step.fromId)
        )
      );
      const highlighted = pathNodes.union(pathEdges);
      highlighted.addClass('connected');
      pathEdges.addClass('path-edge');
      cy.elements().not(highlighted).addClass('faded');
      cy.fit(highlighted, 40);
      return;
    }

    const query = searchQuery.trim();
    if (query) {
      const matches = cy.nodes().filter((n) => {
        const concept = conceptsById.get(n.id());
        return concept ? conceptSearchScore(concept, query) > 0 : false;
      });
      if (matches.length === 0) {
        cy.elements().addClass('faded');
      } else {
        matches.addClass('connected');
        cy.elements().not(matches).addClass('faded');
      }
      return;
    }

    if (selectedId && cy.getElementById(selectedId).length > 0) {
      const node = cy.getElementById(selectedId);
      const neighborhood = node.closedNeighborhood();
      node.addClass('selected');
      neighborhood.addClass('connected');
      cy.elements().not(neighborhood).addClass('faded');
    }
  }

  // The canvas and the list-view alternative both stay mounted permanently
  // (toggled with the `hidden` attribute, not conditional rendering) so the
  // cytoscape instance is never destroyed/orphaned by switching views --
  // but a canvas that was hidden (display:none) reports zero size, so it
  // needs an explicit resize+refit once it becomes visible again.
  useEffect(() => {
    if (isMini || showList) return;
    const cy = cyRef.current;
    if (!cy) return;
    const id = setTimeout(() => {
      cy.resize();
      cy.fit(undefined, 30);
    }, 0);
    return () => clearTimeout(id);
  }, [isMini, showList]);

  // Fullscreen: track native fullscreen state and resize/refit cytoscape
  // once the container's dimensions actually change.
  useEffect(() => {
    if (isMini) return;
    const handler = () => {
      const active = document.fullscreenElement === wrapRef.current;
      setIsFullscreen(active);
      setTimeout(() => {
        cyRef.current?.resize();
        cyRef.current?.fit(undefined, 30);
      }, 50);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [isMini]);

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

  function exportImage() {
    const cy = cyRef.current;
    if (!cy) return;
    const bg = isDark ? '#0d0d0d' : '#f9f9f7';
    const dataUrl = cy.png({ full: true, scale: 2, bg });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `npograph-${viewId}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
  }

  function toggleFullscreen() {
    if (!wrapRef.current) return;
    // Browsers (and embedding contexts that deny the fullscreen Permissions
    // Policy) can reject this; there's nothing more useful to do than leave
    // the button in its normal state; the fullscreenchange listener above
    // only fires on success, so failure is a silent no-op rather than a
    // broken UI state.
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      wrapRef.current.requestFullscreen().catch(() => {});
    }
  }

  function runPathFind() {
    if (!pathFromId || !pathToId) return;
    setPathResult(findShortestPath(pathFromId, pathToId, concepts, relationships));
  }

  function clearPathFind() {
    // The consolidated highlight effect (keyed on pathResult) reapplies
    // whatever's next in priority -- search, then plain selection, then
    // nothing -- once this clears.
    setPathResult(undefined);
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
      {!isMini && (
        <>
          <button type="button" aria-label="Export graph as PNG image" title="Export as image" onClick={exportImage}>
            &#x2913;
          </button>
          <button
            type="button"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={toggleFullscreen}
          >
            &#x26F6;
          </button>
        </>
      )}
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
  const sortedForPathFinder = [...concepts].sort((a, b) => a.label.localeCompare(b.label));

  const visibleListConcepts = concepts
    .filter((c) => !hiddenCategories.has(c.category))
    .filter((c) => !searchQuery.trim() || conceptSearchScore(c, searchQuery.trim()) > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
  const visibleListIds = new Set(visibleListConcepts.map((c) => c.id));
  const visibleListRelationships = relationships.filter(
    (r) => visibleListIds.has(r.subject) && visibleListIds.has(r.object)
  );

  return (
    <div className="graph-explorer">
      <aside className="graph-sidebar">
        <h2 className="graph-sidebar-title">Search</h2>
        <div className="search-box">
          <input
            type="search"
            className="search-input"
            value={searchQuery}
            onChange={(e) => {
              setPathResult(undefined);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search this view's concepts"
            aria-label="Search concepts in the graph"
          />
          {searchResults.length > 0 && (
            <ul className="search-results" role="listbox">
              {searchResults.map((c) => {
                const cat = getCategory(c.category);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="search-result-button"
                      onClick={() => {
                        const cy = cyRef.current;
                        if (!cy) return;
                        setSearchQuery('');
                        setPathResult(undefined);
                        setSelectedId(c.id);
                        cy.fit(cy.getElementById(c.id).closedNeighborhood(), 60);
                      }}
                    >
                      <span
                        className="search-result-swatch"
                        style={{ background: `light-dark(${cat.colorLight}, ${cat.colorDark})` }}
                      />
                      <span>{c.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <p className="muted search-no-results">No concepts match "{searchQuery.trim()}" in this view.</p>
          )}
        </div>

        <h2 className="graph-sidebar-title">Find a path</h2>
        <div className="path-finder">
          <label className="path-finder-label">
            From
            <select value={pathFromId} onChange={(e) => setPathFromId(e.target.value)}>
              <option value="">Select a concept&hellip;</option>
              {sortedForPathFinder.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="path-finder-label">
            To
            <select value={pathToId} onChange={(e) => setPathToId(e.target.value)}>
              <option value="">Select a concept&hellip;</option>
              {sortedForPathFinder.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <div className="path-finder-actions">
            <button type="button" className="home-cta" disabled={!pathFromId || !pathToId} onClick={runPathFind}>
              Find path
            </button>
            {pathResult !== undefined && (
              <button type="button" className="link-button" onClick={clearPathFind}>
                Clear
              </button>
            )}
          </div>
          <div aria-live="polite">
            {pathResult === null && <p className="muted graph-hint">No path between these concepts in this view.</p>}
            {pathResult && pathResult.length === 0 && <p className="muted graph-hint">Select two different concepts.</p>}
            {pathResult && pathResult.length > 0 && (
              <ol className="path-result">
                <li>{conceptsById.get(pathResult[0].fromId)?.label}</li>
                {pathResult.map((step, i) => (
                  <li key={i}>
                    <span className="muted">{step.label}</span> {conceptsById.get(step.toId)?.label}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <h2 className="graph-sidebar-title">View</h2>
        {customConceptIds ? (
          <div className="custom-view-banner">
            <p>
              Showing {customConceptIds.size} concepts from a <strong>Design</strong> recommendation.
            </p>
            <button type="button" className="link-button" onClick={() => setCustomConceptIds(null)}>
              Clear, show named views
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}

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

        <button type="button" className="home-cta graph-list-toggle" onClick={() => setShowList((v) => !v)}>
          {showList ? 'Show graph' : 'Show as list (keyboard-accessible)'}
        </button>

        <p className="muted graph-hint">Click a node to see its details. Click the background to clear.</p>
      </aside>

      <div className="graph-canvas-wrap graph-list-view" hidden={!showList}>
        <h2 className="graph-sidebar-title">
          Concepts ({visibleListConcepts.length} of {concepts.length})
        </h2>
        <ul className="concept-card-list">
          {visibleListConcepts.map((c) => {
            const cat = getCategory(c.category);
            return (
              <li key={c.id} className="card">
                <div className="concept-card-header">
                  <span
                    className="search-result-swatch"
                    style={{ background: `light-dark(${cat.colorLight}, ${cat.colorDark})` }}
                  />
                  <a href={`${base}concepts/${c.id}`} className="concept-card-label">
                    {c.label}
                  </a>
                </div>
                <p className="secondary concept-card-def">{c.definition}</p>
              </li>
            );
          })}
        </ul>
        <h2 className="graph-sidebar-title">Relationships ({visibleListRelationships.length})</h2>
        <ul className="graph-list-relationships">
          {visibleListRelationships.map((r) => (
            <li key={r.id}>
              <a href={`${base}concepts/${r.subject}`}>{conceptsById.get(r.subject)?.label}</a>{' '}
              <span className="muted">{r.label}</span>{' '}
              <a href={`${base}concepts/${r.object}`}>{conceptsById.get(r.object)?.label}</a>
            </li>
          ))}
        </ul>
      </div>

      <div className="graph-canvas-wrap" ref={wrapRef} hidden={showList}>
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
