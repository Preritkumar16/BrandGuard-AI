import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'info';
}

const toneClass = {
  default: 'text-[#F8FAFC]',
  good: 'text-[#34D399]',
  warn: 'text-[#F59E0B]',
  bad: 'text-[#FB7185]',
  info: 'text-[#818CF8]',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, hint, tone = 'default' }) => {
  return (
    <div className="rounded-xl border border-[#253047] bg-[#111827] px-4 py-3">
      <p className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-[#94A3B8]">{hint}</p>}
    </div>
  );
};
