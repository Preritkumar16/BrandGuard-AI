/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EA8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none cursor-pointer';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-9',
    md: 'text-sm px-4 py-2 gap-2 h-10',
    lg: 'text-sm px-5 py-2.5 gap-2.5 h-11',
  };

  const variantClasses = {
    primary: 'bg-[#315EA8] text-white hover:bg-[#274E8A]',
    secondary:
      'bg-white border border-[#D5DDE7] text-[#243247] hover:border-[#9AA9BC] hover:bg-[#F4F6F9]',
    ghost:
      'bg-transparent text-[#4B5869] hover:text-[#1B2533] hover:bg-[#EEF1F5]',
    outline:
      'bg-white border border-[#D5DDE7] text-[#4B5869] hover:text-[#1B2533] hover:border-[#9AA9BC] hover:bg-[#F4F6F9]',
    destructive:
      'bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] hover:bg-[#FEE4E2]',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
