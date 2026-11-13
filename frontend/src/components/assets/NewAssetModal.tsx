/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Asset } from '../../types';
import { Modal } from '../UI/Modal';
import { Input, Textarea } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';
import { assetsService } from '../../services/API/assetsService';
import { AuditDataSource, auditService } from '../../services/API/auditService';
import { ApiError } from '../../services/API/client';

export interface NewAssetOutcome {
  asset: Asset;
  auditSource?: AuditDataSource;
  auditServerOutcome: 'confirmed' | 'unknown' | 'rejected';
  auditUnavailable: boolean;
}

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated: (outcome: NewAssetOutcome) => void;
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
}) => {
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState<Asset['channel']>('linkedin');
  const [campaign, setCampaign] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uncertainOutcome, setUncertainOutcome] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and draft content are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setUncertainOutcome(false);
    try {
      const creation = await assetsService.createAsset({
        title,
        channel,
        campaign: campaign || 'Standard Marketing Pipeline',
        content,
      });

      let auditSource: AuditDataSource | undefined;
      let auditUnavailable = false;
      let auditServerOutcome: NewAssetOutcome['auditServerOutcome'] = 'confirmed';
      const createdAsset = creation.asset;

      try {
        const result = await auditService.triggerAudit(
          createdAsset,
          createdAsset.current_version_id
        );
        auditSource = result.source;
        auditServerOutcome = result.serverOutcome;
        auditUnavailable = result.source === 'unavailable';
      } catch (auditError: unknown) {
        auditServerOutcome = auditError instanceof ApiError
          ? auditError.outcome
          : 'unknown';
        const currentVersion = createdAsset.versions.find(
          version => version.version_id === createdAsset.current_version_id
        );
        if (currentVersion) {
          currentVersion.audit_status = 'unavailable';
          currentVersion.audit_source = 'unavailable';
          currentVersion.audit_server_outcome = auditServerOutcome;
          delete currentVersion.audit_summary;
        }
        assetsService.updateLocalSnapshot(createdAsset);
        auditUnavailable = true;
      }

      onAssetCreated({
        asset: createdAsset,
        auditSource,
        auditServerOutcome,
        auditUnavailable,
      });
      onClose();
      setTitle('');
      setContent('');
      setCampaign('');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.outcome === 'unknown') {
        setUncertainOutcome(true);
        setError("We couldn't confirm whether your submission was saved. Please check My Submissions before trying again.");
      } else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('Your submission was rejected because your account could not create content. Your draft is still here.');
      } else if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setError('The server rejected your submission. Check the required fields and try again. Your draft is still here.');
      } else {
        setUncertainOutcome(true);
        setError("We couldn't confirm whether your submission was saved. Please check My Submissions before trying again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const channelOptions = [
    { value: 'linkedin', label: 'LinkedIn Post / Article' },
    { value: 'email', label: 'Email Newsletter / Campaign' },
    { value: 'landing_page', label: 'Website Landing Page Copy' },
    { value: 'press_release', label: 'Press Release / Corporate Statement' },
    { value: 'product_sheet', label: 'Product Data Sheet / Brochure' },
    { value: 'ad_copy', label: 'Digital Advertisement Copy' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Content"
      description="Create a text-based submission and check it against available brand rules."
      maxWidth="xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!title.trim() || !content.trim()}
          >
            Create & Run Brand Check
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role={uncertainOutcome ? 'alert' : 'status'}
            className={`p-2.5 rounded border text-xs ${
              uncertainOutcome
                ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#B45309]'
                : 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
            }`}
          >
            {error}
          </div>
        )}

        <Input
          label="Asset Title / Headline"
          placeholder="e.g. Q1 Global Enterprise Infrastructure Launch Copy"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Target Channel"
            options={channelOptions}
            value={channel}
            onChange={e => setChannel(e.target.value as Asset['channel'])}
          />
          <Input
            label="Campaign Name (Optional)"
            placeholder="e.g. Global Sovereign Cloud Rollout"
            value={campaign}
            onChange={e => setCampaign(e.target.value)}
          />
        </div>

        <Textarea
          label="Text content"
          placeholder="Paste or write the content you want to check..."
          rows={7}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />

        <p className="text-xs text-[#64748B]">
          File upload is not available for content submissions. Paste or enter the text here.
        </p>

        <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] text-[11px] text-[#64748B] space-y-1">
          <div className="font-semibold text-[#94A3B8]">Available brand checks:</div>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Regulatory & Legal disclaimer verification (ROI, Safe Harbor)</li>
            <li>Editorial tone and prohibited marketing superlatives</li>
            <li>Registered trademark syntax and nomenclature casing</li>
            <li>Cybersecurity and ISO/SOC 2 claims validation</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
};
