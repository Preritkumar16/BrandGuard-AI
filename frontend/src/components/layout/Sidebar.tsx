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
  Layers,
  ChevronLeft,
  ChevronRight,
  History,
  Check,
  Shield,
} from 'lucide-react';
import { User } from '../../types';
import { authService } from '../../services/API/authService';

export type NavTab = 'dashboard' | 'governance-hub' | 'queue' | 'assets' | 'sources' | 'asset-detail' | 'audit-log' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  queueCount: number;
  currentUser: User;
  onUserChanged: (user: User) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenRbacModal?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  queueCount,
  currentUser,
  onUserChanged,
  collapsed,
  onToggleCollapse,
  onOpenRbacModal,
  onLogout,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('Acme Global Enterprise');

  const availableUsers = authService.getAvailableUsers();

  const workspaces = [
    { id: 'global', name: 'Acme Global Enterprise', tag: 'Production' },
    { id: 'emea', name: 'Acme Cloud EMEA', tag: 'Sovereign' },
    { id: 'federal', name: 'Acme Federal Defense', tag: 'GovCloud' },
  ];

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Console Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'governance-hub' as NavTab,
      label: 'Governance Hub',
      icon: <Shield className="w-4 h-4 text-[#818CF8]" />,
    },
    {
      id: 'queue' as NavTab,
      label: 'Review Queue',
      icon: <Inbox className="w-4 h-4" />,
      badge: queueCount > 0 ? queueCount : undefined,
      badgeColor: 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30',
    },
    {
      id: 'assets' as NavTab,
      label: 'Asset Repository',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'sources' as NavTab,
      label: 'Brand Sources',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'audit-log' as NavTab,
      label: 'Audit Trail & Log',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'settings' as NavTab,
      label: 'Engine Settings',
      icon: <Sliders className="w-4 h-4" />,
    },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0D1220] border-r border-[#253047] flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-[#253047] flex items-center justify-between">
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-3 overflow-hidden cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1] shrink-0 shadow-[0_0_12px_-2px_rgba(99,102,241,0.25)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <span className="font-semibold text-sm tracking-tight text-[#F8FAFC]">
                BrandGuard AI
              </span>
              <span className="block text-[10px] text-[#64748B] tracking-wider uppercase font-medium">
                Governance Platform
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#161E2E] transition-colors cursor-pointer hidden md:flex items-center justify-center"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Scope / Workspace Switcher Dropdown */}
      {!collapsed && (
        <div className="p-3 border-b border-[#253047] relative">
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#111827] border border-[#253047] text-xs hover:border-[#3B4866] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Layers className="w-3.5 h-3.5 text-[#6366F1]" />
              <span className="font-medium text-[#F8FAFC] truncate">{activeWorkspace}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute top-12 left-3 right-3 bg-[#161E2E] border border-[#253047] rounded-lg shadow-xl p-1 z-50 space-y-1">
              <div className="px-2 py-1 text-[10px] text-[#64748B] uppercase font-semibold border-b border-[#253047]">
                Select Brand Scope
              </div>
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws.name);
                    setWorkspaceDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer ${
                    activeWorkspace === ws.name
                      ? 'bg-[#6366F1]/20 text-[#818CF8] font-medium'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#253047]/50'
                  }`}
                >
                  <span>{ws.name}</span>
                  <span className="text-[10px] text-[#64748B] font-mono">{ws.tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-semibold tracking-wider text-[#64748B] px-2.5 py-1.5">
          {!collapsed ? 'Governance Controls' : '•'}
        </div>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#253047] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161E2E]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-[#6366F1]' : 'text-[#64748B]'}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
              {!collapsed && item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${item.badgeColor || 'bg-[#253047] text-[#94A3B8]'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role / User Simulation Panel */}
      <div className="p-3 border-t border-[#253047] relative">
        {!collapsed && (
          <div className="text-[10px] uppercase font-semibold tracking-wider text-[#64748B] px-1 mb-2 flex items-center justify-between">
            <span>Active Persona</span>
            <span className="text-[9px] text-[#6366F1] font-mono">Rule 6 Tester</span>
          </div>
        )}

        <button
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className={`w-full flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-[#253047] hover:border-[#3B4866] transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title={`${currentUser.name} (${currentUser.role})`}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-[#6366F1]/20 border border-[#6366F1]/40 flex items-center justify-center text-xs font-semibold text-[#818CF8] shrink-0">
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="text-left truncate">
                <div className="text-xs font-medium text-[#F8FAFC] truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-[#94A3B8] truncate capitalize flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    currentUser.role === 'reviewer' ? 'bg-[#10B981]' : 'bg-[#6366F1]'
                  }`} />
                  {currentUser.role}
                </div>
              </div>
            )}
          </div>
          {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />}
        </button>

        {/* User Switcher Dropdown */}
        {userDropdownOpen && !collapsed && (
          <div className="absolute bottom-16 left-3 right-3 bg-[#161E2E] border border-[#253047] rounded-lg shadow-xl p-1 z-50 space-y-1">
            <div className="px-2 py-1 text-[10px] text-[#64748B] uppercase font-semibold border-b border-[#253047] mb-1">
              Switch Persona for Approval Rules
            </div>
            {availableUsers.map(user => (
              <button
                key={user.id}
                onClick={async () => {
                  const switched = await authService.switchUser(user.id);
                  onUserChanged(switched);
                  setUserDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-xs transition-colors cursor-pointer ${
                  user.id === currentUser.id
                    ? 'bg-[#6366F1]/20 text-[#818CF8] font-medium'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#253047]/50'
                }`}
              >
                <div>
                  <div className="text-xs text-[#F8FAFC] font-medium">{user.name}</div>
                  <div className="text-[10px] text-[#64748B]">{user.title}</div>
                </div>
                {user.id === currentUser.id && <UserCheck className="w-3.5 h-3.5 text-[#6366F1]" />}
              </button>
            ))}
          </div>
        )}
        {/* RBAC & Sign Out Controls */}
        {!collapsed && (
          <div className="mt-2 pt-2 border-t border-[#253047]/60 flex items-center justify-between text-xs">
            {onOpenRbacModal && (
              <button
                onClick={onOpenRbacModal}
                className="text-[11px] text-[#818CF8] hover:text-[#C0C1FF] flex items-center gap-1 font-mono transition-colors cursor-pointer"
              >
                <span>RBAC Matrix</span>
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-[11px] text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-[#253047] flex items-center justify-between text-[10px] text-[#64748B] tabular-nums font-mono">
          <span>v2.4.0-sentinel</span>
          <span className="flex items-center gap-1 text-[#10B981]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            ENGINE READY
          </span>
        </div>
      )}
    </aside>
  );
};
