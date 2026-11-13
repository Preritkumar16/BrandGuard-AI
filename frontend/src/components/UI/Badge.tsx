/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComplianceStatus, FindingSeverity } from '../../types';

export interface BadgeProps {
  variant?: 
    | 'compliant' 
    | 'warning' 
    | 'breach' 
    | 'info' 
    | 'neutral' 
    | 'in_review';
  status?: ComplianceStatus | FindingSeverity;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  status,
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  // Determine variant from status if variant not explicitly provided
  let computedVariant: 'compliant' | 'warning' | 'breach' | 'info' | 'neutral' | 'in_review' = 'neutral';

  if (variant) {
    computedVariant = variant;
  } else if (status) {
    switch (status) {
      case 'approved':
      case 'compliant':
        computedVariant = 'compliant';
        break;
      case 'review_required':
      case 'warning':
        computedVariant = 'warning';
        break;
      case 'breach':
      case 'rejected':
      case 'failed':
        computedVariant = 'breach';
        break;
      case 'in_review':
        computedVariant = 'in_review';
        break;
      case 'unavailable':
      case 'unverified':
      case 'deprecated':
      case 'draft':
      default:
        computedVariant = 'neutral';
        break;
    }
  }

  const variantStyles = {
    compliant: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25',
    breach: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25',
    info: 'bg-[#6366F1]/10 text-[#818CF8] border-[#6366F1]/25',
    in_review: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/25',
    neutral: 'bg-[#64748B]/10 text-[#94A3B8] border-[#64748B]/25',
  };

  const sizeStyles = {
    sm: 'min-h-5 px-2 text-[10px]',
    md: 'min-h-6 px-2.5 text-[11px]',
  };

  const label = children || (status ? status.replaceAll('_', ' ') : '');

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium capitalize leading-5 tabular-nums select-none ${sizeStyles[size]} ${variantStyles[computedVariant]} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};
