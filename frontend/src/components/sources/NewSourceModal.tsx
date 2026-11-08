/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, FileText, Upload, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { BrandSource, BrandSourcePassage } from '../../types';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { sourcesService } from '../../services/api/sourcesService';

interface NewSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourceCreated: (source: BrandSource) => void;
}

interface PassageFormItem {
  section: string;
  rule_title: string;
  text: string;
  rule_type: BrandSourcePassage['rule_type'];
  severity: BrandSourcePassage['severity'];
}

export const NewSourceModal: React.FC<NewSourceModalProps> = ({
  isOpen,
  onClose,
  onSourceCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'upload'>('form');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BrandSource['category']>('legal');
  const [description, setDescription] = useState('');
  const [versionTag, setVersionTag] = useState('v1.0');

  // Multiple passages support
  const [passages, setPassages] = useState<PassageFormItem[]>([
    {
      section: 'Section 1.1: Core Mandate',
      rule_title: 'Required Disclosure Statement',
      text: '',
      rule_type: 'mandatory_disclaimer',
      severity: 'breach',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Template pre-fill
  const handleApplyTemplate = (type: string) => {
    if (type === 'esg') {
      setTitle('FY2027 ESG & Sustainability Public Claims Policy');
      setCategory('legal');
      setDescription('Statutory mandates regarding carbon-neutrality claims, carbon offsets, and audited Scope 1/2 disclosures.');
      setVersionTag('v1.0');
      setPassages([
        {
          section: 'Section 3.2: Carbon Neutrality Claims',
          rule_title: 'Net-Zero Third-Party Audit Requirement',
          text: 'Claims asserting "net-zero emissions" or "100% carbon neutral" must explicitly cite an accredited third-party audit and specify whether Scope 3 emissions are included.',
          rule_type: 'mandatory_disclaimer',
          severity: 'breach',
        },
        {
          section: 'Section 4.1: Prohibited Greenwashing Terms',
          rule_title: 'Unsubstantiated Eco-Friendly Claims',
          text: 'Vague terms such as "planet-friendly", "pure green", and "zero impact" are strictly prohibited without a scientific life-cycle assessment footnote.',
          rule_type: 'prohibited_phrase',
          severity: 'breach',
        },
      ]);
    } else if (type === 'anti_bribery') {
      setTitle('Global Anti-Corruption & Gifts Policy');
      setCategory('legal');
      setDescription('Standards governing customer hospitality, governmental interactions, and ethical compliance declarations.');
      setVersionTag('v2.0');
      setPassages([
        {
          section: 'Section 2.4: Promotional Gifts',
          rule_title: 'Monetary Gift Value Threshold',
          text: 'Outbound communications must never promise gifts, rebates, or gratuities exceeding $50 USD to public sector officials or enterprise procurement teams.',
          rule_type: 'prohibited_phrase',
          severity: 'breach',
        },
      ]);
    } else if (type === 'ai_governance') {
      setTitle('Responsible Governance & Model Risk Disclosures');
      setCategory('security');
      setDescription('Mandatory transparency disclosures regarding algorithmic reasoning, training data provenance, and human-in-the-loop validation.');
      setVersionTag('v1.0');
      setPassages([
        {
          section: 'Section 1.4: Synthetic Content Labeling',
          rule_title: 'Mandatory Human Verification Notice',
          text: 'All materials referencing automated decision support systems must explicitly disclose that a qualified human specialist performs final review before distribution.',
          rule_type: 'mandatory_disclaimer',
          severity: 'warning',
        },
      ]);
    }
    setError(null);
  };

  const handleAddPassageRow = () => {
    setPassages(prev => [
      ...prev,
      {
        section: `Section ${prev.length + 1}.1: Standard`,
        rule_title: 'New Policy Rule',
        text: '',
        rule_type: 'prohibited_phrase',
        severity: 'breach',
      },
    ]);
  };

  const handleRemovePassageRow = (index: number) => {
    if (passages.length <= 1) return;
    setPassages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdatePassage = (index: number, field: keyof PassageFormItem, value: string) => {
    setPassages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      setError('Please provide a guideline document title.');
      return;
    }

    const validPassages = passages.filter(p => p.text.trim().length > 0);
    if (validPassages.length === 0) {
      setError('At least one policy rule passage with text is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const createdSource = await sourcesService.createSource({
        title,
        category,
        description: description || 'Authoritative brand guideline ratified by brand stewardship.',
        initial_version_tag: versionTag || 'v1.0',
        passages: validPassages,
      });

      onSourceCreated(createdSource);
      onClose();

      // Reset
      setTitle('');
      setDescription('');
      setPassages([
        {
          section: 'Section 1.1: Core Mandate',
          rule_title: 'Required Disclosure Statement',
          text: '',
          rule_type: 'mandatory_disclaimer',
          severity: 'breach',
        },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register brand source');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register Authoritative Brand Source"
      description="Define an authoritative brand guideline with indexed evidence passages for deterministic audit verification."
      maxWidth="2xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSubmit()}
            isLoading={isSubmitting}
            disabled={!title.trim() || !passages.some(p => p.text.trim())}
          >
            Register Brand Source
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Quick Templates Bar */}
        <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] flex items-center justify-between">
            <span>Pre-populate from Enterprise Guideline Template</span>
            <span className="text-[#818CF8]">Instant Fill</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleApplyTemplate('esg')}
              className="px-2.5 py-1 rounded bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] text-xs text-[#F8FAFC] transition-colors cursor-pointer"
            >
              🌿 ESG & Carbon Neutrality
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('anti_bribery')}
              className="px-2.5 py-1 rounded bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] text-xs text-[#F8FAFC] transition-colors cursor-pointer"
            >
              ⚖️ Anti-Corruption & Hospitality
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('ai_governance')}
              className="px-2.5 py-1 rounded bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] text-xs text-[#F8FAFC] transition-colors cursor-pointer"
            >
              🛡️ Responsible AI Disclosures
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Basic Metadata */}
        <Input
          label="Guideline Document Title"
          placeholder="e.g. FY2027 Global Sustainability & ESG Claims"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Category"
            options={[
              { value: 'legal', label: 'Legal & Regulatory' },
              { value: 'tone_voice', label: 'Brand Tone & Editorial Voice' },
              { value: 'trademark', label: 'Trademark & Marks' },
              { value: 'security', label: 'Security & Certifications' },
              { value: 'product', label: 'Product Architecture' },
            ]}
            value={category}
            onChange={e => setCategory(e.target.value as BrandSource['category'])}
          />
          <Input
            label="Initial Version Tag"
            placeholder="v1.0"
            value={versionTag}
            onChange={e => setVersionTag(e.target.value)}
            required
          />
        </div>

        <Input
          label="Document Scope & Purpose"
          placeholder="Mandates governing public disclosures, marketing copy, and sales materials..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* Multiple Passages Section */}
        <div className="pt-3 border-t border-[#253047] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#F8FAFC] block">
                Policy Passages & Evidence Anchors ({passages.length})
              </span>
              <p className="text-[11px] text-[#94A3B8]">
                Passages are indexed into the deterministic audit engine.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleAddPassageRow}
            >
              Add Another Rule
            </Button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {passages.map((p, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] space-y-2.5 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-[#6366F1]">
                    Passage #{idx + 1}
                  </span>
                  {passages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePassageRow(idx)}
                      className="text-[#64748B] hover:text-[#EF4444] transition-colors p-1 rounded cursor-pointer"
                      title="Remove rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <Input
                    placeholder="Section & Paragraph"
                    value={p.section}
                    onChange={e => handleUpdatePassage(idx, 'section', e.target.value)}
                  />
                  <Input
                    placeholder="Rule Title"
                    value={p.rule_title}
                    onChange={e => handleUpdatePassage(idx, 'rule_title', e.target.value)}
                  />
                  <Select
                    options={[
                      { value: 'prohibited_phrase', label: 'Prohibited Phrasing' },
                      { value: 'mandatory_disclaimer', label: 'Mandatory Disclosure' },
                      { value: 'tone_constraint', label: 'Tone Constraint' },
                      { value: 'trademark_syntax', label: 'Trademark Syntax' },
                    ]}
                    value={p.rule_type}
                    onChange={e => handleUpdatePassage(idx, 'rule_type', e.target.value)}
                  />
                </div>

                <Textarea
                  placeholder="Verbatim policy text from guideline (used for evidence matching)..."
                  rows={2}
                  value={p.text}
                  onChange={e => handleUpdatePassage(idx, 'text', e.target.value)}
                  required
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
