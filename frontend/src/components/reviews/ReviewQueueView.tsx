/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Inbox,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  UserX,
  CheckCircle2,
} from 'lucide-react';
import { ReviewQueueItem, User } from '../../types';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

interface ReviewQueueViewProps {
  queue: ReviewQueueItem[];
  currentUser: User;
  onSelectQueueItem: (assetId: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({
  queue,
  currentUser,
  onSelectQueueItem,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filteredQueue = queue.filter(item => {
    if (priorityFilter === 'all') return true;
    return item.priority === priorityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            Human Review Queue
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Product Rule 10: Human reviewers make the final approval decision. Review SLA targets are actively tracked.
          </p>
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#111827] border border-[#253047] rounded-lg">
          {(['all', 'high', 'medium'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer ${
                priorityFilter === p
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#253047]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {p} Priority
            </button>
          ))}
        </div>
      </div>

      {/* SLA Alert Strip */}
      <div className="p-3.5 rounded-xl bg-[#0D1220] border border-[#253047] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[#F8FAFC]">
            Average Governance Decision Turnaround: <strong className="font-mono text-[#F59E0B]">4.2 Hours</strong>
          </span>
        </div>
        <span className="text-[11px] text-[#64748B] font-mono">
          Target SLA: 24.0 Hours
        </span>
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {filteredQueue.length === 0 ? (
          <Card>
            <div className="p-12 text-center text-[#64748B]">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[#10B981] mb-2 opacity-80" />
              <div className="text-sm font-semibold text-[#F8FAFC]">Review Queue Clear</div>
              <p className="text-xs text-[#94A3B8] mt-1">
                All submitted content versions have received formal human governance decisions.
              </p>
            </div>
          </Card>
        ) : (
          filteredQueue.map(item => {
            const isCreatorConflict = currentUser.id === item.creator.id;

            return (
              <button
                type="button"
                key={item.version_id}
                onClick={() => onSelectQueueItem(item.asset_id)}
                className="w-full p-5 rounded-xl bg-[#111827] border border-[#253047] text-left hover:border-[#3B4866] transition-colors cursor-pointer space-y-4 group"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded bg-[#161E2E] border border-[#253047] text-[#818CF8]">
                      {item.channel.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                      {item.asset_title}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0D1220] border border-[#253047] text-[#94A3B8]">
                      {item.version_number}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-[#F59E0B] font-mono bg-[#F59E0B]/10 px-2.5 py-1 rounded border border-[#F59E0B]/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.sla_hours_remaining.toFixed(1)}h remaining</span>
                    </div>
                    <Badge status={item.status} size="sm" />
                  </div>
                </div>

                {/* Conflict Banner if current user is the creator */}
                {isCreatorConflict && (
                  <div className="p-2.5 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/25 text-xs text-[#EF4444] flex items-center gap-2">
                    <UserX className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Rule 6 Notice:</strong> You authored this asset. You may inspect the findings, but an independent reviewer must approve it.
                    </span>
                  </div>
                )}

                {/* Details Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B] pt-2 border-t border-[#253047]/60">
                  <div className="flex items-center gap-4">
                    <span>
                      Submitted by: <strong className="text-[#F8FAFC]">{item.creator.name}</strong>
                    </span>
                    <span>
                      Submitted: <span className="font-mono text-[#94A3B8]">{new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    {item.breach_count > 0 && (
                      <span className="text-[#EF4444] font-semibold font-mono">
                        {item.breach_count} Breaches
                      </span>
                    )}
                    {item.warning_count > 0 && (
                      <span className="text-[#F59E0B] font-semibold font-mono">
                        {item.warning_count} Warnings
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[#818CF8] group-hover:text-[#C0C1FF] font-medium">
                    <span>Open Review Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
