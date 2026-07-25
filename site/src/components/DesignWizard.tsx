import { useMemo, useState } from 'react';
import { CORE_CONCEPTS, DESIGN_QUESTIONS, type DesignQuestion } from '../data/design-questions';
import { concepts, requireConcept } from '../data/ontology';
import { CATEGORIES } from '../data/categories';

interface Props {
  base: string;
}

function isVisible(q: DesignQuestion, answers: Record<string, string>): boolean {
  if (!q.showIf) return true;
  return answers[q.showIf.questionId] === q.showIf.equals;
}

export default function DesignWizard({ base }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

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

  const excluded = concepts.filter((c) => !recommendedIds.has(c.id));

  return (
    <div className="design-wizard">
      <div className="design-questions">
        <div className="design-progress muted">
          {answeredCount} of {visibleQuestions.length} answered ·{' '}
          <button type="button" className="design-reset" onClick={reset}>
            Reset
          </button>
        </div>
        {DESIGN_QUESTIONS.map((q) => {
          if (!isVisible(q, answers)) return null;
          return (
            <fieldset key={q.id} className="design-question">
              <legend>{q.text}</legend>
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
          );
        })}
      </div>

      <aside className="design-result">
        <h2 className="inspector-group-title">Recommended for your program</h2>
        <p className="muted design-result-count">
          {recommendedIds.size} of {concepts.length} concepts
        </p>
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
