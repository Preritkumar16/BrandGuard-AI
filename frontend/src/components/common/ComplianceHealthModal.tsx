/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Layers } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';

interface ComplianceHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSources: (category?: string) => void;
}

export const ComplianceHealthModal: React.FC<ComplianceHealthModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSources,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Brand Compliance Index Breakdown"
      description="Real-time statutory alignment, brand adherence, and deterministic policy metrics"
      maxWidth="2xl"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Close Analysis
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Overall Score Card */}
        <div className="p-4 rounded-xl bg-[#0D1220] border border-[#253047] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
              Aggregate Organization Index
            </span>
            <div className="text-3xl font-bold text-[#F8FAFC] font-mono tabular-nums flex items-baseline gap-2">
              <span>94.2%</span>
              <span className="text-xs text-[#10B981] font-sans font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +2.4% this cycle
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Evaluated across 73 indexed brand rules and 21 active campaign drafts.
            </p>
          </div>

          <div className="w-14 h-14 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        {/* 4 Category Breakdowns */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-[#F8FAFC] block">
            Domain Compliance Scores (Click to inspect source guidelines):
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              onClick={() => {
                onNavigateToSources('legal');
                onClose();
              }}
              className="p-3.5 rounded-lg bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                  Legal & Disclaimers
                </span>
                <span className="font-mono text-[#10B981] font-bold">98.2%</span>
              </div>
              <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full" style={{ width: '98.2%' }} />
              </div>
              <div className="text-[11px] text-[#64748B] flex justify-between">
                <span>Safe Harbor & ROI Rules</span>
                <span className="text-[#818CF8] group-hover:underline">Inspect ➔</span>
              </div>
            </div>

            <div
              onClick={() => {
                onNavigateToSources('security');
                onClose();
              }}
              className="p-3.5 rounded-lg bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                  Data Security & Claims
                </span>
                <span className="font-mono text-[#10B981] font-bold">99.0%</span>
              </div>
              <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden">
                <div className="h-full bg-[#10B981] rounded-full" style={{ width: '99%' }} />
              </div>
              <div className="text-[11px] text-[#64748B] flex justify-between">
                <span>SOC 2 & Absolute Claim Rules</span>
                <span className="text-[#818CF8] group-hover:underline">Inspect ➔</span>
              </div>
            </div>

            <div
              onClick={() => {
                onNavigateToSources('trademark');
                onClose();
              }}
              className="p-3.5 rounded-lg bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                  Trademark & Nomenclature
                </span>
                <span className="font-mono text-[#818CF8] font-bold">95.0%</span>
              </div>
              <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden">
                <div className="h-full bg-[#6366F1] rounded-full" style={{ width: '95%' }} />
              </div>
              <div className="text-[11px] text-[#64748B] flex justify-between">
                <span>Product CamelCase & ™ Rules</span>
                <span className="text-[#818CF8] group-hover:underline">Inspect ➔</span>
              </div>
            </div>

            <div
              onClick={() => {
                onNavigateToSources('tone_voice');
                onClose();
              }}
              className="p-3.5 rounded-lg bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                  Brand Tone & Superlatives
                </span>
                <span className="font-mono text-[#F59E0B] font-bold">91.4%</span>
              </div>
              <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden">
                <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: '91.4%' }} />
              </div>
              <div className="text-[11px] text-[#64748B] flex justify-between">
                <span>Prohibited Marketing Buzzwords</span>
                <span className="text-[#818CF8] group-hover:underline">Inspect ➔</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Engine Telemetry */}
        <div className="p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] text-[11px] text-[#94A3B8] font-mono space-y-1">
          <div className="text-[#F8FAFC] font-semibold">Audit Engine Telemetry (bg-sentinel-engine-4.1.0)</div>
          <div>• Latency: 12ms deterministic rule pass</div>
          <div>• Passage Coverage: 100% of ratified brand policies active</div>
          <div>• Strictness: Enterprise Standard (zero-tolerance on statutory breaches)</div>
        </div>
      </div>
    </Modal>
  );
};
