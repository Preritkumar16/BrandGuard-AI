/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Inbox,
  FileText,
  BookOpen,
  Sliders,
  ChevronDown,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  History,
  Shield,
  Users,
  Upload,
  ScrollText,
  Menu,
  X,
} from 'lucide-react';
import { User } from '../../types';
import { authService } from '../../services/API/authService';
import { AppScreen, NavItem } from '../../config/navigation';
import { roleLabel } from '../../config/roles';

interface SidebarProps {
  items: NavItem[];
  currentScreen: AppScreen;
  onSelectScreen: (screen: AppScreen) => void;
  currentUser: User;
  onUserChanged: (user: User) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  roleSupported?: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="h-4 w-4" />,
  assets: <FileText className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  roles: <Shield className="h-4 w-4" />,
  sources: <BookOpen className="h-4 w-4" />,
  activity: <History className="h-4 w-4" />,
  settings: <Sliders className="h-4 w-4" />,
  submit: <Upload className="h-4 w-4" />,
  'asset-workspace': <FileText className="h-4 w-4" />,
  queue: <Inbox className="h-4 w-4" />,
  findings: <ShieldCheck className="h-4 w-4" />,
  reports: <ScrollText className="h-4 w-4" />,
  'source-upload': <Upload className="h-4 w-4" />,
  'source-detail': <BookOpen className="h-4 w-4" />,
  'source-history': <History className="h-4 w-4" />,
  feedback: <ScrollText className="h-4 w-4" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  items = [],
  currentScreen,
  onSelectScreen,
  currentUser,
  onUserChanged,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  roleSupported = true,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Protect the component if a missing or invalid value is passed at runtime.
  const safeItems: NavItem[] = Array.isArray(items) ? items : [];

  const availableUsers = authService.getAvailableUsers();

  const sections = safeItems.reduce<string[]>((list, item) => {
    if (item?.section && !list.includes(item.section)) {
      list.push(item.section);
    }
    return list;
  }, []);

  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          aria-label="Close navigation"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 flex w-64 flex-col border-r border-[#253047] bg-[#0D1220] transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#253047] px-4">
          <button
            type="button"
            onClick={() => onSelectScreen('dashboard')}
            aria-label="BrandGuard AI home"
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 text-[#6366F1]">
              <ShieldCheck className="h-5 w-5" />
            </div>

            {!collapsed && (
              <span className="truncate text-sm font-semibold text-[#F8FAFC]">
                BrandGuard AI
              </span>
            )}
          </button>

          <button
          onClick={onToggleCollapse}
            className="hidden rounded p-1 text-[#64748B] hover:bg-[#161E2E] hover:text-[#F8FAFC] lg:flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={onCloseMobile}
            className="rounded p-1 text-[#94A3B8] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-3 overflow-y-auto p-3">
          {sections.map(section => (
            <div key={section}>
              {!collapsed && (
                <p className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                  {section}
                </p>
              )}

              <div className="space-y-1">
                {safeItems
                  .filter(item => item?.section === section)
                  .map(item => {
                    const active = currentScreen === item.id;

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => onSelectScreen(item.id)}
                        aria-current={active ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={`flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium ${
                          active
                            ? 'border border-[#253047] bg-[#161E2E] text-[#F8FAFC]'
                            : 'text-[#94A3B8] hover:bg-[#161E2E]/60 hover:text-[#F8FAFC]'
                        }`}
                      >
                        <span
                          className={
                            active ? 'text-[#6366F1]' : 'text-[#64748B]'
                          }
                        >
                          {ICONS[item.id] ?? (
                            <LayoutDashboard className="h-4 w-4" />
                          )}
                        </span>

                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
            ))}
        </nav>

        <div className="relative border-t border-[#253047] p-3">
          {!collapsed && (
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              Active perspective
            </p>
          )}

          <button
            type="button"
            onClick={() => setUserDropdownOpen(open => !open)}
            aria-expanded={userDropdownOpen && !collapsed}
            aria-haspopup="menu"
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#253047] bg-[#111827] p-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#6366F1]/40 bg-[#6366F1]/20 text-[10px] font-semibold text-[#818CF8]">
                {currentUser.avatar ||
                  currentUser.name.slice(0, 2).toUpperCase()}
              </span>

              {!collapsed && (
                <span className="min-w-0 text-left">
                  <span className="block truncate text-xs font-medium text-[#F8FAFC]">
                    {currentUser.name}
                  </span>
                  <span className="block truncate text-[10px] text-[#94A3B8]">
                    {roleLabel(currentUser.role)}
                  </span>
                </span>
              )}
            </span>

            {!collapsed && (
              <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" />
            )}
          </button>

          {userDropdownOpen && !collapsed && (
            <div role="menu" className="absolute bottom-16 left-3 right-3 z-50 space-y-1 rounded-lg border border-[#253047] bg-[#161E2E] p-1 shadow-lg">
              <p className="border-b border-[#253047] px-2 py-1 text-[10px] uppercase text-[#64748B]">
                Preview persona
              </p>

              {availableUsers.map(user => (
                <button
                  type="button"
                  role="menuitem"
                  key={user.id}
                  onClick={async () => {
                    const switched = await authService.switchUser(user.id);
                    onUserChanged(switched);
                    setUserDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs ${
                    user.id === currentUser.id
                      ? 'bg-[#6366F1]/20 text-[#C7D2FE]'
                      : 'text-[#94A3B8] hover:bg-[#253047]/50'
                  }`}
                >
                  <span>
                    <span className="block text-[#F8FAFC]">{user.name}</span>
                    <span className="block text-[10px] text-[#64748B]">
                      {user.title}
                    </span>
                  </span>

                  {user.id === currentUser.id && (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>
          )}

          {!roleSupported && !collapsed && (
            <p className="mt-2 text-[10px] leading-relaxed text-[#F59E0B]">
              This role was not recognised. Showing the narrowest workspace.
            </p>
          )}

        </div>
      </aside>
    </>
  );
};

export const MobileMenuButton: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#253047] bg-[#111827] text-[#94A3B8] lg:hidden"
      aria-label="Open navigation"
    >
      <Menu className="h-4 w-4" />
    </button>
  );
};