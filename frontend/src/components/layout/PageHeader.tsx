import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions }) => {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-xs font-medium text-[#818CF8]">{eyebrow}</p>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-[#F8FAFC] md:text-2xl">{title}</h1>
        {description && <p className="max-w-3xl text-xs leading-relaxed text-[#94A3B8]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};
