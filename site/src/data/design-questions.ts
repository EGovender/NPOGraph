// "Design mode" question set -- see docs/04-roadmap.md Phase 3.
//
// This is application logic, not ontology content: it doesn't describe what
// concepts ARE, it encodes a recommendation heuristic ("if you do X, you
// probably need concept Y") on top of concepts that already exist. That's
// why it lives here in site/ rather than in ontology/source/ -- it has
// nothing to export as OWL/RDF.
//
// Design: mostly a flat, independent question list (each yes/no question
// toggles its own concepts in or out, with no effect on other questions) --
// simple to read, explain, and extend. A few follow-up questions are gated
// with `showIf` on a prior answer, but only where asking them unconditionally
// would be nonsensical (e.g. "does review include site visits?" makes no
// sense if there's no review process at all). One question is a single-select
// branch (funding restriction) because "restricted vs. unrestricted" isn't a
// yes/no toggle. This is deliberately NOT a general branching tree -- every
// question's dependency is at most one level deep.
import { concepts } from './ontology';

export interface BooleanQuestion {
  id: string;
  type: 'boolean';
  text: string;
  help?: string;
  showIf?: { questionId: string; equals: string };
  yes: string[];
  no: string[];
}

export interface SingleSelectOption {
  value: string;
  label: string;
  concepts: string[];
}

export interface SingleSelectQuestion {
  id: string;
  type: 'single-select';
  text: string;
  help?: string;
  showIf?: { questionId: string; equals: string };
  options: SingleSelectOption[];
}

export type DesignQuestion = BooleanQuestion | SingleSelectQuestion;

/** Concepts every grantmaking program needs, regardless of how the questions are answered. */
export const CORE_CONCEPTS: string[] = [
  'organization',
  'funder',
  'grantee',
  'program-officer',
  'grant-administrator',
  'grant-program',
  'funding-opportunity',
  'funding-cycle',
  'eligibility-criteria',
  'budget',
  'application',
  'decision',
  'award',
  'grant-agreement',
  'terms-and-conditions',
  'payment',
  'closeout',
  'grant-lifecycle',
];

export const DESIGN_QUESTIONS: DesignQuestion[] = [
  {
    id: 'loi',
    type: 'boolean',
    text: 'Do you require a Letter of Inquiry (a short screening step) before inviting a full application?',
    yes: ['letter-of-inquiry'],
    no: [],
  },
  {
    id: 'review',
    type: 'boolean',
    text: 'Do applications go through a formal review and scoring process before a decision is made?',
    yes: ['review', 'review-criteria', 'reviewer'],
    no: [],
  },
  {
    id: 'site-visit',
    type: 'boolean',
    text: 'Does that review process include site visits?',
    showIf: { questionId: 'review', equals: 'yes' },
    yes: ['site-visit'],
    no: [],
  },
  {
    id: 'funding-restriction',
    type: 'single-select',
    text: 'Is the funding you award restricted to a specific purpose, unrestricted, or does it vary by grant?',
    options: [
      { value: 'restricted', label: 'Always restricted', concepts: ['restricted-funding'] },
      { value: 'unrestricted', label: 'Always unrestricted', concepts: ['unrestricted-funding'] },
      { value: 'varies', label: 'Depends on the grant', concepts: ['restricted-funding', 'unrestricted-funding'] },
    ],
  },
  {
    id: 'matching',
    type: 'boolean',
    text: 'Do grantees need to raise or contribute matching funds?',
    yes: ['matching-requirement'],
    no: [],
  },
  {
    id: 'fiscal-sponsorship',
    type: 'boolean',
    text: 'Might a grantee lack independent legal status and need a fiscal sponsor to receive funds on their behalf?',
    yes: ['fiscal-sponsor'],
    no: [],
  },
  {
    id: 'installments',
    type: 'boolean',
    text: 'Are funds disbursed in multiple installments over time, rather than a single payment?',
    yes: ['payment-schedule', 'installment'],
    no: [],
  },
  {
    id: 'payment-condition',
    type: 'boolean',
    text: 'Must a condition (like a submitted report or a milestone) be met before each installment is released?',
    showIf: { questionId: 'installments', equals: 'yes' },
    yes: ['payment-condition'],
    no: [],
  },
  {
    id: 'reporting',
    type: 'boolean',
    text: 'Do grantees need to submit reports (narrative and/or financial) during the grant?',
    yes: ['report', 'reporting-schedule', 'compliance-requirement'],
    no: [],
  },
  {
    id: 'audit',
    type: 'boolean',
    text: 'Do you require independent financial audits for some or all grants?',
    showIf: { questionId: 'reporting', equals: 'yes' },
    yes: ['audit'],
    no: [],
  },
  {
    id: 'indirect-costs',
    type: 'boolean',
    text: 'Do grantees charge indirect/overhead costs against the award?',
    yes: ['indirect-cost-rate'],
    no: [],
  },
  {
    id: 'amendments',
    type: 'boolean',
    text: 'Might the amount, timeline, or terms need to change after the agreement is signed?',
    yes: ['amendment', 'budget-modification'],
    no: [],
  },
  {
    id: 'evaluation',
    type: 'boolean',
    text: 'Do you formally evaluate outcomes or impact after the grant period?',
    yes: ['evaluation', 'output', 'outcome', 'theory-of-change', 'logic-model'],
    no: [],
  },
];

// Fail fast on a typo'd concept id rather than silently recommending nothing.
const conceptIds = new Set(concepts.map((c) => c.id));
function checkIds(ids: string[], where: string) {
  for (const id of ids) {
    if (!conceptIds.has(id)) throw new Error(`design-questions.ts: unknown concept "${id}" in ${where}`);
  }
}
checkIds(CORE_CONCEPTS, 'CORE_CONCEPTS');
for (const q of DESIGN_QUESTIONS) {
  if (q.type === 'boolean') {
    checkIds(q.yes, `question "${q.id}" (yes)`);
    checkIds(q.no, `question "${q.id}" (no)`);
  } else {
    for (const opt of q.options) checkIds(opt.concepts, `question "${q.id}" option "${opt.value}"`);
  }
}
