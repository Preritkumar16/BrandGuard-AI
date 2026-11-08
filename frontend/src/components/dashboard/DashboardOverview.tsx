/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldAlert,
  FileText,
  Layers,
  ChevronRight,
  HelpCircle,
  Shield,
} from 'lucide-react';
import { Asset, BrandSource, ReviewQueueItem, User } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';

interface DashboardOverviewProps {
  assets: Asset[];
  sources: BrandSource[];
  queue: ReviewQueueItem[];
  currentUser: User;
  onSelectAsset: (assetId: string) => void;
  onNavigateToQueue: () => void;
  onNavigateToSources: (category?: string) => void;
  onNavigateToAssets: () => void;
  onNewAssetClick: () => void;
  onOpenComplianceHealth: () => void;
  onOpenPolicyRules: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  assets,
  sources,
  queue,
  currentUser,
  onSelectAsset,
  onNavigateToQueue,
  onNavigateToSources,
  onNavigateToAssets,
  onNewAssetClick,
  onOpenComplianceHealth,
  onOpenPolicyRules,
}) => {
  const approvedAssets = assets.filter(a => a.current_status === 'approved').length;
  const complianceRate = assets.length > 0 ? ((approvedAssets / assets.length) * 100).toFixed(1) : '94.2';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#111827] border border-[#253047] relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/25 font-semibold">
              Governance Active
            </span>
            <span className="text-xs text-[#64748B]">•</span>
            <span className="text-xs text-[#94A3B8]">Policy Engine v4.1.0</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-[#F8FAFC]">
            Enterprise Brand Governance Console
          </h1>
          <p className="text-xs text-[#94A3B8] max-w-xl">
            Inspecting outbound communications against ratified brand guidelines, preserving immutable revision histories, and orchestrating human compliance sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <Button variant="secondary" size="sm" onClick={onNavigateToQueue}>
            Review Queue ({queue.length})
          </Button>
          <Button variant="primary" size="sm" onClick={onNewAssetClick}>
            Submit Content
          </Button>
        </div>
      </div>

      {/* KPI Analytical Cards (All Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Compliance Rate */}
        <div
          onClick={onOpenComplianceHealth}
          className="p-4 rounded-xl bg-[#111827] border border-[#253047] space-y-2 hover:border-[#6366F1] transition-all cursor-pointer group"
          title="Click to view detailed compliance index breakdown"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
              Compliance Index
            </span>
            <div className="w-6 h-6 rounded bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F8FAFC] tabular-nums font-mono group-hover:text-[#10B981] transition-colors">
            {complianceRate}%
          </div>
          <div className="text-[11px] text-[#10B981] flex items-center justify-between font-mono">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +2.4% vs previous 30d
            </span>
            <span className="text-[#818CF8] group-hover:underline text-[10px]">Inspect ➔</span>
          </div>
        </div>

        {/* Metric 2: Pending Human Review */}
        <div
          onClick={onNavigateToQueue}
          className="p-4 rounded-xl bg-[#111827] border border-[#253047] space-y-2 hover:border-[#F59E0B] transition-colors cursor-pointer group"
          title="Click to open Human Review Queue"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
              Human Review Queue
            </span>
            <div className="w-6 h-6 rounded bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F8FAFC] tabular-nums font-mono group-hover:text-[#F59E0B] transition-colors">
            {queue.length} Pending
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono flex items-center justify-between">
            <span>Average turnaround: 4.2h</span>
            <span className="text-[#818CF8] group-hover:underline text-[10px]">Review ➔</span>
          </div>
        </div>

        {/* Metric 3: Governed Assets */}
        <div
          onClick={onNavigateToAssets}
          className="p-4 rounded-xl bg-[#111827] border border-[#253047] space-y-2 hover:border-[#3B4866] transition-colors cursor-pointer group"
          title="Click to view Asset Repository"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
              Registered Assets
            </span>
            <div className="w-6 h-6 rounded bg-[#6366F1]/10 text-[#818CF8] flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F8FAFC] tabular-nums font-mono group-hover:text-[#818CF8] transition-colors">
            {assets.length} Active
          </div>
          <div className="text-[11px] text-[#64748B] font-mono flex items-center justify-between">
            <span>Immutable version trees</span>
            <span className="text-[#818CF8] group-hover:underline text-[10px]">Catalog ➔</span>
          </div>
        </div>

        {/* Metric 4: Ratified Brand Sources */}
        <div
          onClick={() => onNavigateToSources()}
          className="p-4 rounded-xl bg-[#111827] border border-[#253047] space-y-2 hover:border-[#6366F1] transition-colors cursor-pointer group"
          title="Click to view Brand Sources"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
              Authoritative Sources
            </span>
            <div className="w-6 h-6 rounded bg-[#253047] text-[#94A3B8] flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#F8FAFC] tabular-nums font-mono group-hover:text-[#6366F1] transition-colors">
            {sources.length} Documents
          </div>
          <div className="text-[11px] text-[#10B981] font-mono flex items-center justify-between">
            <span>100% Policy Consensus</span>
            <span className="text-[#818CF8] group-hover:underline text-[10px]">Sources ➔</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Queue & Category Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgent Review Queue (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">
                    Urgent Content Review Queue
                  </h3>
                </div>
                <button
                  onClick={onNavigateToQueue}
                  className="text-xs text-[#818CF8] hover:text-[#C0C1FF] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View All ({queue.length})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <div className="divide-y divide-[#253047]/60">
              {queue.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No pending assets in the review queue.
                </div>
              ) : (
                queue.slice(0, 3).map(item => (
                  <div
                    key={item.version_id}
                    onClick={() => onSelectAsset(item.asset_id)}
                    className="p-4 hover:bg-[#161E2E]/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#161E2E] border border-[#253047] text-[#818CF8]">
                          {item.channel}
                        </span>
                        <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                          {item.asset_title}
                        </span>
                        <span className="text-xs font-mono text-[#94A3B8]">
                          {item.version_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        Authored by <strong className="text-[#94A3B8]">{item.creator.name}</strong> • SLA remaining: <span className="font-mono text-[#F59E0B] font-medium">{item.sla_hours_remaining.toFixed(1)}h</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge status={item.status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#F8FAFC] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recent Governance Audits */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Recent Content Governance Audits
                </h3>
              </div>
            </CardHeader>
            <div className="divide-y divide-[#253047]/60">
              {assets.map(asset => {
                const latest = asset.versions[asset.versions.length - 1];
                return (
                  <div
                    key={asset.id}
                    onClick={() => onSelectAsset(asset.id)}
                    className="p-4 hover:bg-[#161E2E]/50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors truncate">
                        {asset.title}
                      </div>
                      <div className="text-[11px] text-[#64748B] font-mono flex items-center gap-2">
                        <span>{latest?.version_number}</span>
                        <span>•</span>
                        <span>{new Date(asset.updated_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{asset.channel.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge status={asset.current_status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#F8FAFC] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Sidebar: Policy Domain Breakdown (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#6366F1]" />
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">
                    Rule Enforcement Health
                  </h3>
                </div>
                <button
                  onClick={onOpenComplianceHealth}
                  className="text-xs text-[#818CF8] hover:underline cursor-pointer"
                >
                  Details
                </button>
              </div>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              <div
                onClick={() => onNavigateToSources('legal')}
                className="space-y-1.5 p-2 rounded-lg hover:bg-[#161E2E] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] group-hover:text-[#F8FAFC]">Legal & Disclaimers</span>
                  <span className="font-mono text-[#F8FAFC] font-semibold">98.2%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden border border-[#253047]">
                  <div className="h-full bg-[#10B981] rounded-full" style={{ width: '98.2%' }} />
                </div>
              </div>

              <div
                onClick={() => onNavigateToSources('trademark')}
                className="space-y-1.5 p-2 rounded-lg hover:bg-[#161E2E] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] group-hover:text-[#F8FAFC]">Trademark & Marks</span>
                  <span className="font-mono text-[#F8FAFC] font-semibold">95.0%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden border border-[#253047]">
                  <div className="h-full bg-[#6366F1] rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div
                onClick={() => onNavigateToSources('tone_voice')}
                className="space-y-1.5 p-2 rounded-lg hover:bg-[#161E2E] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] group-hover:text-[#F8FAFC]">Tone & Superlatives</span>
                  <span className="font-mono text-[#F8FAFC] font-semibold">91.4%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden border border-[#253047]">
                  <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: '91.4%' }} />
                </div>
              </div>

              <div
                onClick={() => onNavigateToSources('security')}
                className="space-y-1.5 p-2 rounded-lg hover:bg-[#161E2E] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8] group-hover:text-[#F8FAFC]">Data Security Claims</span>
                  <span className="font-mono text-[#F8FAFC] font-semibold">99.0%</span>
                </div>
                <div className="w-full h-1.5 bg-[#0D1220] rounded-full overflow-hidden border border-[#253047]">
                  <div className="h-full bg-[#10B981] rounded-full" style={{ width: '99%' }} />
                </div>
              </div>

              <div className="pt-3 border-t border-[#253047] text-[11px] text-[#64748B] leading-relaxed flex justify-between items-center">
                <span>Audited against active sources</span>
                <button
                  onClick={() => onNavigateToSources()}
                  className="text-[#818CF8] hover:underline cursor-pointer"
                >
                  Manage Guidelines ➔
                </button>
              </div>
            </CardBody>
          </Card>

          {/* Product Governance Rules Card (Clickable to open explainer modal) */}
          <div
            onClick={onOpenPolicyRules}
            className="p-4 rounded-xl bg-[#0D1220] border border-[#253047] hover:border-[#6366F1] transition-colors cursor-pointer space-y-2 text-xs group"
            title="Click to view all 12 core governance rules"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#6366F1] font-semibold">
                Governance Policy Principles
              </span>
              <HelpCircle className="w-3.5 h-3.5 text-[#818CF8]" />
            </div>
            <ul className="space-y-1 text-[#94A3B8] text-[11px] list-disc list-inside">
              <li>Assets maintain immutable version trees.</li>
              <li>Every saved revision creates a new version.</li>
              <li>A creator must not approve their own content (Rule 6).</li>
              <li>Evidence must link to verified source passages.</li>
            </ul>
            <div className="text-[10px] text-[#818CF8] group-hover:underline pt-1">
              Inspect all 12 platform rules ➔
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
