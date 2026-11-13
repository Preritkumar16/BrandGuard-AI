import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'info';
}

const toneClass = {
  default: { value: 'text-[#1B2533]', accent: 'border-l-[#D5DDE7]', surface: 'bg-white' },
  good: { value: 'text-[#087443]', accent: 'border-l-[#087443]', surface: 'bg-[#F3FAF5]' },
  warn: { value: 'text-[#925700]', accent: 'border-l-[#925700]', surface: 'bg-[#FFFAF0]' },
  bad: { value: 'text-[#B42318]', accent: 'border-l-[#B42318]', surface: 'bg-[#FFF6F5]' },
  info: { value: 'text-[#315EA8]', accent: 'border-l-[#315EA8]', surface: 'bg-[#F4F8FD]' },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, hint, tone = 'default' }) => {
  return (
    <div className={`min-h-28 rounded-xl border border-[#DCE2E9] border-l-4 px-4 py-4 shadow-sm ${toneClass[tone].accent} ${toneClass[tone].surface}`}>
      <p className="text-sm font-medium text-[#4B5869]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold leading-none tabular-nums ${toneClass[tone].value}`}>{value}</p>
      {hint && <p className="mt-2 text-xs leading-5 text-[#5C6878]">{hint}</p>}
    </div>
  );
};
