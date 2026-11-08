/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#253047] rounded-xl bg-[#0D1220]/40">
      <div className="w-12 h-12 rounded-lg bg-[#161E2E] border border-[#253047] flex items-center justify-center text-[#94A3B8] mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1">{title}</h3>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse bg-[#161E2E] rounded border border-[#253047]/50 ${className}`} />
  );
};
