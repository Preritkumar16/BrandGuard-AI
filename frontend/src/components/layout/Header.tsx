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
  onOpenRbacModal?: () => void;
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
  onOpenRbacModal,
  onNotificationsClick,
  unreadNotificationsCount = 0,
  currentUser,
  onLogout,
  onOpenMobileNav,
  perspective,
}) => {
  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-[#253047] bg-white px-3 sm:gap-3 sm:px-4 transition-all duration-200 ${
        collapsed ? 'lg:left-16' : 'lg:left-64'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MobileMenuButton onClick={onOpenMobileNav} />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#94A3B8]">
          <span className="hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#818CF8] sm:flex">
            <Shield aria-hidden="true" className="h-4 w-4" />
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
                <button type="button" onClick={() => onNavigate(crumb.screen)} className="truncate hover:text-[#F8FAFC]">
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
          type="button"
          onClick={onSearchClick}
          aria-label="Search assets and guidelines"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#253047] bg-white text-xs text-[#4B5869] hover:bg-[#F4F6F9] sm:w-auto sm:justify-start sm:gap-2 sm:px-3"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden rounded border border-[#253047] bg-[#F4F6F9] px-1.5 py-0.5 font-mono text-[10px] lg:inline">Ctrl K</kbd>
        </button>
        {currentUser && (
          <button
            type="button"
            onClick={onOpenRbacModal}
            aria-label={`View access rules for ${roleLabel(currentUser.role)}`}
            className="hidden rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EA8] sm:inline-flex"
          >
            <Badge variant="info" size="sm">
              {roleLabel(currentUser.role)}
            </Badge>
          </button>
        )}
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#253047] bg-white text-[#4B5869] hover:bg-[#F4F6F9]"
          aria-label="Notifications"
        >
          <Bell aria-hidden="true" className="h-4 w-4" />
          {unreadNotificationsCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#6366F1]" />}
        </button>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#253047] bg-white text-[#4B5869] hover:bg-[#FEF3F2] hover:text-[#B42318]"
            aria-label="Sign out"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};
