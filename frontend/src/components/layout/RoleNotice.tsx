import React from 'react';
import { Info } from 'lucide-react';

export const RoleNotice: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 px-3 py-2 text-[11px] leading-relaxed text-[#C7D2FE]">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
};
