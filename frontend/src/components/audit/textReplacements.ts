import { AuditFinding } from '../../types';

export interface SuggestionApplication {
  content: string;
  skipped: number;
}

export function applyUniqueSuggestions(
  content: string,
  findings: readonly AuditFinding[]
): SuggestionApplication {
  const candidates: Array<{ start: number; end: number; replacement: string }> = [];
  let skipped = 0;

  findings.forEach(finding => {
    const phrase = finding.flagged_text;
    if (!phrase || !finding.suggested_replacement || phrase === finding.suggested_replacement) {
      skipped += 1;
      return;
    }

    const first = content.indexOf(phrase);
    if (first < 0 || content.indexOf(phrase, first + 1) >= 0) {
      skipped += 1;
      return;
    }

    candidates.push({
      start: first,
      end: first + phrase.length,
      replacement: finding.suggested_replacement,
    });
  });

  const conflicts = new Set<number>();
  candidates.forEach((candidate, index) => {
    candidates.forEach((other, otherIndex) => {
      if (index !== otherIndex && candidate.start < other.end && other.start < candidate.end) {
        conflicts.add(index);
      }
    });
  });

  const applicable = candidates
    .filter((_, index) => !conflicts.has(index))
    .sort((a, b) => b.start - a.start);
  skipped += conflicts.size;

  let updatedContent = content;
  applicable.forEach(({ start, end, replacement }) => {
    updatedContent = `${updatedContent.slice(0, start)}${replacement}${updatedContent.slice(end)}`;
  });

  return { content: updatedContent, skipped };
}
