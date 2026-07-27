// Pure builders for the Design tool's three export formats (JSON, JSON-LD,
// Markdown) -- kept separate from DesignWizard.tsx so the output shape can be
// reasoned about independently of the answer-tracking/rendering logic.
import { CATEGORIES, getCategory } from './categories';
import { conceptJsonLd, ontologyVersion, type Concept } from './ontology';

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
    lines.push(`## Not included (${excluded.length})`, '');
    for (const c of [...excluded].sort((a, b) => a.label.localeCompare(b.label))) {
      lines.push(`- ${c.label} (${getCategory(c.category).label})`);
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
