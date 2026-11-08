/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center p-1 bg-[#0D1220] border border-[#253047] rounded-lg ${className}`}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#161E2E] text-[#F8FAFC] shadow-xs border border-[#253047]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isActive
                      ? 'bg-[#6366F1]/20 text-[#818CF8]'
                      : 'bg-[#253047] text-[#94A3B8]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex border-b border-[#253047] gap-6 ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 pb-3 text-xs font-medium transition-colors relative cursor-pointer ${
              isActive
                ? 'text-[#F8FAFC] font-semibold'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  isActive
                    ? 'bg-[#6366F1]/20 text-[#818CF8] border border-[#6366F1]/30'
                    : 'bg-[#253047] text-[#94A3B8]'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1] rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
