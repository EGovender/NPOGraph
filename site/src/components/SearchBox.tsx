import { useMemo, useState } from 'react';
import type { Concept } from '../data/ontology';
import { getCategory } from '../data/categories';
import { conceptSearchScore } from '../data/search';

interface Props {
  concepts: Concept[];
  base: string;
  /** A narrow, dropdown-overlay variant for the persistent site-header
   * search (every page but the homepage, which already has the full-size
   * box below its hero) -- same search, just not laid out inline. */
  compact?: boolean;
}

export default function SearchBox({ concepts, base, compact = false }: Props) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return concepts
      .map((c) => ({ concept: c, score: conceptSearchScore(c, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.concept);
  }, [concepts, query]);

  return (
    <div className={compact ? 'search-box search-box-compact' : 'search-box'}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={compact ? 'Search concepts…' : 'Search concepts (e.g. “installment”, “compliance”)'}
        aria-label="Search CommonGood Atlas concepts"
        className="search-input"
      />
      {results.length > 0 && (
        <ul className={compact ? 'search-results search-results-compact' : 'search-results'} role="listbox">
          {results.map((c) => {
            const category = getCategory(c.category);
            return (
              <li key={c.id}>
                <a href={`${base}concepts/${c.id}`}>
                  <span
                    className="search-result-swatch"
                    style={{ background: `light-dark(${category.colorLight}, ${category.colorDark})` }}
                  />
                  <span>
                    <strong>{c.label}</strong>
                    <span className="search-result-def"> — {c.definition}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {query.trim() && results.length === 0 && (
        <p className={compact ? 'muted search-no-results search-no-results-compact' : 'muted search-no-results'}>
          No concepts match "{query}".
        </p>
      )}
    </div>
  );
}
