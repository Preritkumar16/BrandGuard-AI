/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, CheckCircle, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { AuditFinding, EvidenceReference } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InspectionDiffBoxProps {
  originalContent: string;
  findings: AuditFinding[];
  onSelectEvidence: (evidence: EvidenceReference, ruleTitle: string, severity: AuditFinding['severity']) => void;
  onApplyAllSuggestions?: (newContent: string) => void;
}

export const InspectionDiffBox: React.FC<InspectionDiffBoxProps> = ({
  originalContent,
  findings,
  onSelectEvidence,
  onApplyAllSuggestions,
}) => {
  // Generate suggested text preview
  let suggestedContent = originalContent;
  findings.forEach(f => {
    if (f.flagged_text && f.suggested_replacement) {
      suggestedContent = suggestedContent.replace(f.flagged_text, f.suggested_replacement);
    }
  });

  return (
    <div className="rounded-xl border border-[#253047] bg-[#111827] overflow-hidden shadow-sm">
      {/* Diff Box Bar Header */}
      <div className="px-5 py-3.5 border-b border-[#253047] bg-[#0D1220] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-xs font-semibold text-[#F8FAFC]">
              AI Inspection Diff Box
            </span>
          </div>
          <span className="text-xs text-[#64748B]">|</span>
          <span className="text-xs text-[#94A3B8]">
            <strong className="text-[#F8FAFC] tabular-nums font-mono">{findings.length}</strong> Evidence-Linked Flags Detected
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onApplyAllSuggestions && findings.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />}
              onClick={() => onApplyAllSuggestions(suggestedContent)}
            >
              Stage Revisions in New Version
            </Button>
          )}
        </div>
      </div>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#253047]">
        {/* Left Side: Submitted Copy with Unapproved Breaches Highlighted */}
        <div className="p-5 flex flex-col bg-[#0B0F19]/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#EF4444] font-semibold bg-[#EF4444]/10 px-2 py-0.5 rounded border border-[#EF4444]/25">
                Submitted Draft (Immutable)
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] font-mono">
              Click flags below to view evidence
            </span>
          </div>

          <div className="flex-1 rounded-lg bg-[#0D1220] border border-[#253047] p-4 text-xs font-mono leading-relaxed text-[#94A3B8] whitespace-pre-wrap">
            {originalContent}
          </div>

          {/* Interactive Flag Pills for Left Column */}
          {findings.length > 0 && (
            <div className="mt-3.5 space-y-2">
              <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider block">
                Detected Guideline Flags (Click to inspect evidence):
              </span>
              <div className="space-y-1.5">
                {findings.map(finding => (
                  <div
                    key={finding.id}
                    onClick={() => onSelectEvidence(finding.evidence, finding.title, finding.severity)}
                    className="p-2.5 rounded-md bg-[#161E2E] border border-[#EF4444]/30 hover:border-[#EF4444] transition-all cursor-pointer flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                      <span className="text-[#EF4444] font-mono line-through font-medium truncate">
                        "{finding.flagged_text}"
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge status={finding.severity} size="sm" />
                      <span className="text-[10px] text-[#818CF8] group-hover:underline flex items-center gap-1 font-sans">
                        Evidence <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Compliant / Suggested Revision */}
        <div className="p-5 flex flex-col bg-[#0B0F19]/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#10B981] font-semibold bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25">
                Compliant Revision Target
              </span>
            </div>
            <span className="text-[11px] text-[#10B981] font-mono flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified Alignment
            </span>
          </div>

          <div className="flex-1 rounded-lg bg-[#0D1220] border border-[#253047] p-4 text-xs font-mono leading-relaxed text-[#F8FAFC] whitespace-pre-wrap border-l-2 border-l-[#10B981]">
            {suggestedContent}
          </div>

          {/* Inline Approved Replacements list */}
          {findings.length > 0 && (
            <div className="mt-3.5 space-y-2">
              <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider block">
                Approved Replacements Derived from Guidelines:
              </span>
              <div className="space-y-1.5">
                {findings.map(finding => (
                  <div
                    key={`sug-${finding.id}`}
                    onClick={() => onSelectEvidence(finding.evidence, finding.title, finding.severity)}
                    className="p-2.5 rounded-md bg-[#161E2E] border border-[#10B981]/30 hover:border-[#10B981] transition-all cursor-pointer flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      <span className="text-[#10B981] font-mono font-medium truncate">
                        "{finding.suggested_replacement}"
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        {finding.evidence.source_version}
                      </span>
                      <span className="text-[10px] text-[#818CF8] group-hover:underline">
                        Rule ➔
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
