
import {
  Asset,
  AuditFinding,
  ComplianceStatus,
  EvidenceReference,
} from '../../types';
import { ApiError, apiFetch } from './client';
import { assetsService } from './assetsService';

export type AuditDataSource = 'api' | 'unavailable';

export type BackendAuditStatus =
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'REVIEW_REQUIRED'
  | 'UNAVAILABLE'
  | 'FAILED_UNAVAILABLE';

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
  serverOutcome: 'confirmed' | 'unknown' | 'rejected';
  backendStatus: BackendAuditStatus;
  backendSummary: string;
  validation?: Record<string, unknown>;
}

interface BackendEvidenceReference {
  source_version_id: string;
  passage_id: string;
}

interface BackendEvidenceUsed extends BackendEvidenceReference {
  text: string;
}

interface BackendFinding {
  category: string;
  severity: string;
  span: {
    start: number;
    end: number;
    text: string;
  };
  explanation: string;
  evidence: BackendEvidenceReference[];
  suggested_action: string;
  suggested_replacement: string | null;
  validation_status?: 'VERIFIED' | 'UNVERIFIED';
  semantic_assessment?: string;
  semantic_explanation?: string;
}

interface BackendAuditData {
  status: BackendAuditStatus;
  summary: string;
  findings: BackendFinding[];
  evidence_used?: BackendEvidenceUsed[];
  validation?: Record<string, unknown>;
  model_name?: string;
  prompt_version?: string;
}

interface BackendAuditResponse {
  data: BackendAuditData;
  error: string | null;
}

const inMemoryFindings: Record<string, AuditFinding[]> = {};

function mapBackendStatus(status: BackendAuditStatus): ComplianceStatus {
  switch (status) {
    case 'COMPLIANT':
      return 'compliant';
    case 'NON_COMPLIANT':
      return 'breach';
    case 'REVIEW_REQUIRED':
      return 'review_required';
    case 'UNAVAILABLE':
      return 'unavailable';
    case 'FAILED_UNAVAILABLE':
      return 'failed';
  }
}

function mapSeverity(finding: BackendFinding): AuditFinding['severity'] {
  if (finding.validation_status === 'UNVERIFIED') {
    return 'unverified';
  }

  if (finding.category === 'SUPPORTED') {
    return 'compliant';
  }

  if (finding.severity === 'HIGH' || finding.severity === 'CRITICAL') {
    return 'breach';
  }

  return 'warning';
}

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    SUPPORTED: 'Supported Claim',
    UNSUPPORTED: 'Unsupported Claim',
    CONTRADICTED: 'Contradicted Claim',
    OUTDATED: 'Outdated Information',
    AMBIGUOUS_RULE: 'Ambiguous Brand Rule',
    REVIEW_UNAVAILABLE: 'Review Unavailable',
  };

  return labels[category] ?? category.replaceAll('_', ' ');
}

function mapEvidence(
  reference: BackendEvidenceReference,
  evidenceUsed: BackendEvidenceUsed[]
): EvidenceReference | undefined {
  const matched = evidenceUsed.find(
    item =>
      item.source_version_id === reference.source_version_id
      && item.passage_id === reference.passage_id
  );

  if (!matched) return undefined;

  return {
    source_version_id: reference.source_version_id,
    passage_id: reference.passage_id,
    excerpt: matched.text,
  };
}

function mapFinding(
  finding: BackendFinding,
  index: number,
  versionId: string,
  evidenceUsed: BackendEvidenceUsed[]
): AuditFinding {
  const evidenceReferences = finding.evidence ?? [];

  const mappedEvidence = evidenceReferences
    .map(reference => mapEvidence(reference, evidenceUsed))
    .filter((item): item is EvidenceReference => item !== undefined);

  const description = [
    finding.explanation,
    finding.suggested_action
      ? `Suggested action: ${finding.suggested_action}`
      : '',
    finding.semantic_explanation ?? '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    id: `audit-${versionId}-${index}`,
    version_id: versionId,
    category: finding.category,
    severity: mapSeverity(finding),
    title: categoryLabel(finding.category),
    description,
    flagged_text: finding.span.text,
    suggested_replacement: finding.suggested_replacement ?? '',
    suggested_action: finding.suggested_action,
    evidence: mappedEvidence[0],
    evidence_references: evidenceReferences,
    status: 'open',
    validation_status: finding.validation_status,
  };
}

function mapAuditResponse(
  response: BackendAuditResponse,
  versionId: string
): AuditResult {
  if (response.error) {
    throw new Error(response.error);
  }

  const data = response.data;

  if (
    !data
    || !Array.isArray(data.findings)
    || typeof data.summary !== 'string'
  ) {
    throw new Error('The backend returned an invalid audit response.');
  }

  const evidenceUsed = data.evidence_used ?? [];

  const findings = data.findings.map((finding, index) =>
    mapFinding(finding, index, versionId, evidenceUsed)
  );

  const breaches = findings.filter(
    finding => finding.severity === 'breach'
  ).length;

  const warnings = findings.filter(
    finding => finding.severity === 'warning'
  ).length;

  const compliantChecks = findings.filter(
    finding => finding.severity === 'compliant'
  ).length;

  const status = mapBackendStatus(data.status);
  const isAvailable = [
    'COMPLIANT',
    'NON_COMPLIANT',
    'REVIEW_REQUIRED',
  ].includes(data.status);

  return {
    status,
    findings,
    summary: {
      total_findings: findings.length,
      breaches,
      warnings,
      compliant_checks: compliantChecks,
      engine_version: [
        data.model_name,
        data.prompt_version,
      ].filter(Boolean).join(' / ') || 'Not provided by backend',
      audit_date: new Date().toISOString(),
    },
    source: isAvailable ? 'api' : 'unavailable',
    serverOutcome: isAvailable ? 'confirmed' : 'rejected',
    backendStatus: data.status,
    backendSummary: data.summary,
    validation: data.validation,
  };
}

function attachAuditResult(
  asset: Asset,
  versionId: string,
  result: AuditResult
): void {
  const version = asset.versions.find(
    item => item.version_id === versionId
  );

  if (!version) {
    throw new Error('The audited version is not available in the submission.');
  }

  version.audit_status = result.status;
  version.audit_source = result.source;
  version.audit_server_outcome = result.serverOutcome;
  version.audit_summary = result.summary;

  asset.current_status = result.status;

  inMemoryFindings[versionId] = result.findings;
  assetsService.updateLocalSnapshot(asset);
}

export const auditService = {
  async getFindings(
    _assetId: string,
    versionId: string
  ): Promise<AuditFinding[]> {
    // The current backend does not expose a findings retrieval endpoint.
    return inMemoryFindings[versionId] ?? [];
  },

  getAllFindingsSync(): Record<string, AuditFinding[]> {
    return inMemoryFindings;
  },

  async triggerAudit(
    asset: Asset,
    versionId: string
  ): Promise<AuditResult> {
    if (!asset.versions.some(
      version => version.version_id === versionId
    )) {
      throw new Error(
        'The submission version is unavailable for a brand check.'
      );
    }

    try {
      const response = await apiFetch<BackendAuditResponse>(
        `/assets/${asset.id}/versions/${versionId}/audit`,
        { method: 'POST' }
      );

      const result = mapAuditResponse(response, versionId);

      attachAuditResult(asset, versionId, result);

      return result;
    } catch (error: unknown) {
      if (
        error instanceof ApiError
        && error.outcome === 'unknown'
      ) {
        throw new Error(
          'The audit request outcome is unknown. Please refresh and check before retrying.'
        );
      }

      throw error;
    }
  },

  async updateFindingStatus(
    findingId: string,
    status: 'open' | 'accepted' | 'dismissed'
  ): Promise<void> {
    for (const list of Object.values(inMemoryFindings)) {
      const match = list.find(finding => finding.id === findingId);

      if (match) {
        match.status = status;
        break;
      }
    }
  },
};
