// Pure builders for the Design tool's export formats (a plain-language
// summary, plus JSON, JSON-LD, and Markdown for developers) -- kept separate
// from DesignWizard.tsx so the output shape can be reasoned about
// independently of the answer-tracking/rendering logic.
import { CATEGORIES, getCategory } from './categories';
import { conceptJsonLd, ontologyVersion, type Concept } from './ontology';
import type { DesignQuestion, DesignSection } from './design-questions';

export interface DesignExportInput {
  answers: Record<string, string>;
  recommended: Concept[];
  excluded: Concept[];
}

export function buildDesignJson({ answers, recommended, excluded }: DesignExportInput): string {
  const payload = {
    generatedBy: 'NPOGraph Design Tool',
    ontologyVersion,
    generatedAt: new Date().toISOString(),
    answers,
    recommendedConcepts: recommended.map((c) => ({ id: c.id, label: c.label, category: c.category })),
    excludedConcepts: excluded.map((c) => ({ id: c.id, label: c.label, category: c.category })),
  };
  return JSON.stringify(payload, null, 2);
}

export function buildDesignJsonLd(recommended: Concept[]): string {
  const context = {
    npo: 'https://egovender.github.io/NPOGraph/ontology/',
    owl: 'http://www.w3.org/2002/07/owl#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    label: 'rdfs:label',
    definition: 'skos:definition',
    altLabel: 'skos:altLabel',
    category: 'npo:category',
    subClassOf: { '@id': 'rdfs:subClassOf', '@type': '@id' },
    type: '@type',
    id: '@id',
  };
  const graph = recommended.map((c) => conceptJsonLd(c));
  return JSON.stringify({ '@context': context, '@graph': graph }, null, 2);
}

export function buildDesignMarkdown({ recommended, excluded }: DesignExportInput): string {
  const lines: string[] = [
    '# NPOGraph Design Recommendation',
    '',
    `Generated from the [NPOGraph Design tool](https://egovender.github.io/NPOGraph/design/) against ontology v${ontologyVersion}.`,
    '',
    `${recommended.length} of ${recommended.length + excluded.length} concepts recommended.`,
    '',
  ];

  for (const category of CATEGORIES) {
    const items = recommended.filter((c) => c.category === category.id);
    if (items.length === 0) continue;
    lines.push(`## ${category.label}`, '');
    for (const c of items.sort((a, b) => a.label.localeCompare(b.label))) {
      lines.push(`- **${c.label}** -- ${c.definition}`);
    }
    lines.push('');
  }

  if (excluded.length > 0) {
    lines.push(`## Not currently selected (${excluded.length})`, '');
    for (const c of [...excluded].sort((a, b) => a.label.localeCompare(b.label))) {
      lines.push(`- ${c.label} (${getCategory(c.category).label})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/** The practitioner-facing "Download summary" export -- your answers as
 * plain sentences, then the recommendation, then what's still worth
 * reviewing, instead of a developer-oriented concept dump. */
export function buildDesignSummary(
  { answers, recommended, excluded }: DesignExportInput,
  visibleQuestions: DesignQuestion[],
  sections: DesignSection[]
): string {
  const lines: string[] = [
    '# Your Grantmaking Program',
    '',
    `A summary from the [NPOGraph Model Your Program tool](https://egovender.github.io/NPOGraph/design/), against ontology v${ontologyVersion}.`,
    '',
  ];

  const answeredQuestions = visibleQuestions.filter((q) => answers[q.id]);
  lines.push('## Your operating model', '');
  if (answeredQuestions.length === 0) {
    lines.push('No questions answered yet -- the recommendation below is just the foundation every grantmaking program needs.', '');
  } else {
    for (const section of sections) {
      const sectionAnswered = answeredQuestions.filter((q) => q.section === section.id);
      if (sectionAnswered.length === 0) continue;
      lines.push(`### ${section.label}`, '');
      for (const q of sectionAnswered) {
        const answerLabel =
          q.type === 'boolean' ? (answers[q.id] === 'yes' ? 'Yes' : 'No') : q.options.find((o) => o.value === answers[q.id])?.label ?? answers[q.id];
        lines.push(`- ${q.text} **${answerLabel}**`);
      }
      lines.push('');
    }
  }

  lines.push(`## Recommended concepts (${recommended.length} of ${recommended.length + excluded.length})`, '');
  for (const category of CATEGORIES) {
    const items = recommended.filter((c) => c.category === category.id);
    if (items.length === 0) continue;
    lines.push(`**${category.label}:** ${items.map((c) => c.label).sort().join(', ')}`, '');
  }

  const unanswered = visibleQuestions.filter((q) => !answers[q.id]);
  lines.push('## Suggested next questions', '');
  if (unanswered.length === 0) {
    lines.push("You've answered every applicable question.", '');
  } else {
    for (const q of unanswered.slice(0, 10)) {
      lines.push(`- ${q.text}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
