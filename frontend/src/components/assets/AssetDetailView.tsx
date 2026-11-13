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

interface AssetDetailViewProps {
  assetId: string;
  currentUser: User;
  allowCreatorSubmissionAccess: boolean;
  onBack: () => void;
  onViewSource?: (sourceId: string) => void;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({
  assetId,
  currentUser,
  allowCreatorSubmissionAccess,
  onBack,
  onViewSource,
}) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assetLoadState, setAssetLoadState] = useState<'loading' | 'ready' | 'denied' | 'unavailable'>('loading');
  const assetLoadRequest = useRef(0);
  const findingsLoadRequest = useRef(0);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'findings' | 'history' | 'editor'>('diff');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

    if (currentUser.role === 'creator'
      && !canCreatorOpenAssetDetails(data, currentUser.id, allowCreatorSubmissionAccess)) {
      setAsset(null);
      setFindings([]);
      setAssetLoadState('denied');
      return;
    }

    setAsset(data);
    const activeVerId = data.versions.some(version => version.version_id === selectedVersionId)
      ? selectedVersionId
      : data.current_version_id || data.versions[data.versions.length - 1]?.version_id;
    setSelectedVersionId(activeVerId);
    setAssetLoadState('ready');
    loadFindings(data.id, activeVerId);
  };

  const loadFindings = async (aId: string, vId: string) => {
    const requestId = ++findingsLoadRequest.current;
    const list = await auditService.getFindings(aId, vId);
    if (requestId === findingsLoadRequest.current && aId === assetId) setFindings(list);
  };

  useEffect(() => {
    setAsset(null);
    loadAsset();
    return () => {
      assetLoadRequest.current += 1;
    };
  }, [assetId, currentUser.id, currentUser.role, allowCreatorSubmissionAccess]);

  useEffect(() => {
    if (asset && selectedVersionId) {
      loadFindings(asset.id, selectedVersionId);
      const curVer = asset.versions.find(v => v.version_id === selectedVersionId);
      if (curVer) {
        setRevisionContent(curVer.content);
      }
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
        This asset is unavailable.
      </div>
    );
  }

  const currentVersion = asset.versions.find(v => v.version_id === selectedVersionId) || asset.versions[0];

  // Run automated Brand Governance Audit
  const handleRunAudit = async () => {
    if (!currentVersion) return;
    try {
      setIsAuditing(true);
      const result = await auditService.triggerAudit(asset, currentVersion.version_id);
      setFindings(result.findings);
      await loadAsset();
      setToastMessage(result.source === 'api'
        ? `Server brand check completed: ${result.summary.total_findings} finding(s) detected.`
        : `Server audit outcome unconfirmed. A local rule check found ${result.summary.total_findings} issue(s); this is not a server or AI result.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (error: unknown) {
      setToastMessage(error instanceof ApiError && error.outcome === 'rejected'
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
    try {
      setIsSubmittingReview(true);
      await reviewsService.submitReview(asset.id, currentVersion.version_id);
      await loadAsset();
      setToastMessage('Submitted to Human Review Queue. Review SLA timer (8.0h) is now active.');
      setTimeout(() => setToastMessage(null), 3500);
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
    await reviewsService.submitDecision(asset.id, currentVersion.version_id, {
      decision,
      notes,
    });
    await loadAsset();
    setToastMessage(`Formal review decision recorded: ${decision.replaceAll('_', ' ')}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Create new immutable version from staged suggestions
  const handleSaveRevision = async () => {
    if (!revisionContent.trim() || !revisionChangelog.trim()) return;
    try {
      setIsSavingRevision(true);
      const newVersion = await assetsService.createAssetVersion(asset.id, {
        content: revisionContent,
        changelog: revisionChangelog,
      });
      setIsCreatingRevision(false);
      setRevisionChangelog('');
      const assetForAudit: Asset = {
        ...asset,
        current_version_id: newVersion.version_id,
        current_status: 'draft',
        versions: [
          ...asset.versions.filter(version => version.version_id !== newVersion.version_id),
          newVersion,
        ],
      };
      let auditMessage: string;
      try {
        const result = await auditService.triggerAudit(assetForAudit, newVersion.version_id);
        auditMessage = result.source === 'api'
          ? 'Server brand check completed.'
          : 'Server audit outcome unconfirmed. A local rule check ran; it is not a server or AI result.';
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
      await loadAsset();
      setSelectedVersionId(newVersion.version_id);
      setActiveTab('diff');
      setToastMessage(`Version ${newVersion.version_number} saved. ${auditMessage}`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSavingRevision(false);
    }
  };

  // Handle stage revisions from Diff Box
  const handleStageSuggestions = (suggestedText: string) => {
    setRevisionContent(suggestedText);
    setRevisionChangelog('Applied approved guideline replacements for trademark, tone, and regulatory claims.');
    setIsCreatingRevision(true);
    setActiveTab('editor');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center justify-between">
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
          <span>Back to Asset Repository</span>
        </button>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Play className="w-3.5 h-3.5 text-[#6366F1]" />}
            onClick={handleRunAudit}
            isLoading={isAuditing}
          >
            Run Governance Audit
          </Button>

          {currentVersion.audit_status === 'draft' || currentVersion.audit_status === 'review_required' ? (
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

          <Button
            variant="primary"
            size="sm"
            leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            onClick={() => setDecisionModalOpen(true)}
          >
            Review Decision
          </Button>
        </div>
      </div>

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
                  <span>Version Timestamp: <strong className="text-[#F8FAFC] font-mono">{new Date(currentVersion.created_at).toLocaleString()}</strong></span>
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
                {asset.versions.map(v => {
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
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        v.audit_status === 'approved' ? 'bg-[#10B981]' : v.audit_status === 'breach' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>

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
          </div>
        </CardBody>
      </Card>

      {/* Decision Trail Banner (if approved/rejected) */}
      {currentVersion.review_decision && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
          currentVersion.review_decision.decision === 'approved'
            ? 'bg-[#10B981]/5 border-[#10B981]/30 text-[#10B981]'
            : currentVersion.review_decision.decision === 'rejected'
            ? 'bg-[#EF4444]/5 border-[#EF4444]/30 text-[#EF4444]'
            : 'bg-[#F59E0B]/5 border-[#F59E0B]/30 text-[#F59E0B]'
        }`}>
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold capitalize">
                Formal review record: {currentVersion.review_decision.decision.replaceAll('_', ' ')}
              </span>
              <span className="text-[11px] text-[#94A3B8] font-mono">
                {new Date(currentVersion.review_decision.timestamp).toLocaleString()}
              </span>
            </div>
            {currentUser.role !== 'creator' && (
              <p className="text-xs text-[#F8FAFC] font-medium leading-relaxed">
                "{currentVersion.review_decision.notes}"
              </p>
            )}
            <div className="text-sm text-[#94A3B8]">
              Signed by reviewer: <strong className="text-[#F8FAFC]">{currentVersion.review_decision.reviewer.name}</strong> ({roleLabel(currentVersion.review_decision.reviewer.role)})
            </div>
          </div>
        </div>
      )}
      {currentUser.role === 'creator' && asset.versions.some(version => version.review_decision) && (
        <p className="text-xs text-[#5C6878]">
          Reviewer notes are hidden because the available record does not distinguish internal notes from creator-facing feedback.
        </p>
      )}

      {/* Audit Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#111827] border border-[#253047]">
          <div className="text-xs text-[#64748B]">Total Findings</div>
          <div className="text-xl font-bold text-[#F8FAFC] mt-1 tabular-nums font-mono">
            {findings.length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#253047]">
          <div className="text-xs text-[#EF4444]">Rule Breaches</div>
          <div className="text-xl font-bold text-[#EF4444] mt-1 tabular-nums font-mono">
            {findings.filter(f => f.severity === 'breach').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#111827] border border-[#253047]">
          <div className="text-xs text-[#F59E0B]">Review Warnings</div>
          <div className="text-xl font-bold text-[#F59E0B] mt-1 tabular-nums font-mono">
            {findings.filter(f => f.severity === 'warning').length}
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
            { id: 'history', label: 'Version history', badge: asset.versions.length },
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
          auditSource={currentVersion.audit_source}
          auditServerOutcome={currentVersion.audit_server_outcome}
          onSelectEvidence={(evidence, ruleTitle, severity) =>
            setActiveEvidence({ evidence, ruleTitle, severity })
          }
          onApplyAllSuggestions={handleStageSuggestions}
        />
      )}

      {activeTab === 'findings' && (
        <AuditFindingsList
          findings={findings}
          onSelectEvidence={(evidence, ruleTitle, severity) =>
            setActiveEvidence({ evidence, ruleTitle, severity })
          }
          onApplySingleSuggestion={finding => {
            if (currentVersion.content.includes(finding.flagged_text)) {
              const updated = currentVersion.content.replace(
                finding.flagged_text,
                finding.suggested_replacement
              );
              setRevisionContent(updated);
              setRevisionChangelog(`Applied replacement for ${finding.title}`);
              setIsCreatingRevision(true);
              setActiveTab('editor');
            }
          }}
        />
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-[#F8FAFC]">
              Immutable Version Tree & Decision Ledger
            </h3>
          </CardHeader>
          <CardBody className="p-5 space-y-4">
            {asset.versions.map(v => (
              <div
                key={v.version_id}
                className={`p-4 rounded-xl border transition-all ${
                  v.version_id === selectedVersionId
                    ? 'bg-[#161E2E] border-[#6366F1]'
                    : 'bg-[#0D1220] border-[#253047]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                      {v.version_number}
                    </span>
                    <Badge status={v.audit_status} size="sm" />
                    {v.version_id === selectedVersionId && (
                      <span className="text-xs text-[#6366F1]">(Currently inspecting)</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed mb-3">
                  {v.changelog || 'Version committed.'}
                </p>

                {v.review_decision && (
                  <div className="p-3 rounded-lg bg-[#111827] border border-[#253047] text-xs space-y-1">
                    <div className="text-xs font-semibold text-[#10B981]">
                      Decision: {v.review_decision.decision.replaceAll('_', ' ')} by {v.review_decision.reviewer.name}
                    </div>
                    {currentUser.role !== 'creator' && (
                      <div className="text-[#94A3B8]">"{v.review_decision.notes}"</div>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-[#253047]/60 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedVersionId(v.version_id);
                      setActiveTab('diff');
                    }}
                  >
                    Switch to this version
                  </Button>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {activeTab === 'editor' && (
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
      <DecisionModal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        version={currentVersion}
        currentUser={currentUser}
        onSubmitDecision={handleRecordDecision}
      />
    </div>
  );
};
