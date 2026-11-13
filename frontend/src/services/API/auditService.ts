/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, AuditFinding, BrandSource, ComplianceStatus, EvidenceReference } from '../../types';
import { MOCK_FINDINGS } from './mockData';
import { sourcesService } from './sourcesService';
import { ApiError, apiFetch } from './client';
import { assetsService } from './assetsService';

const inMemoryFindings: Record<string, AuditFinding[]> = { ...MOCK_FINDINGS };

export type AuditDataSource = 'api' | 'local' | 'unavailable';

export interface AuditSummary {
  total_findings: number;
  breaches: number;
  warnings: number;
  compliant_checks: number;
  engine_version: string;
  audit_date: string;
}

export interface AuditResult {
  status: ComplianceStatus;
  findings: AuditFinding[];
  summary: AuditSummary;
  source: AuditDataSource;
  serverOutcome: 'confirmed' | 'unknown';
}

interface ApiAuditResult {
  status: ComplianceStatus;
  findings: AuditFinding[];
  summary: AuditSummary;
}

function isApiAuditResult(value: unknown, versionId: string): value is ApiAuditResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<ApiAuditResult>;
  const summary = result.summary;
  const statuses: ComplianceStatus[] = [
    'draft',
    'in_review',
    'approved',
    'rejected',
    'review_required',
    'breach',
    'failed',
    'unavailable',
    'deprecated',
  ];
  return typeof result.status === 'string'
    && statuses.includes(result.status as ComplianceStatus)
    && Array.isArray(result.findings)
    && result.findings.every(finding => {
      if (!finding || typeof finding !== 'object') return false;
      const item = finding as Partial<AuditFinding>;
      return typeof item.id === 'string'
        && typeof item.version_id === 'string'
        && item.version_id === versionId
        && (item.severity === 'breach'
          || item.severity === 'warning'
          || item.severity === 'compliant'
          || item.severity === 'unverified')
        && typeof item.title === 'string'
        && typeof item.category === 'string'
        && typeof item.description === 'string'
        && typeof item.flagged_text === 'string'
        && typeof item.suggested_replacement === 'string'
        && !!item.evidence
        && typeof item.evidence.source_id === 'string'
        && typeof item.evidence.source_title === 'string'
        && typeof item.evidence.source_version === 'string'
        && typeof item.evidence.passage_id === 'string';
    })
    && !!summary
    && Number.isFinite(summary.total_findings)
    && Number.isFinite(summary.breaches)
    && Number.isFinite(summary.warnings)
    && Number.isFinite(summary.compliant_checks)
    && typeof summary.engine_version === 'string'
    && typeof summary.audit_date === 'string';
}

function attachAuditResult(
  asset: Asset,
  versionId: string,
  result: ApiAuditResult,
  source: AuditDataSource,
  serverOutcome: AuditResult['serverOutcome']
): void {
  const version = asset.versions.find(item => item.version_id === versionId);
  if (!version) throw new Error('The audited version is not available in the submission.');

  version.audit_status = result.status;
  version.audit_source = source;
  version.audit_server_outcome = serverOutcome;
  version.audit_summary = result.summary;
  if (asset.current_version_id === versionId) asset.current_status = result.status;
  inMemoryFindings[versionId] = result.findings;
  assetsService.updateLocalSnapshot(asset);
}

function evidenceForSource(
  source: BrandSource | undefined,
  ruleType: BrandSource['versions'][number]['passages'][number]['rule_type']
): EvidenceReference | undefined {
  if (!source) return undefined;
  const version = source.versions.find(item => item.version_tag === source.current_version)
    ?? source.versions[0];
  const passage = version?.passages.find(item => item.rule_type === ruleType);
  if (!version || !passage) return undefined;

  return {
    source_id: source.id,
    source_title: source.title,
    source_version: version.version_tag,
    passage_id: passage.id,
    section: passage.section,
    excerpt: passage.text,
    match_confidence: 1,
  };
}

async function runLocalAudit(asset: Asset, versionId: string): Promise<AuditResult> {
  const version = asset.versions.find(item => item.version_id === versionId);
  if (!version) throw new Error('The submission version is unavailable for a local check.');
  const content = version.content;
  const allActiveSources = await sourcesService.getSources();
  const generatedFindings: AuditFinding[] = [];
  let checksRun = 0;

  // 1. Trademark checks
  const tmSource = allActiveSources.find(source => source.category === 'trademark');
  const tmEvidence = evidenceForSource(tmSource, 'trademark_syntax');
  if (tmEvidence) checksRun += 1;
  const trademarkMatch = content.match(/sentinelmesh\b/i);
  if (/sentinelmesh\b/i.test(content)
    && !content.includes('SentinelMesh™')
    && !content.includes('SentinelMesh')
    && tmEvidence) {
    generatedFindings.push({
      id: `fnd-tm-${Date.now().toString(36)}`,
      version_id: versionId,
      category: 'Trademark & Brand Mark',
      severity: 'breach',
      title: 'Incorrect Brand Mark Syntax',
      description: 'SentinelMesh must use proper CamelCase and the ™ symbol on prominent first appearance.',
      flagged_text: trademarkMatch?.[0] ?? 'SentinelMesh',
      suggested_replacement: 'SentinelMesh™',
      evidence: tmEvidence,
      status: 'open',
    });
  }

  // 2. Banned Superlatives (Tone of voice)
  const toneSource = allActiveSources.find(source => source.category === 'tone_voice');
  const toneEvidence = evidenceForSource(toneSource, 'prohibited_phrase');
  const hypeTerms = ['revolutionary', 'game-changing', 'miraculous', 'unprecedented'];
  for (const term of hypeTerms) {
    if (toneEvidence) checksRun += 1;
    const matchedTerm = content.match(new RegExp(term, 'i'))?.[0];
    if (matchedTerm && toneEvidence) {
      generatedFindings.push({
        id: `fnd-tone-${term}-${Date.now().toString(36)}`,
        version_id: versionId,
        category: 'Brand Tone & Voice',
        severity: 'warning',
        title: `Banned Superlative Term: "${term}"`,
        description: `Enterprise editorial standards prohibit subjective hype terms like "${term}".`,
        flagged_text: matchedTerm,
        suggested_replacement: 'authoritative and verified',
        evidence: toneEvidence,
        status: 'open',
      });
    }
  }

  // 3. Absolute Security claims
  const secSource = allActiveSources.find(source => source.category === 'security');
  const securityEvidence = evidenceForSource(secSource, 'prohibited_phrase');
  if (securityEvidence) checksRun += 1;
  const securityMatch = content.match(/100%\s*(unhackable|invulnerable|secure)|bulletproof/i);
  if (securityMatch && securityEvidence) {
    generatedFindings.push({
      id: `fnd-sec-${Date.now().toString(36)}`,
      version_id: versionId,
      category: 'Security & Compliance',
      severity: 'breach',
      title: 'Forbidden Absolute Security Assertion',
      description: 'Claims of 100% invulnerability violate CISO compliance policies.',
      flagged_text: securityMatch[0],
      suggested_replacement: 'defense-in-depth architecture validated under SOC 2 Type II controls',
      evidence: securityEvidence,
      status: 'open',
    });
  }

  // 4. Unsubstantiated ROI
  const legalSource = allActiveSources.find(source => source.category === 'legal');
  const legalEvidence = evidenceForSource(legalSource, 'prohibited_phrase');
  if (legalEvidence) checksRun += 1;
  const roiMatch = content.match(/guaranteed\s*\d+x\s*roi/i);
  if (roiMatch && legalEvidence) {
    generatedFindings.push({
      id: `fnd-roi-${Date.now().toString(36)}`,
      version_id: versionId,
      category: 'Legal & Regulatory',
      severity: 'breach',
      title: 'Unsubstantiated Performance Multiplier',
      description: 'Prohibited from stating guaranteed ROI multipliers without audited third-party study footnote.',
      flagged_text: roiMatch[0],
      suggested_replacement: 'up to 3.8x reduction in governance overhead*',
      evidence: legalEvidence,
      status: 'open',
    });
  }

  // 5. Dynamic scan of all passages in newly created sources
  for (const customSource of allActiveSources) {
    for (const ver of customSource.versions) {
      for (const passage of ver.passages) {
        if (passage.rule_type !== 'prohibited_phrase' || !passage.rule_title) continue;

        const ruleKeyword = passage.rule_title.toLowerCase().replace(/claim|prohibition|rule|forbidden/g, '').trim();
        if (ruleKeyword.length <= 3) continue;
        checksRun += 1;
        if (!content.toLowerCase().includes(ruleKeyword)) continue;

        generatedFindings.push({
          id: `fnd-custom-${passage.id}`,
          version_id: versionId,
          category: customSource.category.toUpperCase(),
          severity: passage.severity || 'warning',
          title: passage.rule_title,
          description: `Content triggers policy rule defined in ${customSource.title}.`,
          flagged_text: ruleKeyword,
          suggested_replacement: 'compliant phrasing adhering to guideline specifications',
          evidence: {
            source_id: customSource.id,
            source_title: customSource.title,
            source_version: customSource.current_version,
            passage_id: passage.id,
            section: passage.section,
            excerpt: passage.text,
            match_confidence: 0.95,
          },
          status: 'open',
        });
      }
    }
  }

  const breaches = generatedFindings.filter(finding => finding.severity === 'breach').length;
  const warnings = generatedFindings.filter(finding => finding.severity === 'warning').length;
  const status: ComplianceStatus = breaches > 0
    ? 'breach'
    : warnings > 0
      ? 'review_required'
      : 'draft';
  const summary: AuditSummary = {
    total_findings: generatedFindings.length,
    breaches,
    warnings,
    compliant_checks: Math.max(0, checksRun - generatedFindings.length),
    engine_version: 'local-rule-check',
    audit_date: new Date().toISOString(),
  };
  const result: ApiAuditResult = { status, findings: generatedFindings, summary };

  attachAuditResult(asset, versionId, result, 'local', 'unknown');
  return { ...result, source: 'local', serverOutcome: 'unknown' };
}

export const auditService = {
  async getFindings(assetId: string, versionId: string): Promise<AuditFinding[]> {
    try {
      const findings = await apiFetch<AuditFinding[]>(`/assets/${assetId}/versions/${versionId}/findings`);
      return findings.filter(finding => finding.version_id === versionId);
    } catch {
      return (inMemoryFindings[versionId] || [])
        .filter(finding => finding.version_id === versionId);
    }
  },

  getAllFindingsSync(): Record<string, AuditFinding[]> {
    return inMemoryFindings;
  },

  /**
   * Run enterprise brand governance audit against all active brand sources.
   * Dynamically loads all active brand sources (including custom registered sources).
   */
  async triggerAudit(
    asset: Asset,
    versionId: string
  ): Promise<AuditResult> {
    if (!asset.versions.some(version => version.version_id === versionId)) {
      throw new Error('The submission version is unavailable for a brand check.');
    }

    try {
      const response = await apiFetch<unknown>(`/assets/${asset.id}/versions/${versionId}/audit`, {
        method: 'POST',
      });
      if (!isApiAuditResult(response, versionId)) {
        return runLocalAudit(asset, versionId);
      }
      if (response.status === 'failed' || response.status === 'unavailable') {
        attachAuditResult(asset, versionId, response, 'unavailable', 'confirmed');
        return { ...response, source: 'unavailable', serverOutcome: 'confirmed' };
      }
      attachAuditResult(asset, versionId, response, 'api', 'confirmed');
      return { ...response, source: 'api', serverOutcome: 'confirmed' };
    } catch (error: unknown) {
      if (error instanceof ApiError && error.outcome === 'unknown') {
        return runLocalAudit(asset, versionId);
      }
      throw error;
    }
  },

  async updateFindingStatus(findingId: string, status: 'open' | 'accepted' | 'dismissed'): Promise<void> {
    for (const list of Object.values(inMemoryFindings)) {
      const match = list.find(f => f.id === findingId);
      if (match) {
        match.status = status;
        break;
      }
    }
  },
};
