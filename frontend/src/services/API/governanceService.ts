/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, User } from '../../types';
import { MOCK_ASSETS } from './mockData';

export interface ReviewRequiredItem {
  id: string;
  assetId: string;
  assetTitle: string;
  versionNumber: number;
  channel: string;
  creatorName: string;
  currentStatus: string;
  dependentSourceId: string;
  dependentSourceTitle: string;
  sourceVersionDelta: string; // e.g. "v1.2 → v2.0"
  triggerReason: string;
  urgency: 'critical' | 'high' | 'medium';
  flaggedDate: string;
  status: 'pending_re_audit' | 're_audited' | 'exempted';
  exemptionNotes?: string;
}

export interface ApprovalVerificationResult {
  valid: boolean;
  approvalId: string;
  assetId: string;
  assetTitle: string;
  versionNumber: number;
  reviewer: {
    id: string;
    name: string;
    role: string;
    title: string;
  };
  decision: 'approved' | 'rejected' | 'revision_requested';
  signedTimestamp: string;
  canonicalHash: string;
  hmacSignature: string;
  algorithm: 'HMAC-SHA256-RFC2104';
  tamperDetected: boolean;
  immutableLedgerBlock: number;
  auditEvidenceCount: number;
  policyVersionBound: string;
}

export interface SpecialistModuleStatus {
  id: string;
  name: string;
  role: string;
  status: 'operational' | 'degraded' | 'maintenance';
  latencyMs: number;
  metrics: {
    throughput: string;
    precision: string;
    mode: string;
  };
  inputDescription: string;
  outputDescription: string;
}

const INITIAL_REVIEW_REQUIRED: ReviewRequiredItem[] = [
  {
    id: 'req-01',
    assetId: 'asset-sentinel-launch',
    assetTitle: 'Q4 Enterprise SentinelMesh Launch & Technical Whitepaper',
    versionNumber: 1,
    channel: 'Website / Product Landing',
    creatorName: 'Rohit Sharma',
    currentStatus: 'review_required',
    dependentSourceId: 'src-tone-01',
    dependentSourceTitle: 'Brand Voice & Tone Standard (Enterprise B2B)',
    sourceVersionDelta: 'v2.3 → v2.4 (Ratified)',
    triggerReason: 'Brand Stewardship Committee updated Section 4.1 prohibiting unverified 10x ROI superlatives without third-party benchmark attestation.',
    urgency: 'critical',
    flaggedDate: '2 hours ago',
    status: 'pending_re_audit',
  },
  {
    id: 'req-02',
    assetId: 'asset-case-study',
    assetTitle: 'FinTech Cloud Migration Case Study: Zero-Downtime Cutover',
    versionNumber: 2,
    channel: 'Marketing / Whitepaper',
    creatorName: 'Arjun Patel',
    currentStatus: 'review_required',
    dependentSourceId: 'src-legal-01',
    dependentSourceTitle: 'Global Statutory Disclaimers & Regulatory Claims',
    sourceVersionDelta: 'v3.0 → v3.1 (Effective Now)',
    triggerReason: 'Statutory compliance standard amended to require jurisdictional GDPR and EU AI Act conformity clauses in case studies referencing machine intelligence.',
    urgency: 'high',
    flaggedDate: '5 hours ago',
    status: 'pending_re_audit',
  },
  {
    id: 'req-03',
    assetId: 'asset-email-nurture',
    assetTitle: 'Enterprise Security Executive Nurture Sequence (CISO Persona)',
    versionNumber: 1,
    channel: 'Email / Outbound Sales',
    creatorName: 'Ananya Mehta',
    currentStatus: 'review_required',
    dependentSourceId: 'src-trademark-01',
    dependentSourceTitle: 'Trademark & Product Nomenclature Guidelines',
    sourceVersionDelta: 'v1.4 → v2.0 (Ratified)',
    triggerReason: 'Product naming convention changed from SentinelMesh™ to SentinelMesh Core™ with mandatory registered symbol on first markdown header.',
    urgency: 'medium',
    flaggedDate: 'Yesterday',
    status: 'pending_re_audit',
  },
];

let inMemoryReviewRequired = [...INITIAL_REVIEW_REQUIRED];

export const governanceService = {
  /**
   * Fetch assets requiring re-review (API Section 6: GET /assets/review-required)
   */
  async getReviewRequiredAssets(): Promise<ReviewRequiredItem[]> {
    return [...inMemoryReviewRequired];
  },

  /**
   * Trigger immediate automated re-audit for a flagged asset
   */
  async triggerReAudit(requirementId: string): Promise<{ success: boolean; message: string }> {
    const item = inMemoryReviewRequired.find(r => r.id === requirementId);
    if (!item) throw new Error('Requirement record not found');
    item.status = 're_audited';
    return {
      success: true,
      message: `Re-audit pipeline executed against updated policy "${item.dependentSourceTitle}". Findings refreshed.`,
    };
  },

  /**
   * Exempt an asset from re-audit with formal audit justification
   */
  async exemptAsset(requirementId: string, notes: string): Promise<{ success: boolean }> {
    const item = inMemoryReviewRequired.find(r => r.id === requirementId);
    if (!item) throw new Error('Requirement record not found');
    item.status = 'exempted';
    item.exemptionNotes = notes;
    return { success: true };
  },

  /**
   * Verify cryptographic approval integrity (API Section 6: POST /approvals/{approval_id}/verify)
   */
  async verifyApprovalIntegrity(approvalId: string): Promise<ApprovalVerificationResult> {
    // Simulated cryptographic HMAC-SHA256 signature and block ledger check
    return {
      valid: true,
      approvalId: approvalId || 'appr-sec-9941a8',
      assetId: 'asset-sentinel-launch',
      assetTitle: 'Q4 Enterprise SentinelMesh Launch & Technical Whitepaper',
      versionNumber: 2,
      reviewer: {
        id: 'user-rev-1',
        name: 'Ananya Mehta',
        role: 'reviewer',
        title: 'Reviewer',
      },
      decision: 'approved',
      signedTimestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      canonicalHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      hmacSignature: '8f7a932c0b48e1d52a17f69c3e21094ba8f95c0213d4e8b7c61093a854ef129a',
      algorithm: 'HMAC-SHA256-RFC2104',
      tamperDetected: false,
      immutableLedgerBlock: 489211,
      auditEvidenceCount: 3,
      policyVersionBound: 'Brand Tone Standard v2.4 & Legal Policy v3.1',
    };
  },

  /**
   * Specialist modules design definition & status (from Agents.md)
   */
  getSpecialistModules(): SpecialistModuleStatus[] {
    return [
      {
        id: 'mod-claims',
        name: 'Claim Extraction Specialist',
        role: 'Span & Metric Parser',
        status: 'operational',
        latencyMs: 142,
        metrics: {
          throughput: '124 req/min',
          precision: '99.4%',
          mode: 'Deterministic + AST Spans',
        },
        inputDescription: 'Submitted copy text & structured metadata',
        outputDescription: 'Preserved span offsets for prices, performance, superlatives & statistics',
      },
      {
        id: 'mod-retrieval',
        name: 'Evidence Retrieval Engine',
        role: 'Semantic Vector Matcher',
        status: 'operational',
        latencyMs: 88,
        metrics: {
          throughput: '310 query/min',
          precision: '98.7% recall',
          mode: 'Tenant-Filtered Vector Index',
        },
        inputDescription: 'Extracted candidate claims & active brand profile filters',
        outputDescription: 'Ranked approved source passages with source IDs and version bindings',
      },
      {
        id: 'mod-assessment',
        name: 'Fact & Claim Assessment',
        role: 'Evidence Backing Verifier',
        status: 'operational',
        latencyMs: 210,
        metrics: {
          throughput: '89 eval/min',
          precision: '100% deterministic',
          mode: '6 Structured Verdict States',
        },
        inputDescription: 'Paired claim spans and retrieved source policy text',
        outputDescription: 'SUPPORTED, UNSUPPORTED, CONTRADICTED, OUTDATED, AMBIGUOUS_RULE',
      },
      {
        id: 'mod-tone',
        name: 'Tone & Terminology Scanner',
        role: 'Lexicon & Style Enforcer',
        status: 'operational',
        latencyMs: 45,
        metrics: {
          throughput: '450 req/min',
          precision: '1,420 Active Terms',
          mode: 'Exact Match & Syntax Regex',
        },
        inputDescription: 'Token stream against prohibited superlatives and trademark syntax',
        outputDescription: 'Terminology warnings, unauthorized comparative claims & style drifts',
      },
      {
        id: 'mod-suggestions',
        name: 'Suggestion Engine',
        role: 'Intent-Preserving Correction',
        status: 'operational',
        latencyMs: 310,
        metrics: {
          throughput: '75 diffs/min',
          precision: '97.8% acceptance',
          mode: 'Constrained Substitution',
        },
        inputDescription: 'Flagged breach spans and authoritative source rule requirement',
        outputDescription: 'Minimal compliant replacement with zero invented claims or numbers',
      },
      {
        id: 'mod-citations',
        name: 'Citation Validation Authority',
        role: 'Audit Integrity Gatekeeper',
        status: 'operational',
        latencyMs: 62,
        metrics: {
          throughput: '180 checks/min',
          precision: '100% verified',
          mode: 'Multi-Tenant Cryptographic Check',
        },
        inputDescription: 'Candidate findings before final persistence',
        outputDescription: 'Validated findings or UNVERIFIED downgrade if source is not active',
      },
    ];
  },
};
