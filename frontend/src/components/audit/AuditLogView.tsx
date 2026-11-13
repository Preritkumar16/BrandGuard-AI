/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, ShieldCheck, Play, ArrowRight, User as UserIcon, Filter, Clock } from 'lucide-react';
import { Asset, User } from '../../types';
import { getAuditPresentation } from './auditPresentation';
import { Badge } from '../UI/Badge';
import { Card } from '../UI/Card';
import { Select } from '../UI/Select';

interface AuditLogViewProps {
  assets: Asset[];
  currentUser: User;
  onSelectAsset: (assetId: string) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  assets,
  currentUser,
  onSelectAsset,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  // Collect all events from asset versions and decisions
  const events: Array<{
    id: string;
    assetId: string;
    assetTitle: string;
    versionNumber: string;
    type: 'decision' | 'version_commit' | 'audit_run';
    author: string;
    title: string;
    details: string;
    status: string;
    timestamp: string;
  }> = [];

  assets.forEach(asset => {
    asset.versions.forEach(v => {
      // Version commit event
      events.push({
        id: `commit-${v.version_id}`,
        assetId: asset.id,
        assetTitle: asset.title,
        versionNumber: v.version_number,
        type: 'version_commit',
        author: v.created_by.name,
        title: `Committed Version ${v.version_number}`,
        details: v.changelog || 'Draft version registered in repository.',
        status: v.audit_status,
        timestamp: v.created_at,
      });

      // Review decision event (if exists)
      if (v.review_decision?.version_id === v.version_id) {
        events.push({
          id: `decision-${v.review_decision.decision_id}`,
          assetId: asset.id,
          assetTitle: asset.title,
          versionNumber: v.version_number,
          type: 'decision',
          author: v.review_decision.reviewer.name,
          title: `Formal Review Decision: ${v.review_decision.decision.replaceAll('_', ' ')}`,
          details: currentUser.role === 'creator'
            ? 'Reviewer notes are unavailable because their visibility is not specified.'
            : v.review_decision.notes,
          status: v.review_decision.decision,
          timestamp: v.review_decision.timestamp,
        });
      }

      // Audit run event
      if (v.audit_summary) {
        const presentation = getAuditPresentation(v);
        events.push({
          id: `audit-${v.version_id}`,
          assetId: asset.id,
          assetTitle: asset.title,
          versionNumber: v.version_number,
          type: 'audit_run',
          author: presentation.kind === 'local'
            ? 'Local rule check'
            : presentation.kind === 'server'
              ? 'Server-confirmed check'
              : 'Audit source not confirmed',
          title: `${presentation.label}: ${v.audit_summary.total_findings} finding(s)`,
          details: `${v.audit_summary.breaches} breaches, ${v.audit_summary.warnings} warnings, ${v.audit_summary.compliant_checks} compliant checks. ${presentation.message}`,
          status: v.audit_status,
          timestamp: v.audit_summary.audit_date,
        });
      }
    });
  });

  // Sort descending by timestamp
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredEvents = events.filter(e => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F8FAFC] md:text-[1.75rem]">
            Activity History
          </h1>
          <p className="mt-1 text-sm leading-5 text-[#4B5869]">
            See content updates, brand checks, and review decisions.
          </p>
        </div>

        <div className="w-48">
          <Select
            options={[
              { value: 'all', label: 'All Event Types' },
              { value: 'decision', label: 'Review Decisions' },
              { value: 'version_commit', label: 'Version Commits' },
              { value: 'audit_run', label: 'Brand Checks' },
            ]}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          />
        </div>
      </div>

      {/* Events Table / Timeline */}
      <Card>
        <div className="divide-y divide-[#253047]/60">
          {filteredEvents.map(event => (
            <button
              type="button"
              key={event.id}
              onClick={() => onSelectAsset(event.assetId)}
              className="w-full p-4 text-left hover:bg-[#161E2E]/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  event.type === 'decision'
                    ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30'
                    : event.type === 'version_commit'
                    ? 'bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/30'
                    : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30'
                }`}>
                  {event.type === 'decision' ? (
                    <ShieldCheck className="w-4 h-4" />
                  ) : event.type === 'version_commit' ? (
                    <History className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                      {event.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D1220] border border-[#253047] text-[#94A3B8]">
                      {event.assetTitle} ({event.versionNumber})
                    </span>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {event.details}
                  </p>

                  <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                    <UserIcon className="w-3 h-3 text-[#64748B]" />
                    <span>Initiated by: <strong className="text-[#94A3B8]">{event.author}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 gap-2">
                <span className="text-[11px] text-[#64748B] font-mono">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#818CF8] group-hover:text-[#C0C1FF]">
                  <span>Inspect Asset</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};
