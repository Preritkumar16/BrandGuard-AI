/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const describedBy = [props['aria-describedby'], error ? `${inputId}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#4B5869]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div aria-hidden="true" className="absolute left-3 text-[#64748B] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full h-10 rounded-md bg-white border text-sm text-[#1B2533] placeholder-[#667282] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#315EA8] focus-visible:ring-2 focus-visible:ring-[#315EA8]/20 ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightIcon ? 'pr-9' : 'pr-3'} ${
              error ? 'border-[#EF4444]' : 'border-[#253047]'
            } ${className}`}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            {...props}
          />
          {rightIcon && (
            <div aria-hidden="true" className="absolute right-3 text-[#64748B] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p id={`${inputId}-error`} className="text-sm text-[#B42318] mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const describedBy = [props['aria-describedby'], error ? `${textareaId}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[#4B5869]"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={`w-full rounded-md bg-white border p-3 text-sm text-[#1B2533] placeholder-[#667282] transition-colors duration-150 focus-visible:outline-none focus-visible:border-[#315EA8] focus-visible:ring-2 focus-visible:ring-[#315EA8]/20 ${
            error ? 'border-[#EF4444]' : 'border-[#253047]'
          } ${className}`}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error && <p id={`${textareaId}-error`} className="text-sm text-[#B42318] mt-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
