import { useEffect, useState } from 'react';
import type { BusinessRule, Concept, DisplayGroup, RelatedConcept } from '../data/ontology';
import {
  conceptIri,
  conceptJsonLd,
  getConcept,
  getExamplesForConcept,
  getPropertiesForConcept,
  machineFormats,
  ontologyVersion,
} from '../data/ontology';
import { getCategory } from '../data/categories';
import { getActiveReferenceValues, getReferenceScheme } from '../data/reference-data';

// Grouped by user intent (Overview/In Practice for practitioners, Connections
// for how this concept relates to others, Data Model/Technical for
// implementers) rather than by ontology structure -- Phase 3.8 Milestone 5.
// "In Practice" and the old "Example" tab are the same content; "Data Model"
// merges the old "Properties" and "Rules" tabs, since Rules' own "Property
// constraints" list was already showing the same properties Properties did,
// just with the constraint chips instead of the description.
const ALL_TABS = ['Overview', 'In Practice', 'Connections', 'Data Model', 'Technical'] as const;
type Tab = (typeof ALL_TABS)[number];

interface Props {
  concept: Concept;
  parent?: Concept;
  subtypes: Concept[];
  outgoing: RelatedConcept[];
  incoming: RelatedConcept[];
  propertyGroups: DisplayGroup[];
  businessRules: BusinessRule[];
  base: string;
  showOpenPageLink?: boolean;
  initialTab?: Tab;
  /** Only true on the standalone concept page, never inside the graph
   * explorer's embedded detail panel -- that panel's URL already tracks
   * view/concept/search state, and a tab-selection side effect there would
   * fight it. */
  persistTabInUrl?: boolean;
}

function CategoryTag({ categoryId }: { categoryId: string }) {
  const category = getCategory(categoryId);
  return (
    <span className="badge">
      <span
        className="swatch"
        style={{ background: `light-dark(${category.colorLight}, ${category.colorDark})` }}
      />
      {category.label}
    </span>
  );
}

export default function PropertyInspector({
  concept,
  parent,
  subtypes,
  outgoing,
  incoming,
  propertyGroups,
  businessRules,
  base,
  showOpenPageLink = false,
  initialTab = 'Overview',
  persistTabInUrl = false,
}: Props) {
  const examples = getExamplesForConcept(concept.id);
  const tabs = ALL_TABS.filter((t) => t !== 'In Practice' || examples.length > 0);
  const [tab, setTab] = useState<Tab>(tabs.includes(initialTab) ? initialTab : 'Overview');
  const [linkCopied, setLinkCopied] = useState(false);
  const relationshipCount = outgoing.length + incoming.length;
  const constraintFields = propertyGroups
    .flatMap((g) => g.fields)
    .filter((f) => f.property);
  const exampleProps = getPropertiesForConcept(concept.id);

  // Restored after mount, not read eagerly in the initializer, to keep the
  // client's first render matching the server-rendered HTML (same reasoning
  // as the graph explorer's own URL-restore effect).
  useEffect(() => {
    if (!persistTabInUrl || typeof window === 'undefined') return;
    const requested = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    if (requested && tabs.includes(requested)) setTab(requested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistTabInUrl]);

  function selectTab(next: Tab) {
    setTab(next);
    if (!persistTabInUrl || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (next === 'Overview') params.delete('tab');
    else params.set('tab', next);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }

  function copyTabLink() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (tab === 'Overview') params.delete('tab');
    else params.set('tab', tab);
    const qs = params.toString();
    const url = `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ''}`;
    navigator.clipboard?.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    });
  }

  return (
    <div className="inspector">
      <div className="inspector-header">
        <h2 className="inspector-title">{concept.label}</h2>
        <CategoryTag categoryId={concept.category} />
      </div>

      <div className="inspector-tabs-row">
        <div className="inspector-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`inspector-tab${tab === t ? ' active' : ''}`}
              onClick={() => selectTab(t)}
            >
              {t}
              {t === 'In Practice' && examples.length > 1 && (
                <span className="inspector-tab-count">{examples.length}</span>
              )}
              {t === 'Connections' && relationshipCount > 0 && (
                <span className="inspector-tab-count">{relationshipCount}</span>
              )}
              {t === 'Data Model' && constraintFields.length + businessRules.length > 0 && (
                <span className="inspector-tab-count">{constraintFields.length + businessRules.length}</span>
              )}
            </button>
          ))}
        </div>
        {persistTabInUrl && (
          <button type="button" className="link-button inspector-copy-link" onClick={copyTabLink}>
            {linkCopied ? 'Link copied!' : 'Copy link to this tab'}
          </button>
        )}
      </div>

      <div className="inspector-body">
        {tab === 'Overview' && (
          <div>
            {concept.aliases.length > 0 && (
              <p className="muted">Also known as: {concept.aliases.join(', ')}</p>
            )}
            <p className="inspector-definition">{concept.definition}</p>
            <p className="secondary">
              Part of <strong>{getCategory(concept.category).label}</strong> in the grantmaking
              ontology.
            </p>
            {parent && (
              <p className="secondary">
                Specializes{' '}
                <a href={`${base}concepts/${parent.id}`}>
                  <strong>{parent.label}</strong>
                </a>
                .
              </p>
            )}
            {subtypes.length > 0 && (
              <p className="secondary">
                Specializations:{' '}
                {subtypes.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ', '}
                    <a href={`${base}concepts/${s.id}`}>{s.label}</a>
                  </span>
                ))}
              </p>
            )}
            {concept.legalNote && (
              <div className="inspector-legal-note">
                <strong>Not legal advice:</strong> {concept.legalNote}
              </div>
            )}
          </div>
        )}

        {tab === 'In Practice' && examples.length > 0 && (
          <div>
            {examples.map((example, i) => (
              <div key={example.id} className={i > 0 ? 'inspector-group' : undefined}>
                {examples.length > 1 && <h3 className="inspector-group-title">{example.label}</h3>}
                <p className="inspector-definition">{example.narrative}</p>
                {Object.keys(example.properties).length > 0 && (
                  <dl className="inspector-fields">
                    {Object.entries(example.properties).map(([name, value]) => {
                      const pdef = exampleProps.find((p) => p.name === name);
                      return (
                        <div key={name} className="inspector-field">
                          <dt>{pdef?.label ?? name}</dt>
                          <dd>{value}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
              </div>
            ))}
            <p className="secondary" style={{ marginTop: '1.25rem' }}>
              From the worked example{examples.length > 1 ? 's' : ''} above - part of the ontology's{' '}
              <a href={`${base}story`}>Story mode</a> walkthrough.
            </p>
          </div>
        )}

        {tab === 'Connections' && (
          <div>
            {outgoing.length > 0 && (
              <section className="inspector-group">
                <h3 className="inspector-group-title">Outgoing</h3>
                <ul className="inspector-rel-list">
                  {outgoing.map(({ relationship, concept: target }) => (
                    <li key={relationship.id}>
                      <strong>{concept.label}</strong> {relationship.label}{' '}
                      <a href={`${base}concepts/${target.id}`}>{target.label}</a>
                      <div className="muted inspector-rel-desc">{relationship.description}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {incoming.length > 0 && (
              <section className="inspector-group">
                <h3 className="inspector-group-title">Incoming</h3>
                <ul className="inspector-rel-list">
                  {incoming.map(({ relationship, concept: source }) => (
                    <li key={relationship.id}>
                      <a href={`${base}concepts/${source.id}`}>{source.label}</a>{' '}
                      {relationship.label} <strong>{concept.label}</strong>
                      <div className="muted inspector-rel-desc">{relationship.description}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {relationshipCount === 0 && <p className="muted">No relationships defined yet.</p>}
          </div>
        )}

        {tab === 'Data Model' && (
          <div>
            {propertyGroups.some((g) => g.fields.length > 0) && (
              <>
                <p className="muted inspector-note">
                  Schema-level attributes an instance of {concept.label} carries - not example data.
                </p>
                {propertyGroups.map((group) => (
                  <section key={group.id} className="inspector-group">
                    <h3 className="inspector-group-title">{group.label}</h3>
                    <dl className="inspector-fields">
                      {group.fields.map((f) => (
                        <div key={f.label} className="inspector-field">
                          <dt>{f.label}</dt>
                          <dd>
                            {f.href ? <a href={f.href}>{f.value}</a> : f.value}
                            {f.property && (
                              <>
                                <span className="inspector-chips">
                                  <span className="chip">
                                    {f.property.datatype === 'reference' && f.property.referenceScheme
                                      ? `reference: ${getReferenceScheme(f.property.referenceScheme).label}`
                                      : f.property.datatype}
                                  </span>
                                  <span className={`chip ${f.property.required ? 'chip-required' : ''}`}>
                                    {f.property.required ? 'required' : 'optional'}
                                  </span>
                                  <span className="chip">
                                    {f.property.cardinality === 'one' ? '0..1 / 1..1' : '0..n'}
                                  </span>
                                </span>
                                {f.property.allowedValues && (
                                  <div className="inspector-allowed-values">
                                    allowed values:{' '}
                                    {f.property.allowedValues.map((v) => (
                                      <span key={v} className="chip chip-value">
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {f.property.datatype === 'reference' && f.property.referenceScheme && (
                                  <div className="inspector-allowed-values">
                                    values from{' '}
                                    <strong>{getReferenceScheme(f.property.referenceScheme).label}</strong>:{' '}
                                    {getActiveReferenceValues(f.property.referenceScheme).map((v) => (
                                      <span key={v.id} className="chip chip-value">
                                        {v.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </>
            )}
            {businessRules.length > 0 && (
              <section className="inspector-group">
                <h3 className="inspector-group-title">Business rules</h3>
                <ul className="inspector-rules-list">
                  {businessRules.map((rule) => (
                    <li key={rule.id}>
                      <strong>{rule.label}</strong>
                      <div className="secondary inspector-rel-desc">{rule.description}</div>
                      {rule.concepts.filter((c) => c !== concept.id).length > 0 && (
                        <div className="muted inspector-rel-desc">
                          Also involves:{' '}
                          {rule.concepts
                            .filter((c) => c !== concept.id)
                            .map((c, i, arr) => (
                              <span key={c}>
                                <a href={`${base}concepts/${c}`}>{getConcept(c)?.label ?? c}</a>
                                {i < arr.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {tab === 'Technical' && (
          <div>
            <dl className="inspector-fields">
              <div className="inspector-field">
                <dt>URI</dt>
                <dd>
                  <code className="inspector-code">{conceptIri(concept.id)}</code>
                </dd>
              </div>
              <div className="inspector-field">
                <dt>RDF Type</dt>
                <dd>
                  <code className="inspector-code">owl:Class</code>
                </dd>
              </div>
              <div className="inspector-field">
                <dt>Source-system mappings</dt>
                <dd className="muted">None yet - CommonGood Atlas has no source-system integrations.</dd>
              </div>
              <div className="inspector-field">
                <dt>Ontology version</dt>
                <dd>{ontologyVersion}</dd>
              </div>
            </dl>
            <h3 className="inspector-group-title">JSON-LD</h3>
            <pre className="inspector-code-block">{JSON.stringify(conceptJsonLd(concept), null, 2)}</pre>
            <h3 className="inspector-group-title">Full ontology formats</h3>
            <ul className="inspector-rules-list">
              {machineFormats.map((f) => (
                <li key={f.href}>
                  <a href={f.href}>{f.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showOpenPageLink && (
        <a className="graph-detail-link" href={`${base}concepts/${concept.id}`}>
          Open full concept page &rarr;
        </a>
      )}
    </div>
  );
}
