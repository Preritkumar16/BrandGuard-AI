/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  History,
  Play,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  CheckCircle2,
  Lock,
  Check,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Asset, AssetVersion, AuditFinding, EvidenceReference, User } from '../../types';
import { roleLabel } from '../../config/roles';
import { can, PERMISSION_MATRIX } from '../../config/permissions';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Card, CardBody, CardHeader } from '../UI/Card';
import { Tabs } from '../UI/Tabs';
import { InspectionDiffBox } from '../audit/InspectionDiffBox';
import { AuditFindingsList } from '../audit/AuditFindingsList';
import { EvidenceDrawer } from '../audit/EvidenceDrawer';
import { DecisionModal } from '../reviews/DecisionModal';
import { auditService } from '../../services/API/auditService';
import { assetsService, canCreatorOpenAssetDetails } from '../../services/API/assetsService';
import { ApiError } from '../../services/API/client';
import { reviewsService } from '../../services/API/reviewsService';
import { AuditAttemptState, getAuditPresentation } from '../audit/auditPresentation';
import { applyUniqueSuggestions } from '../audit/textReplacements';

function matrixAccessFor(capability: string, role: User['role']) {
  return PERMISSION_MATRIX.find(row => row.capability === capability)?.access[role];
}

function chronologicalVersions(versions: AssetVersion[]): AssetVersion[] {
  return [...new Map(versions.map(version => [version.version_id, version])).values()]
    .sort((a, b) => timestampValue(a.created_at) - timestampValue(b.created_at));
}

function timestampValue(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatTimestamp(value: string): string {
  const timestamp = timestampValue(value);
  return timestamp ? new Date(timestamp).toLocaleString() : 'Date unavailable';
}

interface AssetDetailViewProps {
  assetId: string;
  initialVersionId?: string;
  currentUser: User;
  allowCreatorSubmissionAccess: boolean;
  onBack: () => void;
  onAssetUpdated: (asset: Asset) => void;
  onReviewQueueRefresh: () => Promise<boolean>;
  onViewSource?: (sourceId: string) => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({
  assetId,
  initialVersionId,
  currentUser,
  allowCreatorSubmissionAccess,
  onBack,
  onAssetUpdated,
  onReviewQueueRefresh,
  onViewSource,
}) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetLoadState, setAssetLoadState] = useState<'loading' | 'ready' | 'denied' | 'unavailable'>('loading');
  const assetLoadRequest = useRef(0);
  const findingsLoadRequest = useRef(0);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [auditAttempts, setAuditAttempts] = useState<Record<string, AuditAttemptState>>({});
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'findings' | 'history' | 'editor'>('diff');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'warning' | 'error'>('success');

  // Evidence Drawer state
  const [activeEvidence, setActiveEvidence] = useState<{
    evidence: EvidenceReference;
    ruleTitle: string;
    severity: AuditFinding['severity'];
  } | null>(null);

  // New Revision Editor state
  const [isCreatingRevision, setIsCreatingRevision] = useState(false);
  const [revisionContent, setRevisionContent] = useState('');
  const [revisionChangelog, setRevisionChangelog] = useState('');
  const [isSavingRevision, setIsSavingRevision] = useState(false);

  // Load Asset data
  const loadAsset = async () => {
    const requestId = ++assetLoadRequest.current;
    findingsLoadRequest.current += 1;
    setAssetLoadState('loading');
    const data = await assetsService.getAssetById(assetId);
    if (requestId !== assetLoadRequest.current) return;

    if (!data) {
      setAsset(null);
      setFindings([]);
      setAssetLoadState('unavailable');
      return;
    }

    if (!data.versions.length) {
      setAsset(null);
      setFindings([]);
      setAssetLoadState('unavailable');
      return;
    }

    if (currentUser.role === 'creator'
      && !canCreatorOpenAssetDetails(data, currentUser.id, allowCreatorSubmissionAccess)) {
      setAsset(null);
      setFindings([]);
      setAssetLoadState('denied');
      return;
    }

    const versions = chronologicalVersions(data.versions);
    const requestedVersion = versions.find(version => version.version_id === initialVersionId);
    if (initialVersionId && !requestedVersion) {
      setAsset(null);
      setFindings([]);
      setAssetLoadState('unavailable');
      return;
    }
    setAsset(data);
    const activeVerId = requestedVersion
      ? requestedVersion.version_id
      : versions.some(version => version.version_id === data.current_version_id)
        ? data.current_version_id
        : versions[versions.length - 1].version_id;
    setSelectedVersionId(activeVerId);
    setAssetLoadState('ready');
    loadFindings(data.id, activeVerId);
  };

  const loadFindings = async (aId: string, vId: string) => {
    const requestId = ++findingsLoadRequest.current;
    const list = await auditService.getFindings(aId, vId);
    if (requestId === findingsLoadRequest.current && aId === assetId) {
      setFindings(list.filter(finding => finding.version_id === vId));
    }
  };

  useEffect(() => {
    setAsset(null);
    loadAsset();
    return () => {
      assetLoadRequest.current += 1;
    };
  }, [assetId, initialVersionId, currentUser.id, currentUser.role, allowCreatorSubmissionAccess]);

  useEffect(() => {
    if (asset && selectedVersionId) {
      loadFindings(asset.id, selectedVersionId);
      const curVer = asset.versions.find(v => v.version_id === selectedVersionId);
      if (curVer) {
        setRevisionContent(curVer.content);
      }
      setFindings([]);
    }
  }, [selectedVersionId]);

  if (assetLoadState === 'loading' || (asset && asset.id !== assetId)) {
    return (
      <div className="p-8 text-center text-sm text-[#94A3B8]">
        Loading governance asset record...
      </div>
    );
  }

  if (assetLoadState === 'denied'
    || (currentUser.role === 'creator'
      && (!asset || !canCreatorOpenAssetDetails(asset, currentUser.id, allowCreatorSubmissionAccess)))) {
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-xl border border-[#DCE2E9] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-[#1B2533]">Content unavailable</h1>
        <p className="mt-2 text-sm leading-6 text-[#4B5869]">
          For privacy, Creators can open details only by selecting an owned item in My submissions.
        </p>
        <Button className="mt-5" onClick={onBack}>Back to My submissions</Button>
      </div>
    );
  }

  if (assetLoadState === 'unavailable' || !asset) {
    return (
      <div role="alert" className="p-8 text-center text-sm text-[#4B5869]">
        This asset or its version history is unavailable.
      </div>
    );
  }

  const versions = chronologicalVersions(asset.versions);
  const currentVersion = versions.find(v => v.version_id === selectedVersionId) || versions[versions.length - 1];
  if (!currentVersion) {
    return (
      <div role="alert" className="p-8 text-center text-sm text-[#4B5869]">
        This asset has no available versions.
      </div>
    );
  }
  const currentDecision = currentVersion.review_decision?.version_id === currentVersion.version_id
    ? currentVersion.review_decision
    : undefined;
  const canDraftRevision = can(currentUser, 'draft_revision').allowed
    && matrixAccessFor('Edit content and create a new revision', currentUser.role) === 'full';
  const canRunAudit = can(currentUser, 'run_audit').allowed;
  const canSubmitForReview = can(currentUser, 'submit_asset').allowed
    && matrixAccessFor('Ingest and submit assets', currentUser.role) === 'full';
  const decisionAccess = matrixAccessFor('Approve, reject, or request changes', currentUser.role);
  const assignmentVerificationUnavailable = decisionAccess === 'assigned';
  const canRecordDecision = can(currentUser, 'review_decision').allowed
    && decisionAccess === 'full';
  const isCurrentAssetVersion = currentVersion.version_id === asset.current_version_id;
  const auditPresentation = getAuditPresentation(
    currentVersion,
    auditAttempts[currentVersion.version_id]
  );
  const emptyFindingsState = auditPresentation.kind === 'server'
    ? {
        title: 'No findings returned by the server check',
        message: 'This result does not guarantee approval; continue with review and follow the current guidelines.',
      }
    : auditPresentation.kind === 'local'
      ? {
          title: 'No issues matched by local rules',
          message: 'This local check is not server- or AI-verified.',
        }
      : auditPresentation.kind === 'not-run'
        ? {
            title: 'Brand check not run',
            message: 'Run a brand check to see available findings for this version.',
          }
        : {
            title: 'No confirmed findings available',
            message: auditPresentation.message,
          };

  // Run automated Brand Governance Audit
  const handleRunAudit = async () => {
    if (!currentVersion) return;
    setAuditAttempts(previous => ({ ...previous, [currentVersion.version_id]: 'pending' }));
    try {
      setIsAuditing(true);
      const result = await auditService.triggerAudit(asset, currentVersion.version_id);
      setFindings(result.findings);
      onAssetUpdated(asset);
      setAuditAttempts(previous => {
        const next = { ...previous };
        delete next[currentVersion.version_id];
        return next;
      });
      setToastTone(result.source === 'api' ? 'success' : 'warning');
      setToastMessage(result.source === 'api'
        ? `Server brand check confirmed: ${result.summary.total_findings} finding(s). AI use is not identified by the response.`
        : result.source === 'local'
          ? `Server audit outcome unconfirmed. A local rule check found ${result.summary.total_findings} issue(s); this is not a server or AI result.`
          : 'The server reported that the brand check failed or was unavailable. No completed result is confirmed.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error: unknown) {
      const attempt: AuditAttemptState = error instanceof ApiError && error.outcome === 'rejected'
        ? 'rejected'
        : 'unknown';
      setAuditAttempts(previous => ({ ...previous, [currentVersion.version_id]: attempt }));
      setToastTone('warning');
      setToastMessage(attempt === 'rejected'
        ? 'The server rejected the brand-check request. No new result was recorded.'
        : 'The server audit outcome is unconfirmed. No local result was recorded.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsAuditing(false);
    }
  };

  // Submit for human review
  const handleSubmitReview = async () => {
    if (!currentVersion) return;
    if (!canSubmitForReview || !isCurrentAssetVersion) return;
    try {
      setIsSubmittingReview(true);
      const result = await reviewsService.submitReview(asset.id, currentVersion.version_id);
      if (!result.success) {
        setToastTone('error');
        setToastMessage(result.message
          ? `The server did not accept this review submission: ${result.message}`
          : 'The server did not accept this review submission. The saved revision is unchanged.');
        return;
      }

      const submittedVersion: AssetVersion = {
        ...currentVersion,
        audit_status: 'in_review',
      };
      const updatedAsset: Asset = {
        ...asset,
        current_status: 'in_review',
        updated_at: new Date().toISOString(),
        versions: asset.versions.map(version =>
          version.version_id === submittedVersion.version_id ? submittedVersion : version
        ),
      };
      setAsset(updatedAsset);
      assetsService.updateLocalSnapshot(updatedAsset);
      onAssetUpdated(updatedAsset);
      const queueRefreshed = await onReviewQueueRefresh();
      setToastTone(queueRefreshed ? 'success' : 'warning');
      setToastMessage(queueRefreshed
        ? 'Submitted to Human Review Queue. Review SLA timer (8.0h) is now active.'
        : 'Submission confirmed and status updated, but the Review Queue could not be refreshed.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error: unknown) {
      setToastTone('warning');
      setToastMessage(error instanceof ApiError && error.outcome === 'rejected'
        ? 'The server rejected this review submission. The saved revision is unchanged.'
        : "We couldn't confirm whether this version was submitted for review. Check the submission's current status before trying again. The saved revision is preserved.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Record Decision
  const handleRecordDecision = async (
    decision: 'approved' | 'rejected' | 'revision_requested',
    notes: string
  ) => {
    if (!currentVersion) return;
    try {
      const decisionRecord = await reviewsService.submitDecision(asset.id, currentVersion.version_id, {
        decision,
        notes,
      });
      const status = decision === 'approved'
        ? 'approved'
        : decision === 'rejected'
          ? 'rejected'
          : 'review_required';
      const updatedVersion: AssetVersion = {
        ...currentVersion,
        review_decision: decisionRecord,
        audit_status: status,
      };
      const updatedAsset: Asset = {
        ...asset,
        current_status: asset.current_version_id === currentVersion.version_id
          ? status
          : asset.current_status,
        updated_at: decisionRecord.timestamp,
        versions: asset.versions.map(version =>
          version.version_id === currentVersion.version_id ? updatedVersion : version
        ),
      };
      assetsService.updateLocalSnapshot(updatedAsset);
      setAsset(updatedAsset);
      onAssetUpdated(updatedAsset);
      const queueRefreshed = await onReviewQueueRefresh();
      setToastTone(queueRefreshed ? 'success' : 'warning');
      setToastMessage(queueRefreshed
        ? `Formal review decision recorded: ${decision.replaceAll('_', ' ')}`
        : `The decision was recorded, but the review queue could not be refreshed.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error: unknown) {
      const rejected = error instanceof ApiError && error.outcome === 'rejected';
      const message = rejected
        ? 'The server rejected this decision. The review state was not changed.'
        : "We couldn't confirm whether this decision was recorded. Refresh and check the version's review status before trying again. No automatic retry was made.";
      setToastTone(rejected ? 'error' : 'warning');
      setToastMessage(message);
      setTimeout(() => setToastMessage(null), 3500);
      throw new Error(message);
    }
  };

  // Create new immutable version from staged suggestions
  const handleSaveRevision = async () => {
    if (!canDraftRevision || !revisionContent.trim() || !revisionChangelog.trim()) return;
    try {
      setIsSavingRevision(true);
      const newVersion = await assetsService.createAssetVersion(asset.id, asset.current_version_id, {
        content: revisionContent,
        changelog: revisionChangelog,
      });
      setIsCreatingRevision(false);
      setRevisionChangelog('');
      setRevisionContent(newVersion.content);
      const assetForAudit: Asset = {
        ...asset,
        current_version_id: newVersion.version_id,
        current_status: 'draft',
        updated_at: newVersion.created_at,
        versions: [
          ...versions.filter(version => version.version_id !== newVersion.version_id),
          newVersion,
        ],
      };
      let auditMessage: string;
      let auditSource: 'api' | 'local' | 'unavailable' = 'unavailable';
      let auditResultFindings: AuditFinding[] = [];
      try {
        const result = await auditService.triggerAudit(assetForAudit, newVersion.version_id);
        auditSource = result.source;
        auditResultFindings = result.findings;
        auditMessage = result.source === 'api'
          ? 'Server brand check completed.'
          : result.source === 'local'
            ? 'Server audit outcome unconfirmed. A local rule check ran; it is not a server or AI result.'
            : 'The server reported that the brand check failed or was unavailable.';
      } catch (auditError: unknown) {
        const serverOutcome = auditError instanceof ApiError
          ? auditError.outcome
          : 'unknown';
        newVersion.audit_status = 'unavailable';
        newVersion.audit_source = 'unavailable';
        newVersion.audit_server_outcome = serverOutcome;
        delete newVersion.audit_summary;
        assetsService.updateLocalSnapshot(assetForAudit);
        auditMessage = serverOutcome === 'unknown'
          ? 'Server audit outcome is unconfirmed; the saved version is preserved.'
          : 'The server rejected the brand check; the saved version is preserved.';
      }
      assetsService.updateLocalSnapshot(assetForAudit);
      setAsset(assetForAudit);
      setFindings(auditResultFindings);
      onAssetUpdated(assetForAudit);
      setSelectedVersionId(newVersion.version_id);
      setActiveTab('diff');
      setToastTone(auditSource === 'api' ? 'success' : 'warning');
      setToastMessage(`Version ${newVersion.version_number} saved. ${auditMessage}`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error: unknown) {
      const uncertain = !(error instanceof ApiError) || error.outcome === 'unknown';
      setToastTone(uncertain ? 'warning' : 'error');
      setToastMessage(uncertain
        ? "We couldn't confirm whether this revision was saved. Check Version History before trying again. Your edited content and changelog are still here."
        : 'The server rejected this revision. Your edited content and changelog are still here.');
    } finally {
      setIsSavingRevision(false);
    }
  };

  // Handle stage revisions from Diff Box
  const handleStageSuggestions = (suggestedText: string, skippedCount: number) => {
    if (!canDraftRevision) return;
    setRevisionContent(suggestedText);
    setRevisionChangelog('Applied available suggested replacements; review the draft before resubmitting.');
    setIsCreatingRevision(true);
    setActiveTab('editor');
    if (skippedCount > 0) {
      setToastTone('warning');
      setToastMessage(`${skippedCount} suggestion(s) were not applied automatically. Review repeated or overlapping phrases manually.`);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-[#64748B]">
        Asset details use the existing frontend service; demo fallback records may appear when the API is unavailable.
      </p>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          role={toastTone === 'success' ? 'status' : 'alert'}
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            toastTone === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : toastTone === 'warning'
                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#B45309]'
                : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{currentUser.role === 'creator' ? 'Back to My Submissions' : 'Back to Asset Library'}</span>
        </button>

        <div className="flex items-center gap-2.5">
          {canRunAudit && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5 text-[#6366F1]" />}
              onClick={handleRunAudit}
              isLoading={isAuditing}
            >
              Run Brand Check
            </Button>
          )}

          {canSubmitForReview
            && isCurrentAssetVersion
            && (currentVersion.audit_status === 'draft' || currentVersion.audit_status === 'review_required') ? (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              onClick={handleSubmitReview}
              isLoading={isSubmittingReview}
            >
              Submit for Review
            </Button>
          ) : null}

          {canRecordDecision && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
              onClick={() => setDecisionModalOpen(true)}
            >
              Review Decision
            </Button>
          )}
        </div>
      </div>
      {assignmentVerificationUnavailable && (
        <p role="status" className="text-xs text-[#64748B]">
          Decision controls are unavailable because this assignment cannot be verified.
        </p>
      )}

      {/* Main Asset Header Card */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold text-[#6366F1] bg-[#6366F1]/10 px-2.5 py-0.5 rounded border border-[#6366F1]/25">
                  {asset.channel.replace('_', ' ')}
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <span className="text-xs text-[#94A3B8] font-medium">
                  {asset.campaign || 'Global Brand Communications'}
                </span>
                <Badge status={currentVersion.audit_status} size="sm" />
                <span className="text-xs text-[#64748B]">{auditPresentation.label}</span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-[#F8FAFC] md:text-[1.75rem]">
                {asset.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Author: <strong className="text-[#F8FAFC]">{currentVersion.created_by.name}</strong> ({roleLabel(currentVersion.created_by.role)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Version Timestamp: <strong className="text-[#F8FAFC] font-mono">{formatTimestamp(currentVersion.created_at)}</strong></span>
                </div>
              </div>
            </div>

            {/* Immutability Lock Badge */}
            <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded bg-[#161E2E] border border-[#253047] flex items-center justify-center text-[#94A3B8]">
                <Lock className="w-4 h-4 text-[#818CF8]" />
              </div>
              <div className="text-right">
                <div className="text-xs text-[#64748B]">
                  Version Registry
                </div>
                <div className="text-xs font-semibold text-[#F8FAFC] font-mono">
                  {currentVersion.version_number} (Immutable)
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Version Selector Tabs */}
          <div className="mt-6 pt-4 border-t border-[#253047] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#94A3B8] mr-1">
                Version History:
              </span>
              <div className="flex items-center gap-1.5">
                {versions.map(v => {
                  const isSelected = v.version_id === selectedVersionId;
                  return (
                    <button
                      key={v.version_id}
                      onClick={() => {
                        setSelectedVersionId(v.version_id);
                        setIsCreatingRevision(false);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#6366F1] shadow-xs'
                          : 'bg-[#0D1220] text-[#94A3B8] border border-[#253047] hover:text-[#F8FAFC]'
                      }`}
                    >
                      <span>{v.version_number}</span>
                      {v.version_id === asset.current_version_id && (
                        <span className="font-sans text-[10px]">Current</span>
                      )}
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        v.audit_status === 'approved' ? 'bg-[#10B981]' : v.audit_status === 'breach' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {canDraftRevision && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsCreatingRevision(true);
                  setRevisionContent(currentVersion.content);
                  setActiveTab('editor');
                }}
              >
                Draft New Revision
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Decision Trail Banner (if approved/rejected) */}
      {currentDecision && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          currentDecision.decision === 'approved'
            ? 'bg-[#10B981]/5 border-[#10B981]/30 text-[#10B981]'
            : currentDecision.decision === 'rejected'
            ? 'bg-[#EF4444]/5 border-[#EF4444]/30 text-[#EF4444]'
            : 'bg-[#F59E0B]/5 border-[#F59E0B]/30 text-[#F59E0B]'
        }`}>
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold capitalize">
                Review outcome: {currentDecision.decision.replaceAll('_', ' ')}
              </span>
              <span className="text-[11px] text-[#94A3B8] font-mono">
                {new Date(currentDecision.timestamp).toLocaleString()}
              </span>
            </div>
            {currentUser.role !== 'creator' && (
              <p className="text-xs text-[#F8FAFC] font-medium leading-relaxed">
                "{currentDecision.notes}"
              </p>
            )}
            <div className="text-sm text-[#94A3B8]">
              Reviewed by: <strong className="text-[#F8FAFC]">{currentDecision.reviewer.name}</strong> ({roleLabel(currentDecision.reviewer.role)})
            </div>
          </div>
        </div>
      )}
      {currentUser.role === 'creator' && versions.some(version =>
        version.review_decision?.version_id === version.version_id
      ) && (
        <p className="text-xs text-[#5C6878]">
          Creator-facing comments are unavailable. Reviewer notes are hidden because the current record does not distinguish internal notes from feedback intended for you.
        </p>
      )}
      {currentUser.role === 'creator'
        && currentVersion.audit_status === 'in_review'
        && !currentDecision && (
        <p className="text-xs text-[#5C6878]">
          This version is awaiting a review decision. Creator-facing comments will appear here only if the supported review data provides them.
        </p>
      )}

      {/* Audit Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#253047]">
          <div className="text-xs text-[#64748B]">Total Findings</div>
          <div className="text-xl font-bold text-[#F8FAFC] mt-1 tabular-nums font-mono">
            {currentVersion.audit_summary?.total_findings ?? (findings.length ? findings.length : '—')}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#253047]">
          <div className="text-xs text-[#EF4444]">Rule Breaches</div>
          <div className="text-xl font-bold text-[#EF4444] mt-1 tabular-nums font-mono">
            {currentVersion.audit_summary?.breaches ?? (findings.length
              ? findings.filter(f => f.severity === 'breach').length
              : '—')}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#253047]">
          <div className="text-xs text-[#F59E0B]">Review Warnings</div>
          <div className="text-xl font-bold text-[#F59E0B] mt-1 tabular-nums font-mono">
            {currentVersion.audit_summary?.warnings ?? (findings.length
              ? findings.filter(f => f.severity === 'warning').length
              : '—')}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#253047]">
          <div className="text-xs text-[#10B981]">Conforming Clauses</div>
          <div className="text-xl font-bold text-[#10B981] mt-1 tabular-nums font-mono">
            {currentVersion.audit_summary?.compliant_checks ?? '—'}
          </div>
        </div>
      </div>

      {/* Inspection Views Sub-Navigation */}
      <div className="flex items-center justify-between border-b border-[#253047]">
        <Tabs
          tabs={[
            { id: 'diff', label: 'Content review' },
            { id: 'findings', label: 'Findings', badge: findings.length },
            { id: 'history', label: 'Version history', badge: versions.length },
            ...(isCreatingRevision ? [{ id: 'editor', label: 'Edit revision' }] : []),
          ]}
          activeTab={activeTab}
          onChange={tabId => setActiveTab(tabId as 'diff' | 'findings' | 'history' | 'editor')}
        />
      </div>

      {/* View Contents */}
      {activeTab === 'diff' && (
        <InspectionDiffBox
          originalContent={currentVersion.content}
          findings={findings}
          auditPresentation={auditPresentation}
          onSelectEvidence={(evidence, ruleTitle, severity) =>
            setActiveEvidence({ evidence, ruleTitle, severity })
          }
          onApplyAllSuggestions={canDraftRevision ? handleStageSuggestions : undefined}
        />
      )}

      {activeTab === 'findings' && (
        <AuditFindingsList
          findings={findings}
          onSelectEvidence={(evidence, ruleTitle, severity) =>
            setActiveEvidence({ evidence, ruleTitle, severity })
          }
          emptyStateTitle={emptyFindingsState.title}
          emptyStateMessage={emptyFindingsState.message}
          onApplySingleSuggestion={canDraftRevision ? finding => {
            const suggestion = applyUniqueSuggestions(currentVersion.content, [finding]);
            if (suggestion.content === currentVersion.content) {
              setToastTone('warning');
              setToastMessage(suggestion.skipped
                ? 'This phrase is repeated, missing, or overlaps another match. It was not changed automatically; review it manually.'
                : 'No safe replacement was available for this phrase.');
              return;
            }
            setRevisionContent(suggestion.content);
            setRevisionChangelog(`Reviewed suggested replacement for ${finding.title}.`);
            setIsCreatingRevision(true);
            setActiveTab('editor');
          } : undefined}
        />
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#F8FAFC]">
              Version history
            </h3>
          </CardHeader>
          <CardBody className="p-5 space-y-4">
            {versions.map(v => {
              const versionAudit = getAuditPresentation(v);
              const decision = v.review_decision?.version_id === v.version_id
                ? v.review_decision
                : undefined;
              return (
                <div
                  key={v.version_id}
                  className={`p-4 rounded-xl border transition-all ${
                    v.version_id === selectedVersionId
                      ? 'bg-[#161E2E] border-[#6366F1]'
                      : 'bg-[#0D1220] border-[#253047]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                        {v.version_number}
                      </span>
                      <Badge status={v.audit_status} size="sm" />
                      {v.version_id === asset.current_version_id && (
                        <span className="text-xs font-medium text-[#10B981]">Current version</span>
                      )}
                      {v.version_id === selectedVersionId && (
                        <span className="text-xs text-[#6366F1]">Selected</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#64748B] font-mono">
                      {formatTimestamp(v.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-[#64748B]">
                    Created by {v.created_by.name} ({roleLabel(v.created_by.role)})
                  </p>
                  <p className="text-xs text-[#94A3B8] leading-relaxed my-2">
                    {v.changelog || 'No changelog provided.'}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Brand check: <span className="text-[#94A3B8]">{versionAudit.label}</span>
                    {v.audit_summary && (
                      <> · {v.audit_summary.total_findings} finding(s) · {formatTimestamp(v.audit_summary.audit_date)}</>
                    )}
                  </p>
                  {versionAudit.kind !== 'server' && (
                    <p className="mt-1 text-xs text-[#64748B]">{versionAudit.message}</p>
                  )}

                  {decision && (
                    <div className="mt-3 p-3 rounded-lg bg-[#111827] border border-[#253047] text-xs space-y-1">
                      <div className="font-semibold text-[#94A3B8]">
                        Review outcome: {decision.decision.replaceAll('_', ' ')} by {decision.reviewer.name}
                        {' · '}{formatTimestamp(decision.timestamp)}
                      </div>
                      {currentUser.role !== 'creator' && (
                        <div className="text-[#94A3B8]">"{decision.notes}"</div>
                      )}
                      {currentUser.role === 'creator' && (
                        <div className="text-[#64748B]">
                          Creator-facing comments are unavailable; reviewer notes are hidden.
                        </div>
                      )}
                    </div>
                  )}

                  {v.version_id !== selectedVersionId && (
                    <div className="mt-3 pt-2 border-t border-[#253047]/60 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVersionId(v.version_id);
                          setActiveTab('diff');
                        }}
                      >
                        Inspect this version
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {activeTab === 'editor' && canDraftRevision && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                Draft Revision for Immutable Version Commit
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Product Rule 3: Every saved revision creates a new asset version. Previous versions remain permanently preserved.
              </p>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#94A3B8]">
                Revision Content
              </label>
              <textarea
                value={revisionContent}
                onChange={e => setRevisionContent(e.target.value)}
                rows={8}
                className="w-full rounded-md bg-[#0D1220] border border-[#253047] p-3 text-sm text-[#F8FAFC] leading-relaxed focus:outline-none focus:border-[#6366F1]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#94A3B8]">
                Revision Changelog Rationale (Required)
              </label>
              <input
                type="text"
                placeholder="e.g. Substituted unverified ROI multiplier with footnote study reference..."
                value={revisionChangelog}
                onChange={e => setRevisionChangelog(e.target.value)}
                className="w-full h-9 rounded-md bg-[#0D1220] border border-[#253047] px-3 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#6366F1]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreatingRevision(false);
                  setActiveTab('diff');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveRevision}
                isLoading={isSavingRevision}
                disabled={!revisionContent.trim() || !revisionChangelog.trim()}
              >
                Commit as New Version & Audit
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Evidence Reference Slide-over Drawer */}
      {activeEvidence && (
        <EvidenceDrawer
          evidence={activeEvidence.evidence}
          ruleTitle={activeEvidence.ruleTitle}
          severity={activeEvidence.severity}
          onClose={() => setActiveEvidence(null)}
          onViewSource={onViewSource}
        />
      )}

      {/* Human Decision Modal */}
      {canRecordDecision && (
        <DecisionModal
          isOpen={decisionModalOpen}
          onClose={() => setDecisionModalOpen(false)}
          version={currentVersion}
          currentUser={currentUser}
          onSubmitDecision={handleRecordDecision}
        />
      )}
    </div>
  );
};
