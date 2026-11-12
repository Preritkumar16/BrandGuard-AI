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
import { assetsService } from '../../services/api/assetsService';
import { auditService } from '../../services/api/auditService';

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated: (asset: Asset) => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and draft content are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newAsset = await assetsService.createAsset({
        title,
        channel,
        campaign: campaign || 'Standard Marketing Pipeline',
        content,
      });

      // Automatically run initial audit on newly registered draft
      await auditService.triggerAudit(newAsset.id, newAsset.current_version_id);

      onAssetCreated(newAsset);
      onClose();
      // Reset form
      setTitle('');
      setContent('');
      setCampaign('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit asset');
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
      title="Submit Content for Brand Governance"
      description="Register an outbound communication asset. Version v1.0 will be immutably preserved."
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
            Create & Run Brand Audit
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
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
          label="Draft Content / Copy"
          placeholder="Paste or write your marketing copy here for immediate governance screening..."
          rows={7}
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />

        <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] text-[11px] text-[#64748B] space-y-1">
          <div className="font-semibold text-[#94A3B8]">Automated Brand Checks on Submission:</div>
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
