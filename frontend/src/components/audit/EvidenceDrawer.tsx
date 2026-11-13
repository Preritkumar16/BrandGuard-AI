
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { EvidenceReference, FindingSeverity } from '../../types';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

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

  const canOpenSource = Boolean(evidence.source_id && onViewSource);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#111827] border-l border-[#253047] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.85)] flex flex-col">
      <div className="px-5 py-4 border-b border-[#253047] flex items-center justify-between bg-[#0D1220]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#F8FAFC]">
              Audit Evidence
            </h3>
            <p className="text-[10px] text-[#94A3B8]">
              Backend-provided evidence reference
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close evidence drawer"
          className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#161E2E] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5 text-xs text-[#94A3B8]">
        <div className="p-3.5 rounded-lg bg-[#161E2E] border border-[#253047] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
              Governance Impact
            </span>
            <Badge status={severity} size="sm" />
          </div>

          {evidence.source_version_id && (
            <div>
              <div className="text-[10px] uppercase font-mono text-[#64748B] mb-1">
                Source Version ID
              </div>
              <div className="text-[11px] text-[#CBD5E1] font-mono break-all">
                {evidence.source_version_id}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase font-mono text-[#64748B] mb-1">
              Passage ID
            </div>
            <div className="text-[11px] text-[#CBD5E1] font-mono break-all">
              {evidence.passage_id}
            </div>
          </div>
        </div>

        {ruleTitle && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider">
              Finding Category
            </span>
            <div className="text-xs font-medium text-[#F8FAFC] bg-[#161E2E] p-3 rounded-md border border-[#253047]">
              {ruleTitle}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-mono text-[#64748B] tracking-wider flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#818CF8]" />
            Retrieved Evidence Passage
          </span>

          <div className="p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] text-sm leading-relaxed text-[#F8FAFC] border-l-2 border-l-[#6366F1] whitespace-pre-wrap">
            {evidence.excerpt}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/20 text-[11px] leading-relaxed text-[#F59E0B]/90 flex gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#F59E0B] mt-0.5" />
          <span>
            This passage is provided as an audit evidence reference.
            Verify the original source and its approval status before
            making a governance decision.
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-[#253047] bg-[#0D1220] flex items-center justify-between">
        {canOpenSource ? (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={() => onViewSource?.(evidence.source_id!)}
          >
            Inspect Source
          </Button>
        ) : (
          <span className="text-[10px] text-[#64748B]">
            Source navigation unavailable
          </span>
        )}

        <Button variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
};
