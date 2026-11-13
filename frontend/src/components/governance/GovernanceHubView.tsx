/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight,
  Fingerprint,
  FileCheck,
  Cpu,
  Search,
  ChevronRight,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
  Hash,
  Database,
  Check,
  Scale,
  Globe,
  Sliders,
  X,
  FileText,
} from 'lucide-react';
import { BrandSource, User } from '../../types';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Card } from '../UI/Card';
import {
  governanceService,
  ReviewRequiredItem,
  ApprovalVerificationResult,
  SpecialistModuleStatus,
} from '../../services/API/governanceService';

interface GovernanceHubViewProps {
  sources: BrandSource[];
  currentUser: User;
  onNavigateToSources: (category?: string) => void;
  onSelectAsset?: (assetId: string) => void;
  onOpenNewSourceModal?: () => void;
}

export const GovernanceHubView: React.FC<GovernanceHubViewProps> = ({
  sources,
  currentUser,
  onNavigateToSources,
  onSelectAsset,
  onOpenNewSourceModal,
}) => {
  const [activeTab, setActiveTab] = useState<'re_review' | 'verifier' | 'agents' | 'frameworks'>('re_review');
  const [reviewRequiredList, setReviewRequiredList] = useState<ReviewRequiredItem[]>([]);
  const [loadingReAuditId, setLoadingReAuditId] = useState<string | null>(null);
  const [reAuditSuccessMessage, setReAuditSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Verifier State
  const [verificationInputId, setVerificationInputId] = useState('appr-sec-9941a8');
  const [verificationResult, setVerificationResult] = useState<ApprovalVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Specialist Modules from Agents.md
  const [modules, setModules] = useState<SpecialistModuleStatus[]>([]);

  useEffect(() => {
    governanceService.getReviewRequiredAssets().then(setReviewRequiredList);
    setModules(governanceService.getSpecialistModules());
    // Auto-run initial verification sample
    governanceService.verifyApprovalIntegrity('appr-sec-9941a8').then(setVerificationResult);
  }, []);

  const totalPassages = sources.reduce((acc, s) => acc + (s.passage_count || 0), 0);
  const pendingReAudits = reviewRequiredList.filter(r => r.status === 'pending_re_audit').length;
  const reAuditedCount = reviewRequiredList.filter(r => r.status === 're_audited').length;

  const handleTriggerReAudit = async (item: ReviewRequiredItem) => {
    setLoadingReAuditId(item.id);
    try {
      const res = await governanceService.triggerReAudit(item.id);
      setReAuditSuccessMessage(res.message);
      const updated = await governanceService.getReviewRequiredAssets();
      setReviewRequiredList(updated);
      setTimeout(() => setReAuditSuccessMessage(null), 5000);
    } finally {
      setLoadingReAuditId(null);
    }
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    try {
      const result = await governanceService.verifyApprovalIntegrity(verificationInputId);
      setVerificationResult(result);
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredReReviewList = reviewRequiredList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.assetTitle.toLowerCase().includes(q) ||
      item.dependentSourceTitle.toLowerCase().includes(q) ||
      item.triggerReason.toLowerCase().includes(q) ||
      item.creatorName.toLowerCase().includes(q)
    );
  });

  const regulatoryFrameworks = [
    {
      id: 'reg-eu-ai',
      name: 'EU Artificial Intelligence Act (Title IV)',
      authority: 'European Commission / DG CNECT',
      scope: 'AI-Generated Copy & Machine Translation Disclosures',
      status: 'active',
      complianceScore: '100%',
      ruleCount: 8,
      lastAudit: 'Today, 09:30 UTC',
      description: 'Mandates explicit disclosure of synthetic content and provides human-in-the-loop review trails for regulated enterprise collateral.',
    },
    {
      id: 'reg-ftc-endorsements',
      name: 'FTC 16 CFR Part 255 (Guides on Endorsements)',
      authority: 'Federal Trade Commission',
      scope: 'Testimonials, Case Studies & Customer ROI Assertions',
      status: 'active',
      complianceScore: '98.5%',
      ruleCount: 14,
      lastAudit: 'Yesterday',
      description: 'Strict prohibition on unsubstantiated performance claims, mandatory atypicality disclosures, and verifiable customer metric attestation.',
    },
    {
      id: 'reg-sec-10b5',
      name: 'SEC Rule 10b-5 & PSLRA Safe Harbor Disclaimers',
      authority: 'Securities and Exchange Commission',
      scope: 'Forward-Looking Financial & Commercial Growth Claims',
      status: 'active',
      complianceScore: '100%',
      ruleCount: 11,
      lastAudit: '2 days ago',
      description: 'Requires explicit cautionary statements identifying important factors that could cause actual enterprise results to differ materially.',
    },
    {
      id: 'reg-gdpr-art22',
      name: 'GDPR Article 22 & Automated Decision Safeguards',
      authority: 'European Data Protection Board',
      scope: 'Human-in-the-Loop Content Approval Separation',
      status: 'active',
      complianceScore: '100%',
      ruleCount: 6,
      lastAudit: 'Today, 08:15 UTC',
      description: 'Ensures that automated audit agents operate as advisory decision-support tools without autonomous publication rights.',
    },
    {
      id: 'reg-uspto-tm',
      name: 'USPTO & WIPO Trademark Syntax Standards',
      authority: 'Patent and Trademark Office',
      scope: 'SentinelMesh™ and Product Line Nomenclature',
      status: 'active',
      complianceScore: '97.2%',
      ruleCount: 9,
      lastAudit: '3 days ago',
      description: 'Enforces registered symbol placement on first markdown header and forbids verbification or pluralization of protected marks.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Distinct Governance & Policy Assurance Mission */}
      <div className="bg-[#111827] border border-[#253047] rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#6366F1]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30">
                GOVERNANCE & POLICY ASSURANCE
              </span>
              <span className="text-xs text-[#64748B] font-mono">Screen 4 • Spec §6</span>
            </div>
            <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
              Governance Hub & Policy Assurance Center
            </h1>
            <p className="text-sm text-[#94A3B8] max-w-2xl mt-1">
              Command center for policy change dependency tracking, automated cascading re-audits, cryptographic approval verification, and multi-agent audit pipeline telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Fingerprint className="w-4 h-4 text-[#10B981]" />}
              onClick={() => setActiveTab('verifier')}
            >
              Verify Approval Hash
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => setActiveTab('re_review')}
            >
              Inspect Re-Review Matrix
            </Button>
          </div>
        </div>

        {/* Unique Governance Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#253047]">
          <div>
            <div className="text-xs text-[#94A3B8]">Policy Invalidation Triggers</div>
            <div className="text-xl font-bold font-mono text-[#F59E0B] mt-0.5">
              {pendingReAudits}
              <span className="text-xs text-[#94A3B8] font-normal ml-1">pending re-audit</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-[#94A3B8]">Synchronized Re-Audits</div>
            <div className="text-xl font-bold font-mono text-[#10B981] mt-0.5">
              {reAuditedCount}
              <span className="text-xs text-[#64748B] font-normal ml-1">assets verified</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-[#94A3B8]">Approval Hash Non-Repudiation</div>
            <div className="text-xl font-bold font-mono text-[#10B981] mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>HMAC-SHA256</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-[#94A3B8]">Audit Engine Telemetry</div>
            <div className="text-xl font-bold font-mono text-[#818CF8] mt-0.5">
              6 Modules
              <span className="text-xs text-[#10B981] font-normal ml-1">100% uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Re-Audit Notification Flash */}
      {reAuditSuccessMessage && (
        <div className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-between text-xs text-[#10B981]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reAuditSuccessMessage}</span>
          </div>
          <button
            onClick={() => setReAuditSuccessMessage(null)}
            className="text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Governance Hub Tabs - Unique options that do not replicate the sidebar */}
      <div className="flex items-center gap-2 border-b border-[#253047] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('re_review')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
            activeTab === 're_review'
              ? 'border-[#F59E0B] text-[#F8FAFC] bg-[#111827]'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]/40'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Policy Dependencies & Cascading Re-Review</span>
          {pendingReAudits > 0 && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
              {pendingReAudits}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('verifier')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'verifier'
              ? 'border-[#10B981] text-[#F8FAFC] bg-[#111827]'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]/40'
          }`}
        >
          <Fingerprint className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Approval Cryptographic Verifier (RFC 2104)</span>
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'agents'
              ? 'border-[#818CF8] text-[#F8FAFC] bg-[#111827]'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#818CF8]" />
          <span>Specialist Multi-Agent Pipeline Telemetry</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161E2E] text-[#94A3B8]">
            {modules.length} Modules
          </span>
        </button>

        <button
          onClick={() => setActiveTab('frameworks')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors border-b-2 cursor-pointer shrink-0 ${
            activeTab === 'frameworks'
              ? 'border-[#6366F1] text-[#F8FAFC] bg-[#111827]'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]/40'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>Statutory & Regulatory Frameworks</span>
        </button>
      </div>

      {/* TAB 1: POLICY DEPENDENCIES & RE-REVIEW QUEUE */}
      {activeTab === 're_review' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <span>Policy Invalidation & Cascading Re-Review Matrix</span>
                <span className="font-mono text-xs text-[#64748B] font-normal">(API §6: GET /assets/review-required)</span>
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                When brand guidelines are ratified, superseded, or modified, dependent content is automatically flagged to prevent stale or unverified marketing assertions.
              </p>
            </div>

            {/* Filter Search Input - Perfectly Vertically Centered */}
            <div className="relative w-full sm:w-72 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Filter by asset or trigger policy..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-lg bg-[#111827] border border-[#253047] pl-9 pr-8 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredReReviewList.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#64748B] bg-[#111827] border border-[#253047] rounded-xl">
                No policy-triggered re-reviews match "{searchQuery}".
              </div>
            ) : (
              filteredReReviewList.map(item => {
                const isPending = item.status === 'pending_re_audit';
                const isLoading = loadingReAuditId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isPending
                        ? 'bg-[#111827] border-[#F59E0B]/40 shadow-sm'
                        : 'bg-[#111827]/60 border-[#253047]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#F8FAFC]">
                            {item.assetTitle}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#161E2E] text-[#94A3B8] rounded border border-[#253047]">
                            v{item.versionNumber}
                          </span>
                          <span className="text-xs text-[#64748B]">•</span>
                          <span className="text-xs text-[#94A3B8]">{item.channel}</span>
                          <Badge
                            variant={
                              item.urgency === 'critical'
                                ? 'breach'
                                : item.urgency === 'high'
                                ? 'warning'
                                : 'info'
                            }
                            size="sm"
                          >
                            {item.urgency.toUpperCase()}
                          </Badge>
                          <Badge
                            variant={
                              item.status === 're_audited'
                                ? 'compliant'
                                : item.status === 'exempted'
                                ? 'neutral'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {item.status === 're_audited'
                              ? 'RE-AUDITED'
                              : item.status === 'exempted'
                              ? 'EXEMPTED'
                              : 'REVIEW REQUIRED'}
                          </Badge>
                        </div>

                        {/* Policy Delta Details */}
                        <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#253047] space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#64748B]">Updated Authority:</span>
                            <span className="font-semibold text-[#818CF8]">{item.dependentSourceTitle}</span>
                            <span className="font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.2 rounded border border-[#F59E0B]/30">
                              {item.sourceVersionDelta}
                            </span>
                          </div>
                          <p className="text-[#94A3B8] leading-relaxed">
                            <span className="text-[#EF4444] font-medium">Trigger: </span>
                            {item.triggerReason}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-[#64748B]">
                          <span>Author: <span className="text-[#94A3B8]">{item.creatorName}</span></span>
                          <span>Flagged: <span className="text-[#94A3B8]">{item.flaggedDate}</span></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        {isPending ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={
                                <RefreshCw
                                  className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                                />
                              }
                              onClick={() => handleTriggerReAudit(item)}
                              disabled={isLoading}
                              className="h-9 px-3.5"
                            >
                              {isLoading ? 'Re-Auditing...' : 'Run Automated Re-Audit'}
                            </Button>

                            {onSelectAsset && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onSelectAsset(item.assetId)}
                                className="h-9 px-3"
                              >
                                Inspect Asset
                              </Button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-[#10B981] font-mono py-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Re-Audit Synchronized</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: APPROVAL INTEGRITY & HMAC VERIFIER */}
      {activeTab === 'verifier' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Input Approval ID */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#111827] border border-[#253047] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-[#10B981]" />
                <h2 className="text-sm font-bold text-[#F8FAFC]">
                  Cryptographic Non-Repudiation Studio
                </h2>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Submit an approval token to mathematically prove that the sign-off was not tampered with, the reviewer held authorized credentials, and Rule 6 separation of duties was maintained.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#94A3B8]">
                  Approval Identifier (UUID or Token)
                </label>
                <input
                  type="text"
                  value={verificationInputId}
                  onChange={e => setVerificationInputId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-[#0B0F19] border border-[#253047] font-mono text-xs text-[#F8FAFC] focus:outline-none focus:border-[#10B981] transition-colors"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Shield className="w-3.5 h-3.5" />}
                  onClick={handleRunVerification}
                  disabled={isVerifying}
                  className="h-9 px-4 w-full"
                >
                  {isVerifying ? 'Computing Hashes...' : 'Execute POST /approvals/{id}/verify'}
                </Button>
              </div>

              <div className="pt-4 border-t border-[#253047] text-[11px] text-[#64748B] space-y-1.5">
                <div className="font-mono text-[#818CF8]">Sample Test Tokens:</div>
                <div
                  onClick={() => setVerificationInputId('appr-sec-9941a8')}
                  className="font-mono hover:text-[#F8FAFC] cursor-pointer p-1.5 rounded hover:bg-[#161E2E] transition-colors"
                >
                  • appr-sec-9941a8 (Signed by Sarah Chen, Lead Steward)
                </div>
                <div
                  onClick={() => setVerificationInputId('appr-fin-3401x2')}
                  className="font-mono hover:text-[#F8FAFC] cursor-pointer p-1.5 rounded hover:bg-[#161E2E] transition-colors"
                >
                  • appr-fin-3401x2 (FinTech Cloud Case Study Sign-off)
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Verification Proof & Certificate */}
          <div className="lg:col-span-7">
            {verificationResult ? (
              <div className="bg-[#111827] border border-[#253047] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-[#253047]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981]">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                        <span>Approval Cryptographically Valid</span>
                        <Badge variant="compliant" size="sm">
                          TAMPER-FREE
                        </Badge>
                      </div>
                      <div className="text-xs text-[#64748B] font-mono mt-0.5">
                        Ledger Block #{verificationResult.immutableLedgerBlock} • RFC 2104 • SHA-256
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Ledger Evidence Grid */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#253047] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#64748B]">Canonical Asset SHA-256 Digest</span>
                    <div className="font-mono text-xs text-[#818CF8] break-all">
                      {verificationResult.canonicalHash}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#253047] space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#64748B]">Reviewer HMAC-SHA256 Signature</span>
                    <div className="font-mono text-xs text-[#10B981] break-all">
                      {verificationResult.hmacSignature}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#253047]">
                      <span className="text-[#64748B] block text-[10px] uppercase font-mono">Signatory</span>
                      <span className="font-semibold text-[#F8FAFC]">{verificationResult.reviewer.name}</span>
                      <div className="text-[11px] text-[#94A3B8]">{verificationResult.reviewer.title}</div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0B0F19] border border-[#253047]">
                      <span className="text-[#64748B] block text-[10px] uppercase font-mono">Policy Binding</span>
                      <span className="font-semibold text-[#F8FAFC]">Version Locked</span>
                      <div className="text-[11px] text-[#94A3B8]">{verificationResult.policyVersionBound}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#94A3B8] pt-2">
                  <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Rule 6 Compliance: Reviewer identity verified independent from creator Alex Rivera.</span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#64748B] border border-dashed border-[#253047] rounded-xl">
                Enter an approval token to verify cryptographic signature.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SPECIALIST AUDIT MODULES (Agents.md §3) */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC]">
                Specialist Audit Pipeline Telemetry (Agents.md §3)
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Deterministic and semantic audit modules orchestrated in pipeline sequence with zero conversational latency or bloat.
              </p>
            </div>
            <span className="text-xs font-mono text-[#10B981] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              All 6 Modules Operational
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, idx) => (
              <div
                key={mod.id}
                className="p-4 rounded-xl bg-[#111827] border border-[#253047] hover:border-[#3B4866] transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold text-[#6366F1]">
                        0{idx + 1}.
                      </span>
                      <h3 className="text-xs font-bold text-[#F8FAFC]">{mod.name}</h3>
                    </div>
                    <div className="text-[11px] text-[#94A3B8] mt-0.5">{mod.role}</div>
                  </div>
                  <Badge variant="compliant" size="sm">
                    {mod.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0B0F19] border border-[#253047] space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-[#64748B]">Input: </span>
                    <span className="text-[#94A3B8]">{mod.inputDescription}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Output: </span>
                    <span className="text-[#818CF8]">{mod.outputDescription}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono border-t border-[#253047]">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Latency</span>
                    <span className="text-[#F8FAFC]">{mod.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Precision</span>
                    <span className="text-[#10B981]">{mod.metrics.precision}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STATUTORY & REGULATORY FRAMEWORKS */}
      {activeTab === 'frameworks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC]">
                Statutory & Cross-Jurisdictional Regulatory Frameworks
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Active statutory requirements mapped directly to deterministic brand rule checks for enterprise legal compliance.
              </p>
            </div>
            <span className="text-xs font-mono text-[#818CF8]">
              5 Global Jurisdictions Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regulatoryFrameworks.map(reg => (
              <div
                key={reg.id}
                className="p-5 rounded-xl bg-[#111827] border border-[#253047] hover:border-[#3B4866] transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#F8FAFC]">{reg.name}</h3>
                    <div className="text-xs text-[#818CF8] font-mono mt-0.5">{reg.authority}</div>
                  </div>
                  <Badge variant="compliant" size="sm">
                    {reg.complianceScore} COMPLIANT
                  </Badge>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {reg.description}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#253047] text-[11px] font-mono">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Scope</span>
                    <span className="text-[#F8FAFC] truncate block">{reg.scope}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Active Rules</span>
                    <span className="text-[#10B981]">{reg.ruleCount} checks</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Last Audit</span>
                    <span className="text-[#94A3B8]">{reg.lastAudit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
