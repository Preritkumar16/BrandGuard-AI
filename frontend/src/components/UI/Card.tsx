/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  elevated = false,
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded-lg border transition-colors duration-150';
  const surfaceClasses = elevated
    ? 'bg-[#161E2E] border-[#253047]'
    : 'bg-[#111827] border-[#253047]';

  const interactiveClasses = interactive
    ? 'hover:border-[#3B4866] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EA8]'
    : '';

  return (
    <div
      className={`${baseClasses} ${surfaceClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-5 py-4 border-b border-[#253047] flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`px-5 py-3 border-t border-[#253047] bg-[#0D1220]/50 rounded-b-xl flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
