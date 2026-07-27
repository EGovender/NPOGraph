import { useEffect, useMemo, useState } from 'react';
import { CORE_CONCEPTS, DESIGN_QUESTIONS, DESIGN_SECTIONS, type DesignQuestion } from '../data/design-questions';
import { buildDesignJson, buildDesignJsonLd, buildDesignMarkdown, downloadFile } from '../data/design-export';
import { concepts, requireConcept } from '../data/ontology';
import { CATEGORIES } from '../data/categories';

interface Props {
  base: string;
}

function isVisible(q: DesignQuestion, answers: Record<string, string>): boolean {
  if (!q.showIf) return true;
  return answers[q.showIf.questionId] === q.showIf.equals;
}

function readAnswersFromURL(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const answers: Record<string, string> = {};
  for (const q of DESIGN_QUESTIONS) {
    const value = params.get(q.id);
    if (!value) continue;
    if (q.type === 'boolean') {
      if (value === 'yes' || value === 'no') answers[q.id] = value;
    } else if (q.options.some((o) => o.value === value)) {
      answers[q.id] = value;
    }
  }
  return answers;
}

export default function DesignWizard({ base }: Props) {
  // Starts empty (matching the server-rendered HTML) rather than reading the
  // URL eagerly -- doing that in the initializer would make the client's
  // first render disagree with the SSR-ed markup (0 answered on the server,
  // N on the client) and trigger a React hydration-mismatch, discarding and
  // re-rendering the whole tree. Restoring after mount, in an effect, avoids
  // that: it runs after hydration has already reconciled successfully.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const restored = readAnswersFromURL();
    if (Object.keys(restored).length > 0) setAnswers(restored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleQuestions = useMemo(
    () => DESIGN_QUESTIONS.filter((q) => isVisible(q, answers)),
    [answers]
  );

  const recommendedIds = useMemo(() => {
    const ids = new Set(CORE_CONCEPTS);
    for (const q of visibleQuestions) {
      const answer = answers[q.id];
      if (!answer) continue;
      if (q.type === 'boolean') {
        for (const id of answer === 'yes' ? q.yes : q.no) ids.add(id);
      } else {
        const opt = q.options.find((o) => o.value === answer);
        opt?.concepts.forEach((id) => ids.add(id));
      }
    }
    return ids;
  }, [answers, visibleQuestions]);

  const answeredCount = visibleQuestions.filter((q) => answers[q.id]).length;

  // Keep the URL in sync so the current answer set is a shareable link.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    for (const q of DESIGN_QUESTIONS) {
      if (answers[q.id]) params.set(q.id, answers[q.id]);
    }
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [answers]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function reset() {
    setAnswers({});
  }

  const recommendedByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    items: concepts.filter((c) => c.category === cat.id && recommendedIds.has(c.id)),
  })).filter((g) => g.items.length > 0);

  const recommendedConcepts = concepts.filter((c) => recommendedIds.has(c.id));
  const excluded = concepts.filter((c) => !recommendedIds.has(c.id));

  function exportAs(format: 'json' | 'jsonld' | 'markdown') {
    const input = { answers, recommended: recommendedConcepts, excluded };
    if (format === 'json') {
      downloadFile('npograph-design.json', buildDesignJson(input), 'application/json');
    } else if (format === 'jsonld') {
      downloadFile('npograph-design.jsonld', buildDesignJsonLd(recommendedConcepts), 'application/ld+json');
    } else {
      downloadFile('npograph-design.md', buildDesignMarkdown(input), 'text/markdown');
    }
  }

  function copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const openInGraphHref = `${base}explore?concepts=${Array.from(recommendedIds).join(',')}`;

  return (
    <div className="design-wizard">
      <div className="design-questions">
        <div className="design-progress muted">
          {answeredCount} of {visibleQuestions.length} answered ·{' '}
          <button type="button" className="design-reset" onClick={reset}>
            Reset
          </button>
        </div>

        {DESIGN_SECTIONS.map((section) => {
          const sectionQuestions = DESIGN_QUESTIONS.filter(
            (q) => q.section === section.id && isVisible(q, answers)
          );
          if (sectionQuestions.length === 0) return null;
          const sectionAnswered = sectionQuestions.filter((q) => answers[q.id]).length;
          return (
            <section key={section.id} className="design-section">
              <h2 className="design-section-title">
                {section.label}
                <span className="concept-group-count">
                  {sectionAnswered}/{sectionQuestions.length}
                </span>
              </h2>
              {sectionQuestions.map((q) => (
                <fieldset key={q.id} className="design-question">
                  <legend>{q.text}</legend>
                  {q.help && <p className="muted design-question-help">{q.help}</p>}
                  {q.type === 'boolean' ? (
                    <div className="design-options">
                      {(['yes', 'no'] as const).map((v) => (
                        <label key={v} className={`design-option${answers[q.id] === v ? ' selected' : ''}`}>
                          <input
                            type="radio"
                            name={q.id}
                            value={v}
                            checked={answers[q.id] === v}
                            onChange={() => setAnswer(q.id, v)}
                          />
                          {v === 'yes' ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="design-options">
                      {q.options.map((opt) => (
                        <label
                          key={opt.value}
                          className={`design-option${answers[q.id] === opt.value ? ' selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={opt.value}
                            checked={answers[q.id] === opt.value}
                            onChange={() => setAnswer(q.id, opt.value)}
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
              ))}
            </section>
          );
        })}
      </div>

      <aside className="design-result">
        <h2 className="inspector-group-title">Recommended for your program</h2>
        <p className="muted design-result-count">
          {recommendedIds.size} of {concepts.length} concepts
        </p>

        <div className="design-actions">
          <a className="home-cta home-cta-primary" href={openInGraphHref}>
            Open in graph
          </a>
          <button type="button" className="home-cta" onClick={copyLink}>
            {copied ? 'Link copied!' : 'Copy shareable link'}
          </button>
        </div>
        <div className="design-actions design-actions-export">
          <span className="muted">Export:</span>
          <button type="button" className="link-button" onClick={() => exportAs('json')}>
            JSON
          </button>
          <button type="button" className="link-button" onClick={() => exportAs('jsonld')}>
            JSON-LD
          </button>
          <button type="button" className="link-button" onClick={() => exportAs('markdown')}>
            Markdown
          </button>
        </div>

        {recommendedByCategory.map(({ category, items }) => (
          <section key={category.id} className="inspector-group">
            <h3 className="inspector-group-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                className="search-result-swatch"
                style={{ background: `light-dark(${category.colorLight}, ${category.colorDark})`, marginTop: 0 }}
              />
              {category.label}
            </h3>
            <ul className="design-concept-list">
              {items.map((c) => (
                <li key={c.id}>
                  <a href={`${base}concepts/${c.id}`}>{requireConcept(c.id).label}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {excluded.length > 0 && (
          <details className="design-excluded">
            <summary className="muted">Not included ({excluded.length})</summary>
            <ul className="design-concept-list">
              {excluded.map((c) => (
                <li key={c.id} className="muted">
                  <a href={`${base}concepts/${c.id}`}>{c.label}</a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </aside>
    </div>
  );
}
