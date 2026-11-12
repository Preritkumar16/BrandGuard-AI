/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ShieldX, UserX, ShieldAlert } from 'lucide-react';
import { AssetVersion, User } from '../../types';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { Textarea } from '../UI/Input';
import { Badge } from '../UI/Badge';
import { can } from '../../config/permissions';
import { roleLabel } from '../../config/roles';

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: AssetVersion;
  currentUser: User;
  onSubmitDecision: (decision: 'approved' | 'rejected' | 'revision_requested', notes: string) => Promise<void>;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  isOpen,
  onClose,
  version,
  currentUser,
  onSubmitDecision,
}) => {
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'revision_requested'>('approved');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approval = can(currentUser, 'approve_asset', version.created_by.id);
  const canDecide = can(currentUser, 'review_decision').allowed;
  const isCreatorConflict = currentUser.id === version.created_by.id;
  const canApprove = approval.allowed;

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError('A formal compliance rationale or reviewer notes are required.');
      return;
    }
    if (decision === 'approved' && isCreatorConflict) {
      setError('Rule 6 Enforcement: A creator cannot approve their own content. Please assign an independent brand reviewer.');
      return;
    }
    if (!canDecide) {
      setError(can(currentUser, 'review_decision').reason || 'This role cannot record a review decision.');
      return;
    }
    if (decision === 'approved' && !canApprove) {
      setError(approval.reason || 'This role cannot approve this asset.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmitDecision(decision, notes);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Governance Decision"
      description={`Asset Version: ${version.version_number} • Author: ${version.created_by.name}`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant={decision === 'rejected' ? 'destructive' : 'primary'}
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={decision === 'approved' && !canApprove}
          >
            Confirm Decision Record
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* User Role Badge */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0D1220] border border-[#253047] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#94A3B8]">Reviewer Persona:</span>
            <span className="font-semibold text-[#F8FAFC]">{currentUser.name}</span>
          </div>
          <Badge variant={canApprove ? 'compliant' : 'warning'} size="sm">
            {roleLabel(currentUser.role)}
          </Badge>
        </div>

        {/* Creator Role Restriction Banner */}
        {!canApprove && (
          <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Approval is not available</strong>
              {approval.reason || 'This account cannot approve this version. The backend must enforce the same restriction.'}
            </div>
          </div>
        )}

        {/* Rule 6 Conflict Banner if author */}
        {isCreatorConflict && (
          <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-start gap-2.5">
            <UserX className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Governance Conflict of Interest (Rule 6)</strong>
              You are the original author of this asset version. Even with reviewer/admin permissions, creators cannot approve their own content. Escalation to an independent brand steward is required.
            </div>
          </div>
        )}

        {/* Decision Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#94A3B8]">
            Decision Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={!canApprove}
              onClick={() => {
                setDecision('approved');
                setError(null);
              }}
              className={`p-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                decision === 'approved'
                  ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
                  : 'bg-[#111827] border-[#253047] text-[#94A3B8] hover:text-[#F8FAFC]'
              } ${!canApprove ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDecision('revision_requested');
                setError(null);
              }}
              className={`p-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                decision === 'revision_requested'
                  ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-[#F59E0B]'
                  : 'bg-[#111827] border-[#253047] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Request Revisions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDecision('rejected');
                setError(null);
              }}
              className={`p-3 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                decision === 'rejected'
                  ? 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
                  : 'bg-[#111827] border-[#253047] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <ShieldX className="w-4 h-4" />
              <span>Reject</span>
            </button>
          </div>
        </div>

        {/* Audit Trail Notes */}
        <Textarea
          label="Governance Review Notes (Immutable Audit Trail)"
          placeholder="Document the legal rationale, verified source passages, or required changes..."
          rows={4}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          error={error || undefined}
        />

        <div className="text-[11px] text-[#64748B] font-mono">
          Reviewer: <span className="text-[#94A3B8]">{currentUser.name} ({currentUser.title})</span> • Cryptographically recorded on approval ledger.
        </div>
      </div>
    </Modal>
  );
};
