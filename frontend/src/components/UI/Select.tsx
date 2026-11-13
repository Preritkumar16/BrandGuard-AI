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
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const describedBy = [props['aria-describedby'], error ? `${selectId}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[#4B5869]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full h-10 appearance-none rounded-md bg-white border text-sm text-[#1B2533] pl-3 pr-8 transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#315EA8] focus-visible:ring-2 focus-visible:ring-[#315EA8]/20 cursor-pointer ${
              error ? 'border-[#EF4444]' : 'border-[#253047]'
            } ${className}`}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div aria-hidden="true" className="absolute right-2.5 text-[#64748B] pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p id={`${selectId}-error`} className="text-sm text-[#B42318] mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
