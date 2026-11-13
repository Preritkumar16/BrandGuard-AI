
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Check, ArrowRight, Info } from 'lucide-react';
import { AuditFinding, EvidenceReference } from '../../types';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

interface AuditFindingsListProps {
  findings: AuditFinding[];
  onSelectEvidence: (
    evidence: EvidenceReference,
    ruleTitle: string,
    severity: AuditFinding['severity']
  ) => void;
  onApplySingleSuggestion?: (finding: AuditFinding) => void;
}

export const AuditFindingsList: React.FC<AuditFindingsListProps> = ({
  findings,
  onSelectEvidence,
  onApplySingleSuggestion,
}) => {
  if (findings.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-[#111827] border border-[#253047]">
        <div className="w-10 h-10 rounded-full bg-[#64748B]/10 border border-[#64748B]/30 flex items-center justify-center text-[#94A3B8] mx-auto mb-2.5">
          <Info className="w-5 h-5" />
        </div>

        <h4 className="text-sm font-semibold text-[#F8FAFC]">
          No Findings Returned
        </h4>

        <p className="text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
          The audit returned no findings. Check the audit outcome and validation
          status before treating the content as compliant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map(finding => {
        const evidence = finding.evidence;
        const isCompliant = finding.severity === 'compliant';
        const hasReplacement = Boolean(
          finding.suggested_replacement?.trim()
        );

        return (
          <div
            key={finding.id}
            className="p-4 rounded-xl bg-[#111827] border border-[#253047] hover:border-[#3B4866] transition-colors space-y-3"
          >
            {/* Severity, category and title */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge status={finding.severity} size="sm" />

                <span className="text-xs text-[#64748B]">
                  {finding.category}
                </span>

                <span className="text-xs font-semibold text-[#F8FAFC]">
                  {finding.title}
                </span>
              </div>

              {evidence ? (
                <button
                  onClick={() =>
                    onSelectEvidence(
                      evidence,
                      finding.title,
                      finding.severity
                    )
                  }
                  className="flex items-center gap-1.5 text-xs text-[#818CF8] hover:text-[#C0C1FF] transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />

                  <span>
                    {evidence.source_title
                      ? `${evidence.source_title}${evidence.source_version ? ` (${evidence.source_version})` : ''}`
                      : `View evidence (${evidence.passage_id})`}
                  </span>

                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-xs text-[#64748B]">
                  Evidence details unavailable
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">
              {finding.description}
            </p>

            {/* Flagged phrase and suggested replacement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-md bg-[#0D1220] border border-[#253047] space-y-1">
                <span className="text-xs text-[#94A3B8] block font-semibold">
                  {isCompliant ? 'Assessed Claim' : 'Flagged Phrase'}
                </span>

                <div className="text-[#E2E8F0]">
                  {finding.flagged_text || 'No text span provided'}
                </div>
              </div>

              {hasReplacement && (
                <div className="p-2.5 rounded-md bg-[#0D1220] border border-[#253047] space-y-1">
                  <span className="text-xs text-[#10B981] block font-semibold">
                    Suggested Replacement
                  </span>

                  <div className="text-[#10B981]">
                    {finding.suggested_replacement}
                  </div>
                </div>
              )}
            </div>

            {/* Evidence information */}
            <div className="pt-2 border-t border-[#253047] flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="text-[#64748B]">
                {evidence?.section ? (
                  <>
                    Cited Clause:{' '}
                    <span className="text-[#94A3B8]">
                      {evidence.section}
                    </span>
                  </>
                ) : evidence?.passage_id ? (
                  <>
                    Passage ID:{' '}
                    <span className="text-[#94A3B8]">
                      {evidence.passage_id}
                    </span>
                  </>
                ) : (
                  'No matched evidence passage'
                )}

                {finding.validation_status && (
                  <span className="ml-2">
                    Validation: {finding.validation_status}
                  </span>
                )}
              </div>

              {onApplySingleSuggestion && hasReplacement && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={
                    <Check className="w-3 h-3 text-[#10B981]" />
                  }
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
