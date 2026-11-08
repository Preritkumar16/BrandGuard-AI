/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-[#94A3B8] tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full h-9 appearance-none rounded-md bg-[#0D1220] border text-sm text-[#F8FAFC] pl-3 pr-8 transition-colors duration-150 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] cursor-pointer ${
              error ? 'border-[#EF4444]' : 'border-[#253047]'
            } ${className}`}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[#111827] text-[#F8FAFC]">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 text-[#64748B] pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-[#EF4444] mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
