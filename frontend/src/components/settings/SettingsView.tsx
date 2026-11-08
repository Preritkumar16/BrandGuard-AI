/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Shield, Save, Check, Bell, Lock, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { User } from '../../types';

interface SettingsViewProps {
  currentUser?: User;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const [slaHours, setSlaHours] = useState('24.0');
  const [engineStrictness, setEngineStrictness] = useState('strict');
  const [enforceRule6, setEnforceRule6] = useState(true);
  const [requireDisclaimerFootnotes, setRequireDisclaimerFootnotes] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = () => {
    if (!isAdmin) return;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
              Governance Engine & Policy Settings
            </h1>
            <Badge
              variant={isAdmin ? 'info' : 'warning'}
              size="sm"
            >
              {isAdmin ? 'ADMIN AUTHORIZED' : 'READ-ONLY ACCESS'}
            </Badge>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Configure compliance review thresholds, SLA targets, and enforcement strictness.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={!isAdmin}
          leftIcon={savedSuccess ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Save className="w-3.5 h-3.5" />}
          onClick={handleSave}
        >
          {savedSuccess ? 'Settings Saved' : 'Save Configuration'}
        </Button>
      </div>

      {/* Role Restriction Banner if not Admin */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider font-mono">
              Role-Based Access Control Notice
            </span>
            <p className="text-[#F8FAFC]/90 leading-relaxed">
              You are signed in as <strong>{currentUser?.name}</strong> with role{' '}
              <span className="font-semibold uppercase text-[#F59E0B]">{currentUser?.role}</span>.
              Only users with the <strong>Admin</strong> role (e.g. Elena Rostova) are authorized to modify global governance parameters, SLA thresholds, and engine strictness. You may view these settings in read-only mode.
            </p>
          </div>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>Governance policy thresholds have been updated and synced to the active policy engine.</span>
        </div>
      )}

      {/* Review SLA Target */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#6366F1]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">
              Human Review SLA & Turnaround
            </h3>
          </div>
        </CardHeader>
        <CardBody className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Review Target SLA (Hours)"
              type="number"
              step="0.5"
              value={slaHours}
              onChange={e => setSlaHours(e.target.value)}
              disabled={!isAdmin}
            />
            <Select
              label="Audit Strictness Profile"
              options={[
                { value: 'strict', label: 'Enterprise Strict (Zero Tolerance for Breaches)' },
                { value: 'balanced', label: 'Balanced (Flags Breaches & High-Risk Warnings)' },
                { value: 'permissive', label: 'Permissive (Flags Direct Contradictions Only)' },
              ]}
              value={engineStrictness}
              onChange={e => setEngineStrictness(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <p className="text-xs text-[#64748B]">
            Assets remaining in the queue beyond the SLA threshold will trigger high-priority alerts to brand stewards.
          </p>
        </CardBody>
      </Card>

      {/* Separation of Duties (Rule 6) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">
              Compliance & Conflict of Interest (Rule 6)
            </h3>
          </div>
        </CardHeader>
        <CardBody className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0D1220] border border-[#253047]">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[#F8FAFC]">
                Mandatory Creator Conflict Block (Rule 6)
              </div>
              <div className="text-xs text-[#94A3B8]">
                Disallow authors from approving their own submitted content versions.
              </div>
            </div>
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => isAdmin && setEnforceRule6(!enforceRule6)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${enforceRule6 ? 'bg-[#6366F1]' : 'bg-[#253047]'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  enforceRule6 ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#0D1220] border border-[#253047]">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[#F8FAFC]">
                Mandatory Footnote Citation Check
              </div>
              <div className="text-xs text-[#94A3B8]">
                Enforce explicit asterisk study citations on all quantitative ROI claims.
              </div>
            </div>
            <button
              type="button"
              disabled={!isAdmin}
              onClick={() => isAdmin && setRequireDisclaimerFootnotes(!requireDisclaimerFootnotes)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              } ${requireDisclaimerFootnotes ? 'bg-[#6366F1]' : 'bg-[#253047]'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  requireDisclaimerFootnotes ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
