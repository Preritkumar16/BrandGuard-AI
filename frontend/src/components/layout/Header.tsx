/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Plus, Bell, Shield, ChevronRight, LogOut, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { User } from '../../types';
import { NavTab } from './Sidebar';

export interface BreadcrumbItem {
  label: string;
  tab?: NavTab;
}

interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigateTab: (tab: NavTab) => void;
  onNewAssetClick: () => void;
  collapsed: boolean;
  onSearchClick: () => void;
  onNotificationsClick: () => void;
  unreadNotificationsCount?: number;
  currentUser?: User;
  onOpenRbacModal?: () => void;
  onLogout?: () => void;
  currentTab?: NavTab;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs,
  onNavigateTab,
  onNewAssetClick,
  collapsed,
  onSearchClick,
  onNotificationsClick,
  unreadNotificationsCount = 2,
  currentUser,
  onOpenRbacModal,
  onLogout,
  currentTab = 'dashboard',
}) => {
  return (
    <header
      className={`h-16 fixed top-0 right-0 z-30 bg-[#0B0F19]/90 backdrop-blur-md border-b border-[#253047] flex items-center justify-between px-6 transition-all duration-200 ${
        collapsed ? 'left-16' : 'left-64'
      }`}
    >
      {/* Clean Hierarchical Breadcrumb Navigation (Non-repetitive) */}
      <div className="flex items-center gap-3 min-w-0">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
          <div className="flex items-center gap-1.5 text-[#6366F1] font-semibold shrink-0">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-[#818CF8]">BrandGuard</span>
          </div>

          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.label}-${idx}`}>
              <ChevronRight className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
              {crumb.tab && idx < breadcrumbs.length - 1 ? (
                <button
                  onClick={() => onNavigateTab(crumb.tab!)}
                  className="hover:text-[#F8FAFC] transition-colors cursor-pointer hover:underline underline-offset-2 shrink-0"
                >
                  {crumb.label}
                </button>
              ) : (
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'text-[#F8FAFC] font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md'
                      : 'text-[#94A3B8]'
                  }
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right controls: Cleanly aligned with h-9 height */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Search - Perfectly vertically aligned icon and badge */}
        <button
          onClick={onSearchClick}
          className="hidden sm:flex items-center justify-between h-9 px-3 w-60 md:w-72 lg:w-80 rounded-lg bg-[#111827] border border-[#253047] text-xs text-[#94A3B8] hover:border-[#3B4866] hover:text-[#F8FAFC] transition-colors cursor-pointer group"
          title="Search guidelines, rules, copy, or audit findings (⌘K)"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#94A3B8] shrink-0" />
            <span className="truncate">Search guidelines, rules, copy...</span>
          </div>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#161E2E] border border-[#253047] rounded text-[#64748B] shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* RBAC Matrix Trigger Button */}
        {onOpenRbacModal && currentUser && (
          <button
            onClick={onOpenRbacModal}
            className="hidden lg:flex items-center gap-2 h-9 px-2.5 rounded-lg bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            title="Inspect Role-Based Access Control matrix"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#818CF8]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#64748B]">Role</span>
            <Badge
              variant={
                currentUser.role === 'admin'
                  ? 'info'
                  : currentUser.role === 'reviewer'
                  ? 'compliant'
                  : 'warning'
              }
              size="sm"
            >
              {currentUser.role}
            </Badge>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          onClick={onNotificationsClick}
          className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-[#111827] border border-[#253047] text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#3B4866] hover:bg-[#161E2E] transition-colors cursor-pointer"
          title="Audit alerts & SLA notifications"
          aria-label="Audit alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#6366F1] shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
          )}
        </button>

        {/* Primary Action: Submit New Asset */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={onNewAssetClick}
          className="h-9 px-3.5"
        >
          Submit Content
        </Button>

        {/* Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#111827] border border-[#253047] text-[#64748B] hover:text-[#EF4444] hover:border-[#EF4444]/40 hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
            title="Sign out of BrandGuard AI console"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
