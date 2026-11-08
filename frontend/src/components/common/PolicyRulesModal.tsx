/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PolicyRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyRulesModal: React.FC<PolicyRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const rules = [
    { num: 1, title: 'Brand Source Versioning', desc: 'Brand sources have immutable versions, passage indexes, and explicit approval statuses.' },
    { num: 2, title: 'Asset Immutability', desc: 'Assets maintain an append-only version tree. Previous versions are permanently preserved.' },
    { num: 3, title: 'Revision Commit Rule', desc: 'Every saved revision generates a new asset version (e.g. v1.1 ➔ v1.2) with a mandatory changelog.' },
    { num: 4, title: 'Non-Transferable Approval', desc: "An earlier version's approval does not automatically approve a newer revision." },
    { num: 5, title: 'Version-Bound Decisions', desc: 'Human review decisions are cryptographically linked to the exact asset version snapshot.' },
    { num: 6, title: 'Separation of Duties (Conflict Rule)', desc: 'A creator must not approve their own content. Mandatory independent human review required.' },
    { num: 7, title: 'Evidence-Linked Findings', desc: 'Every flag must link to a verbatim source passage and confidence score.' },
    { num: 8, title: 'Missing Evidence Discipline', desc: 'Missing evidence must never be represented as an active contradiction.' },
    { num: 9, title: 'Honest Processing', desc: 'Failed, incomplete, or unavailable audits must never be displayed as compliant.' },
    { num: 10, title: 'Human in the Loop', desc: 'Human reviewers make the final authoritative approval decision.' },
    { num: 11, title: 'No Silent Overwrites', desc: 'Suggested guideline replacements must be consciously staged into a new version, never silently overwritten.' },
    { num: 12, title: 'Transparent Uncertainty', desc: 'Model uncertainty and unverified claims must be surfaced transparently.' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Brand Governance Core Principles & Operating Rules"
      description="The 12 authoritative business and compliance laws enforced by BrandGuard AI"
      maxWidth="3xl"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Acknowledge & Close
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {rules.map(rule => (
          <div
            key={rule.num}
            className="p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#818CF8] font-mono text-[10px] flex items-center justify-center font-bold">
                {rule.num}
              </span>
              <h4 className="text-xs font-semibold text-[#F8FAFC]">
                {rule.title}
              </h4>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed pl-7">
              {rule.desc}
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
};
