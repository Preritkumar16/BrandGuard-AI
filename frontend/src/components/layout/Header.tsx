/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Bell, Shield, ChevronRight, LogOut } from 'lucide-react';
import { Badge } from '../UI/Badge';
import { User } from '../../types';
import { AppScreen } from '../../config/navigation';
import { roleLabel } from '../../config/roles';
import { MobileMenuButton } from './Sidebar';

export interface BreadcrumbItem {
  label: string;
  screen?: AppScreen;
}

interface HeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (screen: AppScreen) => void;
  collapsed: boolean;
  onSearchClick: () => void;
  onNotificationsClick: () => void;
  unreadNotificationsCount?: number;
  currentUser?: User;
  onLogout?: () => void;
  onOpenMobileNav: () => void;
  perspective?: string;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs,
  onNavigate,
  collapsed,
  onSearchClick,
  onNotificationsClick,
  unreadNotificationsCount = 0,
  currentUser,
  onLogout,
  onOpenMobileNav,
  perspective,
}) => {
  return (
    <header
      className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[#253047] bg-[#0B0F19]/90 px-4 backdrop-blur-md transition-all duration-200 left-0 ${
        collapsed ? 'lg:left-16' : 'lg:left-64'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MobileMenuButton onClick={onOpenMobileNav} />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#94A3B8]">
          <span className="hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#818CF8] sm:flex">
            <Shield className="h-4 w-4" />
            BrandGuard
          </span>
          {perspective && (
            <>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-[#64748B] sm:block" />
              <span className="hidden truncate text-[#94A3B8] md:inline">{perspective}</span>
            </>
          )}
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.label}-${idx}`}>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
              {crumb.screen && idx < breadcrumbs.length - 1 ? (
                <button onClick={() => onNavigate(crumb.screen!)} className="truncate hover:text-[#F8FAFC]">
                  {crumb.label}
                </button>
              ) : (
                <span className={idx === breadcrumbs.length - 1 ? 'truncate font-semibold text-[#F8FAFC]' : 'truncate'}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onSearchClick}
          className="hidden h-9 items-center gap-2 rounded-lg border border-[#253047] bg-[#111827] px-3 text-xs text-[#94A3B8] hover:text-[#F8FAFC] sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Search audit logs, assets...</span>
          <kbd className="hidden rounded border border-[#253047] bg-[#161E2E] px-1.5 py-0.5 font-mono text-[10px] lg:inline">⌘K</kbd>
        </button>
        {currentUser && (
          <Badge variant="info" size="sm">
            {roleLabel(currentUser.role)}
          </Badge>
        )}
        <button
          onClick={onNotificationsClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#253047] bg-[#111827] text-[#94A3B8]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#6366F1]" />}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#253047] bg-[#111827] text-[#64748B] hover:text-[#FB7185]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};
