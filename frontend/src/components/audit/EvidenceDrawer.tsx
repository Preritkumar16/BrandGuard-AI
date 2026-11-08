/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { EvidenceReference, FindingSeverity } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EvidenceDrawerProps {
  evidence: EvidenceReference | null;
  severity?: FindingSeverity;
  ruleTitle?: string;
  onClose: () => void;
  onViewSource?: (sourceId: string) => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  evidence,
  severity = 'warning',
  ruleTitle,
  onClose,
  onViewSource,
}) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#111827] border-l border-[#253047] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.85)] flex flex-col">
      {/* Drawer Header */}
      <div className="px-5 py-4 border-b border-[#253047] flex items-center justify-between bg-[#0D1220]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#F8FAFC]">
              Authoritative Evidence Reference
            </h3>
            <p className="text-[10px] text-[#94A3B8]">
              Linked Brand Guideline Clause
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#161E2E] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs text-[#94A3B8]">
        {/* Source Metadata Banner */}
        <div className="p-3.5 rounded-lg bg-[#161E2E] border border-[#253047] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
              Brand Source
            </span>
            <Badge variant="info" size="sm">
              {evidence.source_version}
            </Badge>
          </div>
          <div className="text-sm font-semibold text-[#F8FAFC]">
            {evidence.source_title}
          </div>
          <div className="text-[11px] text-[#818CF8] font-mono">
            {evidence.section}
          </div>
        </div>

        {/* Confidence & Severity Indicator */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047]">
            <div className="text-[10px] text-[#64748B] uppercase font-mono mb-1">
              Match Confidence
            </div>
            <div className="text-base font-semibold text-[#F8FAFC] tabular-nums font-mono flex items-center gap-1.5">
              <span>{(evidence.match_confidence * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-[#10B981] font-normal">Deterministic</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047]">
            <div className="text-[10px] text-[#64748B] uppercase font-mono mb-1">
              Governance Impact
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge status={severity} size="sm" />
            </div>
          </div>
        </div>

        {/* Rule Definition */}
        {ruleTitle && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider">
              Enforced Policy Rule
            </span>
            <div className="text-xs font-medium text-[#F8FAFC] bg-[#161E2E] p-3 rounded-md border border-[#253047]">
              {ruleTitle}
            </div>
          </div>
        )}

        {/* Verbatim Source Excerpt */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" />
            Verbatim Passage in Approved Guideline
          </span>
          <div className="p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] text-xs leading-relaxed text-[#F8FAFC] font-mono border-l-2 border-l-[#6366F1]">
            "{evidence.excerpt}"
          </div>
        </div>

        {/* Regulatory Governance Note */}
        <div className="p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/20 text-[11px] leading-relaxed text-[#F59E0B]/90 flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#F59E0B] mt-0.5" />
          <span>
            Product Rule 7: Evidence references must be verified against immutable source passages. Unapproved departures must be resolved before campaign launch.
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#253047] bg-[#0D1220] flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={() => onViewSource && onViewSource(evidence.source_id)}
        >
          Inspect Full Source Document
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
};
