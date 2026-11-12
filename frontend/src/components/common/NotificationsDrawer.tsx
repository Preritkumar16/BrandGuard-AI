/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Bell, Clock, AlertTriangle, ShieldCheck, BookOpen, ArrowRight, Check } from 'lucide-react';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';

export interface NotificationItem {
  id: string;
  type: 'review_sla' | 'breach_alert' | 'source_update' | 'approval';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  assetId?: string;
  sourceId?: string;
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onNavigateToAsset: (assetId: string) => void;
  onNavigateToSource: (sourceId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onNavigateToAsset,
  onNavigateToSource,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-[#111827] border-l border-[#253047] shadow-[0_12px_32px_-4px_rgba(0,0,0,0.85)] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#253047] bg-[#0D1220] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#818CF8]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#F8FAFC]">
              Governance Audit Alerts
            </h3>
            <p className="text-[10px] text-[#94A3B8]">
              {notifications.filter(n => !n.read).length} Unread notifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
            Mark all read
          </Button>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#161E2E] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2.5 text-xs">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">
            No active audit notifications.
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                if (n.assetId) {
                  onNavigateToAsset(n.assetId);
                  onClose();
                } else if (n.sourceId) {
                  onNavigateToSource(n.sourceId);
                  onClose();
                }
              }}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-1.5 ${
                !n.read
                  ? 'bg-[#161E2E] border-[#3B4866]'
                  : 'bg-[#0D1220]/60 border-[#253047] hover:border-[#3B4866]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />}
                  <span className="font-semibold text-[#F8FAFC]">{n.title}</span>
                </div>
                <span className="text-[10px] text-[#64748B] font-mono">{n.timestamp}</span>
              </div>

              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                {n.description}
              </p>

              <div className="pt-1 flex items-center justify-between text-[11px] text-[#818CF8]">
                <span className="flex items-center gap-1 text-[10px] uppercase font-mono text-[#64748B]">
                  {n.type.replace('_', ' ')}
                </span>
                <span className="flex items-center gap-1 hover:underline">
                  Inspect <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#253047] bg-[#0D1220] flex items-center justify-between text-[11px] text-[#64748B]">
        <span>SLA Threshold: 24h</span>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
};
