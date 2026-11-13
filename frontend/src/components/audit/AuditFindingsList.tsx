/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Check, ArrowRight } from 'lucide-react';
import { AuditFinding, EvidenceReference } from '../../types';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

interface AuditFindingsListProps {
  findings: AuditFinding[];
  onSelectEvidence: (evidence: EvidenceReference, ruleTitle: string, severity: AuditFinding['severity']) => void;
  onApplySingleSuggestion?: (finding: AuditFinding) => void;
  emptyStateTitle: string;
  emptyStateMessage: string;
}

export const AuditFindingsList: React.FC<AuditFindingsListProps> = ({
  findings,
  onSelectEvidence,
  onApplySingleSuggestion,
  emptyStateTitle,
  emptyStateMessage,
}) => {
  if (findings.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-[#111827] border border-[#253047]">
        <div className="w-10 h-10 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8] mx-auto mb-2.5">
          <BookOpen className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-[#F8FAFC]">{emptyStateTitle}</h4>
        <p className="text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
          {emptyStateMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#64748B]">
        Suggested replacements are recommendations only and do not guarantee approval.
      </p>
      {findings.map(finding => {
        return (
          <div
            key={finding.id}
            className="p-4 rounded-xl bg-[#111827] border border-[#253047] hover:border-[#3B4866] transition-colors space-y-3"
          >
            {/* Top row: Severity, Category, Title */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge status={finding.severity} size="sm" />
                <span className="text-xs text-[#64748B]">
                  {finding.category}
                </span>
                <span className="text-xs font-semibold text-[#F8FAFC]">
                  {finding.title}
                </span>
              </div>
              <button
                onClick={() => onSelectEvidence(finding.evidence, finding.title, finding.severity)}
                className="flex items-center gap-1.5 text-xs text-[#818CF8] hover:text-[#C0C1FF] transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{finding.evidence.source_title} ({finding.evidence.source_version})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {finding.description}
            </p>

            {/* Flagged vs Suggested Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-md bg-[#0D1220] border border-[#253047] space-y-1">
                <span className="text-xs text-[#EF4444] block font-semibold">
                  Flagged Phrase
                </span>
                <div className="text-[#EF4444] line-through">
                  "{finding.flagged_text}"
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-[#0D1220] border border-[#253047] space-y-1">
                <span className="text-xs text-[#10B981] block font-semibold">
                  Suggested replacement
                </span>
                <div className="text-[#10B981]">
                  "{finding.suggested_replacement}"
                </div>
              </div>
            </div>

            {/* Footer with actions */}
            <div className="pt-2 border-t border-[#253047] flex items-center justify-between text-[11px]">
              <div className="text-[#64748B]">
                Cited Clause: <span className="text-[#94A3B8]">{finding.evidence.section}</span>
              </div>
              {onApplySingleSuggestion && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Check className="w-3 h-3 text-[#10B981]" />}
                  onClick={() => onApplySingleSuggestion(finding)}
                >
                  Apply to Draft
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
