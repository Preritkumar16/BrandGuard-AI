/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Asset, AuditFinding, BrandSource, ReviewDecision, ReviewQueueItem, User } from '../../types';
import { ROLE_META, roleLabel } from '../../config/roles';
import { authService } from '../../services/API/authService';
import { auditService } from '../../services/API/auditService';
import { isAssetOwnedBy } from '../../services/API/assetsService';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Card, CardBody, CardHeader } from '../UI/Card';
import { StatCard } from '../layout/StatCard';

interface DashboardProps {
  assets: Asset[];
  creatorSubmissionNotice: {
    message: string;
    tone: 'info' | 'warning';
  } | null;
  sources: BrandSource[];
  queue: ReviewQueueItem[];
  currentUser: User;
  onSelectAsset: (assetId: string) => void;
  onNavigateToQueue: () => void;
  onNavigateToSources: (category?: string) => void;
  onNavigateToAssets: () => void;
  onNavigateToAuditLog: () => void;
  onNewAssetClick: () => void;
  onOpenRbacMatrix: () => void;
  onOpenPolicyRules: () => void;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  date: string;
  status?: Asset['current_status'];
}

interface DecisionEvent {
  assetTitle: string;
  versionNumber: string;
  decision: ReviewDecision;
}

function getLatestVersion(asset: Asset) {
  return asset.versions.find(version => version.version_id === asset.current_version_id)
    ?? asset.versions[asset.versions.length - 1];
}

function dateValue(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value: string): string {
  const timestamp = dateValue(value);
  return timestamp ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(timestamp) : 'Date unavailable';
}

function decisionEvents(assets: Asset[]): DecisionEvent[] {
  return assets.flatMap(asset => asset.versions.flatMap(version =>
    version.review_decision
      ? [{
          assetTitle: asset.title,
          versionNumber: version.version_number,
          decision: version.review_decision,
        }]
      : [],
  )).sort((a, b) => dateValue(b.decision.timestamp) - dateValue(a.decision.timestamp));
}

function organisationActivity(assets: Asset[], sources: BrandSource[]): ActivityItem[] {
  return [
    ...assets.map(asset => ({
      id: `asset-${asset.id}`,
      type: 'Asset updated',
      title: asset.title,
      date: asset.updated_at,
      status: asset.current_status,
    })),
    ...sources.map(source => ({
      id: `source-${source.id}`,
      type: 'Brand source updated',
      title: source.title,
      date: source.updated_at,
      status: source.status,
    })),
  ].sort((a, b) => dateValue(b.date) - dateValue(a.date)).slice(0, 5);
}

const DashboardHeading: React.FC<{
  title: string;
  description: string;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 rounded-xl border border-[#DCE2E9] border-l-4 border-l-[#315EA8] bg-[#EEF4FA] px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-[#1B2533] md:text-[1.75rem]">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#4B5869]">{description}</p>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
  </div>
);

const DashboardSection: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, action, children }) => (
  <Card className="overflow-hidden rounded-xl border-[#DCE2E9] bg-white shadow-sm">
    <CardHeader className="gap-3 bg-[#F1F5F9]">
      <h2 className="text-base font-semibold text-[#1B2533]">{title}</h2>
      {action}
    </CardHeader>
    <CardBody>{children}</CardBody>
  </Card>
);

const EmptyState: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="py-4 text-sm text-[#5C6878]">{children}</p>
);

const ServiceDataNote: React.FC = () => (
  <p className="text-xs text-[#5C6878]">
    Dashboard data comes from existing frontend services. Their demo fallback may appear when an API is unavailable.
  </p>
);

const DashboardPage: React.FC<{
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, actions, children }) => (
  <div className="space-y-6">
    <DashboardHeading title={title} description={description} actions={actions} />
    {children}
  </div>
);

const AdminDashboard: React.FC<DashboardProps> = props => {
  const { assets, sources, queue, onOpenRbacMatrix, onOpenPolicyRules } = props;
  const previewUsers = authService.getAvailableUsers();
  const activity = organisationActivity(assets, sources);

  return (
    <DashboardPage
      title="Organisation overview"
      description="Review current content, source, and access information."
      actions={
        <Button variant="secondary" size="sm" onClick={onOpenPolicyRules}>
          Governance rules
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered assets" value={assets.length} tone="info" />
        <StatCard label="Pending reviews" value={queue.length} tone={queue.length ? 'warn' : 'good'} />
        <StatCard label="Brand sources" value={sources.length} tone="good" />
        <StatCard label="Preview accounts" value={previewUsers.length} hint="Demo identities, not an organisation directory" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardSection title="Recent organisation activity">
          {activity.length === 0 ? (
            <EmptyState>No asset or source activity is available.</EmptyState>
          ) : (
            <ul className="divide-y divide-[#DCE2E9]">
              {activity.map(item => (
                <li key={item.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-[#5C6878]">{item.type}</p>
                    <p className="truncate text-sm font-medium text-[#1B2533]">{item.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {item.status && <Badge status={item.status} size="sm" />}
                    <span className="text-xs text-[#5C6878]">{formatDate(item.date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection
          title="Users and roles"
          action={
            <Button variant="outline" size="sm" onClick={onOpenRbacMatrix}>
              View access matrix
            </Button>
          }
        >
          <p className="mb-3 text-xs text-[#5C6878]">Preview accounts (demo data)</p>
          {previewUsers.length === 0 ? (
            <EmptyState>No preview accounts are available.</EmptyState>
          ) : (
            <ul className="divide-y divide-[#DCE2E9]">
              {previewUsers.map(user => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="truncate text-sm font-medium text-[#1B2533]">{user.name}</span>
                  <Badge variant="neutral" size="sm">{roleLabel(user.role)}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-[#DCE2E9] pt-3 text-xs text-[#5C6878]">
            The current frontend does not expose a live organisation user directory.
          </p>
        </DashboardSection>
      </div>

      <DashboardSection title="System health">
        <p className="text-sm text-[#4B5869]">
          Unavailable: no system-health data is exposed by the current frontend services.
        </p>
      </DashboardSection>
      <ServiceDataNote />
    </DashboardPage>
  );
};

const CreatorDashboard: React.FC<DashboardProps> = props => {
  const { assets, currentUser, onSelectAsset, onNewAssetClick, creatorSubmissionNotice } = props;
  const submissions = assets
    .filter(asset => isAssetOwnedBy(asset, currentUser.id))
    .sort((a, b) => dateValue(b.updated_at) - dateValue(a.updated_at));
  const auditedSubmissions = submissions.filter(asset => getLatestVersion(asset)?.audit_summary);
  const findingCount = auditedSubmissions.reduce((count, asset) => {
    const summary = getLatestVersion(asset)?.audit_summary;
    return count + (summary?.total_findings ?? 0);
  }, 0);
  const needsReview = submissions.filter(asset => asset.current_status === 'in_review' || asset.current_status === 'review_required').length;
  const recentVersions = submissions.flatMap(asset => asset.versions
    .filter(version => version.created_by.id === currentUser.id)
    .map(version => ({ asset, version })))
    .sort((a, b) => dateValue(b.version.created_at) - dateValue(a.version.created_at))
    .slice(0, 5);

  return (
    <DashboardPage
      title="My submissions"
      description="Track your content status and the latest available brand-check results."
      actions={      <Button size="sm" className="shadow-sm" onClick={onNewAssetClick}>Submit Content</Button>}
    >
      {creatorSubmissionNotice && (
        <div
          role={creatorSubmissionNotice.tone === 'warning' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            creatorSubmissionNotice.tone === 'warning'
              ? 'border-[#F2C98A] bg-[#FFF7E8] text-[#7A4B00]'
              : 'border-[#B8D0EA] bg-[#EEF4FA] text-[#315EA8]'
          }`}
        >
          {creatorSubmissionNotice.message}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="My submissions" value={submissions.length} />
        <StatCard label="In review" value={needsReview} tone={needsReview ? 'warn' : 'good'} />
        <StatCard
          label="Flagged issues"
          value={auditedSubmissions.length ? findingCount : '—'}
          hint={auditedSubmissions.length ? 'From available latest-version checks' : 'No brand-check results available'}
          tone={findingCount ? 'warn' : 'default'}
        />
      </div>

      <DashboardSection title="Submission status">
        {submissions.length === 0 ? (
          <EmptyState>You do not have any submissions yet. Use Submit Content to create one.</EmptyState>
        ) : (
          <ul className="divide-y divide-[#DCE2E9]">
            {submissions.map(asset => {
              const version = getLatestVersion(asset);
              const summary = version?.audit_summary;
              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => onSelectAsset(asset.id)}
                    className="flex w-full flex-col gap-2 py-3 text-left hover:bg-[#F4F6F9] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[#1B2533]">{asset.title}</span>
                      <span className="text-xs text-[#5C6878]">
                        {version?.version_number ?? 'Version unavailable'}
                        {' · '}
                        {summary
                          ? `${summary.total_findings} flagged issues · ${
                            version.audit_source === 'local'
                              ? version.audit_server_outcome === 'unknown'
                                ? 'Local rule check · server outcome unconfirmed'
                                : 'Local rule check (not server/AI)'
                              : version.audit_source === 'api'
                                ? 'Server check'
                                : 'Source unverified'
                          }`
                          : version?.audit_status === 'unavailable'
                            ? version.audit_server_outcome === 'unknown'
                              ? 'Server audit outcome unconfirmed'
                              : 'Initial brand check unavailable'
                            : 'Brand check pending'}
                      </span>
                    </span>
                    <Badge status={asset.current_status} size="sm" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Recent submission activity">
        {recentVersions.length === 0 ? (
          <EmptyState>No recent submission activity is available.</EmptyState>
        ) : (
          <ul className="divide-y divide-[#DCE2E9]">
            {recentVersions.map(({ asset, version }) => (
              <li key={version.version_id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1B2533]">{asset.title}</p>
                  <p className="text-xs text-[#5C6878]">{version.version_number} · {formatDate(version.created_at)}</p>
                </div>
                <Badge status={version.audit_status} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
      <ServiceDataNote />
    </DashboardPage>
  );
};

const BrandManagerDashboard: React.FC<DashboardProps> = props => {
  const { assets, sources, onNavigateToSources, onNavigateToAssets, onSelectAsset } = props;
  const updatedSources = [...sources].sort((a, b) => dateValue(b.updated_at) - dateValue(a.updated_at)).slice(0, 5);
  const approvedAssets = [...assets]
    .filter(asset => asset.current_status === 'approved')
    .sort((a, b) => dateValue(b.updated_at) - dateValue(a.updated_at))
    .slice(0, 5);
  const approvedSources = sources.filter(source => source.status === 'approved').length;

  return (
    <DashboardPage
      title="Brand sources"
      description="Review current guidelines, source versions, and approved assets."
      actions={
        <>
          <Button size="sm" className="shadow-sm" onClick={() => onNavigateToSources()}>
            Manage Brand Sources
          </Button>
          <Button variant="secondary" size="sm" onClick={onNavigateToAssets}>
            View assets
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Brand sources" value={sources.length} tone="info" />
        <StatCard label="Approved sources" value={approvedSources} tone="good" />
        <StatCard label="Approved assets" value={assets.filter(asset => asset.current_status === 'approved').length} tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardSection title="Recent source updates" action={<Button variant="ghost" size="sm" onClick={() => onNavigateToSources()}>View all</Button>}>
          {updatedSources.length === 0 ? (
            <EmptyState>No brand sources are available.</EmptyState>
          ) : (
            <ul className="divide-y divide-[#DCE2E9]">
              {updatedSources.map(source => (
                <li key={source.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1B2533]">{source.title}</p>
                    <p className="text-xs text-[#5C6878]">{source.current_version} · Updated {formatDate(source.updated_at)}</p>
                  </div>
                  <Badge status={source.status} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title="Approved assets and versions">
          {approvedAssets.length === 0 ? (
            <EmptyState>No approved assets are available.</EmptyState>
          ) : (
            <ul className="divide-y divide-[#DCE2E9]">
              {approvedAssets.map(asset => {
                const version = getLatestVersion(asset);
                return (
                  <li key={asset.id}>
                    <button
                      type="button"
                      onClick={() => onSelectAsset(asset.id)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[#F4F6F9]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[#1B2533]">{asset.title}</span>
                        <span className="text-xs text-[#5C6878]">{version?.version_number ?? 'Version unavailable'}</span>
                      </span>
                      <Badge status={asset.current_status} size="sm" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </DashboardSection>
      </div>
      <ServiceDataNote />
    </DashboardPage>
  );
};

const ReviewerDashboard: React.FC<DashboardProps> = props => {
  const { assets, queue, onNavigateToQueue, onSelectAsset } = props;
  const priorityOrder: Record<ReviewQueueItem['priority'], number> = { high: 0, medium: 1, low: 2 };
  const pendingReviews = [...queue].sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority]
      || a.sla_hours_remaining - b.sla_hours_remaining,
  );
  const recentDecisions = decisionEvents(assets).slice(0, 5);

  return (
    <DashboardPage
      title="Review overview"
      description="Work through pending reviews by priority and available turnaround time."
      actions={<Button size="sm" className="shadow-sm" onClick={onNavigateToQueue}>Open Review Queue</Button>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Pending reviews" value={queue.length} tone={queue.length ? 'warn' : 'good'} />
        <StatCard label="High priority" value={queue.filter(item => item.priority === 'high').length} tone="warn" />
        <StatCard label="Recorded decisions" value={decisionEvents(assets).length} tone="info" />
      </div>

      <DashboardSection title="Pending reviews">
        {pendingReviews.length === 0 ? (
          <EmptyState>No pending reviews are available.</EmptyState>
        ) : (
          <ul className="divide-y divide-[#DCE2E9]">
            {pendingReviews.slice(0, 5).map(item => (
              <li key={item.version_id}>
                <button
                  type="button"
                  onClick={() => onSelectAsset(item.asset_id)}
                  className="flex w-full flex-col gap-2 py-3 text-left hover:bg-[#F4F6F9] sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-[#1B2533]">{item.asset_title}</span>
                    <span className="text-xs text-[#5C6878]">
                      {item.version_number} · {item.creator.name} · {item.sla_hours_remaining.toFixed(1)}h remaining
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant={item.priority === 'high' ? 'warning' : 'neutral'} size="sm">{item.priority} priority</Badge>
                    <Badge status={item.status} size="sm" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Recent review activity">
        {recentDecisions.length === 0 ? (
          <EmptyState>No review decisions are available.</EmptyState>
        ) : (
          <ul className="divide-y divide-[#DCE2E9]">
            {recentDecisions.map(({ assetTitle, versionNumber, decision }) => (
              <li key={decision.decision_id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#1B2533]">{assetTitle}</p>
                  <p className="text-xs text-[#5C6878]">{versionNumber} · {decision.reviewer.name} · {formatDate(decision.timestamp)}</p>
                </div>
                <Badge variant="neutral" size="sm">{decision.decision.replaceAll('_', ' ')}</Badge>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
      <ServiceDataNote />
    </DashboardPage>
  );
};

interface FindingState {
  findings: AuditFinding[];
  loading: boolean;
  error: string | null;
}

const ComplianceDashboard: React.FC<DashboardProps> = ({ assets, onNavigateToAuditLog }) => {
  const [findingState, setFindingState] = useState<FindingState>({
    findings: [],
    loading: true,
    error: null,
  });
  const decisions = decisionEvents(assets);

  useEffect(() => {
    let active = true;
    setFindingState({ findings: [], loading: true, error: null });
    const requests = assets.map(asset => {
      const version = getLatestVersion(asset);
      return version ? auditService.getFindings(asset.id, version.version_id) : Promise.resolve([]);
    });

    void Promise.all(requests)
      .then(results => {
        if (active) setFindingState({ findings: results.flat(), loading: false, error: null });
      })
      .catch(error => {
        if (active) {
          setFindingState({
            findings: [],
            loading: false,
            error: error instanceof Error ? error.message : 'Unable to load audit findings.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [assets]);

  const unresolvedFindings = findingState.findings.filter(
    finding => finding.status === 'open' && (finding.severity === 'breach' || finding.severity === 'warning'),
  );

  return (
    <DashboardPage
      title="Compliance overview"
      description="Review findings, linked evidence, and recorded decisions. This dashboard is read-only."
      actions={<Button variant="secondary" size="sm" onClick={onNavigateToAuditLog}>Open audit log</Button>}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Latest-version findings" value={findingState.loading ? '…' : findingState.findings.length} />
        <StatCard label="Open risks" value={findingState.loading ? '…' : unresolvedFindings.length} tone={unresolvedFindings.length ? 'warn' : 'default'} />
        <StatCard label="Recorded decisions" value={decisions.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardSection title="Compliance findings and evidence">
          {findingState.loading ? (
            <EmptyState>Loading findings from the audit service…</EmptyState>
          ) : findingState.error ? (
            <p role="alert" className="py-4 text-sm text-[#B42318]">{findingState.error}</p>
          ) : findingState.findings.length === 0 ? (
            <EmptyState>No findings are available for the latest asset versions.</EmptyState>
          ) : (
            <ul className="divide-y divide-[#DCE2E9]">
              {findingState.findings.slice(0, 6).map(finding => (
                <li key={finding.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#1B2533]">{finding.title}</p>
                    <Badge status={finding.severity} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-[#4B5869]">
                    {finding.evidence.source_title} · {finding.evidence.source_version} · {finding.evidence.section}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-[#5C6878]">{finding.evidence.excerpt}</p>
                  <p className="mt-1 text-xs text-[#5C6878]">Finding status: {finding.status}</p>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>

        <DashboardSection title="Decision history">
          {decisions.length === 0 ? (
            <EmptyState>No review decisions are available.</EmptyState>
          ) : (
            <ul className="divide-y divide-[#DCE2E9]">
              {decisions.slice(0, 6).map(({ assetTitle, versionNumber, decision }) => (
                <li key={decision.decision_id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1B2533]">{assetTitle}</p>
                    <p className="text-xs text-[#5C6878]">{versionNumber} · {decision.reviewer.name} · {formatDate(decision.timestamp)}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{decision.decision.replaceAll('_', ' ')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>
      <ServiceDataNote />
    </DashboardPage>
  );
};

export const RoleDashboard: React.FC<DashboardProps> = props => {
  switch (props.currentUser.role) {
    case 'admin':
      return <AdminDashboard {...props} />;
    case 'creator':
      return <CreatorDashboard {...props} />;
    case 'source_owner':
      return <BrandManagerDashboard {...props} />;
    case 'reviewer':
      return <ReviewerDashboard {...props} />;
    case 'compliance_reviewer':
      return <ComplianceDashboard {...props} />;
    default:
      return <CreatorDashboard {...props} />;
  }
};
