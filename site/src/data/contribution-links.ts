// Builds pre-filled links to the repo's GitHub Issue Forms (.github/ISSUE_TEMPLATE/*.yml).
//
// GitHub only pre-fills `input`/`textarea` fields from query parameters (matched by the
// form's field `id`) -- dropdowns and checkboxes can't be reliably pre-filled this way, so
// callers here only ever set text-field values, never dropdown/checkbox ones.

const ISSUES_NEW_URL = 'https://github.com/EGovender/commongood-atlas/issues/new';

function issueFormUrl(template: string, params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  usp.set('template', template);
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  return `${ISSUES_NEW_URL}?${usp.toString()}`;
}

export function suggestNewConceptUrl(name?: string): string {
  return issueFormUrl('new-concept.yml', {
    title: name ? `[New Concept] ${name}` : undefined,
    concept: name,
  });
}

export function suggestConceptChangeUrl(conceptLabel: string, conceptUrl?: string): string {
  return issueFormUrl('change-concept.yml', {
    title: `[Concept Change] ${conceptLabel}`,
    concept: conceptLabel,
    'concept-url': conceptUrl,
  });
}

export function suggestPropertyUrl(conceptLabel: string): string {
  return issueFormUrl('property.yml', {
    title: `[Property] ${conceptLabel}`,
    concept: conceptLabel,
  });
}

export function suggestRelationshipUrl(options?: { fromLabel?: string; relLabel?: string; toLabel?: string }): string {
  const { fromLabel, relLabel, toLabel } = options ?? {};
  return issueFormUrl('relationship.yml', {
    title: fromLabel && toLabel ? `[Relationship] ${fromLabel} -> ${toLabel}` : undefined,
    'from-concept': fromLabel,
    relationship: relLabel,
    'to-concept': toLabel,
  });
}

export function suggestBusinessRuleUrl(conceptLabel: string): string {
  return issueFormUrl('business-rule.yml', {
    title: `[Business Rule] ${conceptLabel}`,
    concepts: conceptLabel,
  });
}

export function suggestScenarioUrl(): string {
  return issueFormUrl('scenario.yml', {});
}

export function suggestReferenceUrl(): string {
  return issueFormUrl('reference.yml', {});
}

export function suggestDocumentationUrl(page?: string): string {
  return issueFormUrl('documentation.yml', { page });
}

export function reportSiteBugUrl(pageUrl?: string): string {
  return issueFormUrl('site-bug.yml', { 'page-url': pageUrl });
}

export function suggestFeatureUrl(): string {
  return issueFormUrl('feature-request.yml', {});
}

export function otherFeedbackUrl(): string {
  return issueFormUrl('other-feedback.yml', {});
}
