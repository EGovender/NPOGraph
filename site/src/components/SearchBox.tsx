import { useMemo, useState } from 'react';
import type { Concept } from '../data/ontology';
import { getCategory } from '../data/categories';

interface Props {
  concepts: Concept[];
  base: string;
}

function score(concept: Concept, query: string): number {
  const q = query.toLowerCase();
  const label = concept.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (concept.aliases.some((a) => a.toLowerCase().includes(q))) return 50;
  if (concept.definition.toLowerCase().includes(q)) return 30;
  return 0;
}

export default function SearchBox({ concepts, base }: Props) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return concepts
      .map((c) => ({ concept: c, score: score(c, q) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.concept);
  }, [concepts, query]);

  return (
    <div className="search-box">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search concepts (e.g. “installment”, “compliance”)"
        aria-label="Search NPOGraph concepts"
        className="search-input"
      />
      {results.length > 0 && (
        <ul className="search-results" role="listbox">
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
        <p className="muted search-no-results">No concepts match "{query}".</p>
      )}
    </div>
  );
}
