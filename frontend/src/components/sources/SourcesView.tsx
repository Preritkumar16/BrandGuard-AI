/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, ShieldCheck, ChevronRight, CheckCircle2, Copy, Check, Search, Filter, X } from 'lucide-react';
import { BrandSource, BrandSourcePassage, User } from '../../types';
import { Badge } from '../UI/Badge';
import { Button } from '../UI/Button';
import { Card, CardBody, CardHeader } from '../UI/Card';
import { Modal } from '../UI/Modal';
import { Input, Textarea } from '../UI/Input';
import { Select } from '../UI/Select';
import { NewSourceModal } from './NewSourceModal';
import { sourcesService } from '../../services/API/sourcesService';

interface SourcesViewProps {
  sources: BrandSource[];
  onSourceCreated: (source: BrandSource) => void;
  selectedSourceId?: string | null;
  initialCategoryFilter?: string;
  currentUser?: User;
}

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources,
  onSourceCreated,
  selectedSourceId,
  initialCategoryFilter = 'all',
  currentUser,
}) => {
  const [activeSourceId, setActiveSourceId] = useState<string | null>(
    selectedSourceId || (sources.length > 0 ? sources[0].id : null)
  );
  const [newSourceModalOpen, setNewSourceModalOpen] = useState(false);
  const [addPassageModalOpen, setAddPassageModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPassageId, setCopiedPassageId] = useState<string | null>(null);

  // New passage form state
  const [newSection, setNewSection] = useState('');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newRuleType, setNewRuleType] = useState<BrandSourcePassage['rule_type']>('mandatory_disclaimer');
  const [isSavingPassage, setIsSavingPassage] = useState(false);

  // Sync activeSourceId whenever selectedSourceId changes from parent
  useEffect(() => {
    if (selectedSourceId) {
      setActiveSourceId(selectedSourceId);
    }
  }, [selectedSourceId]);

  // If initialCategoryFilter changes
  useEffect(() => {
    if (initialCategoryFilter && initialCategoryFilter !== 'all') {
      setCategoryFilter(initialCategoryFilter);
    }
  }, [initialCategoryFilter]);

  // Filter sources
  const filteredSources = sources.filter(s => {
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.versions.some(v => v.passages.some(p => p.text.toLowerCase().includes(searchQuery.toLowerCase()) || p.rule_title.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const activeSource = sources.find(s => s.id === activeSourceId) || filteredSources[0] || sources[0];

  const handleCopyPassage = (passageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassageId(passageId);
    setTimeout(() => setCopiedPassageId(null), 2000);
  };

  const handleAddPassageSubmit = async () => {
    if (!activeSource || !newText.trim()) return;
    try {
      setIsSavingPassage(true);
      const added = await sourcesService.addPassageToSource(activeSource.id, {
        section: newSection || `Section ${activeSource.versions[0].passages.length + 1}.1: Standard`,
        rule_title: newRuleTitle || 'Policy Rule',
        text: newText,
        rule_type: newRuleType,
        severity: 'breach',
      });
      // Update local source passages
      activeSource.versions[0].passages.push(added);
      activeSource.passage_count = activeSource.versions[0].passages.length;
      setAddPassageModalOpen(false);
      setNewSection('');
      setNewRuleTitle('');
      setNewText('');
    } finally {
      setIsSavingPassage(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Domains' },
    { id: 'legal', label: 'Legal & Regulatory' },
    { id: 'tone_voice', label: 'Tone of Voice' },
    { id: 'trademark', label: 'Trademark & Marks' },
    { id: 'security', label: 'Security & Certifications' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            Authoritative Brand Sources & Guidelines
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Product Rule 1 & 7: Ratified brand guidelines with indexed evidence passages powering deterministic compliance inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'creator' && (
            <span className="text-[11px] text-[#F59E0B] font-mono hidden md:inline">
              Reviewer / Admin role required to add guidelines
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={currentUser?.role === 'creator'}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setNewSourceModalOpen(true)}
          >
            Add Brand Source
          </Button>
        </div>
      </div>

      {/* Filter and Category Pills & Properly Aligned Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-[#111827] border border-[#253047]">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center ${
                categoryFilter === cat.id
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#3B4866] shadow-xs font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161E2E]/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Guidelines Input - Perfectly Vertically Centered and Aligned */}
        <div className="relative w-full lg:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search guidelines, rules, or passages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-lg bg-[#0D1220] border border-[#253047] pl-9 pr-8 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Sources & Passage Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sources List (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] px-1 flex items-center justify-between">
            <span>Registered Policy Documents ({filteredSources.length})</span>
            <span>Click to Inspect</span>
          </div>

          {filteredSources.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B] rounded-xl bg-[#111827] border border-[#253047]">
              No brand sources match the selected filter.
            </div>
          ) : (
            filteredSources.map(source => {
              const isSelected = activeSource?.id === source.id;
              return (
                <div
                  key={source.id}
                  onClick={() => setActiveSourceId(source.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#161E2E] border-[#6366F1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                      : 'bg-[#111827] border-[#253047] hover:border-[#3B4866]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-mono text-[#818CF8] bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/20 font-semibold">
                      {source.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0D1220] border border-[#253047] text-[#F8FAFC]">
                        {source.current_version}
                      </span>
                      <Badge status={source.status} size="sm" />
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1">
                    {source.title}
                  </h3>

                  <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {source.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#253047]/60 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>{source.passage_count} Verified Passages</span>
                    <span className="font-mono">{new Date(source.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Source Passages Inspector (Right 7 Cols) */}
        <div className="lg:col-span-7">
          {activeSource ? (
            <Card>
              <CardHeader className="bg-[#0D1220]/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-[#6366F1]">
                      {activeSource.current_version}
                    </span>
                    <h2 className="text-sm font-bold text-[#F8FAFC]">
                      {activeSource.title}
                    </h2>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    {activeSource.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={activeSource.status} size="sm" />
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5 text-[#6366F1]" />}
                    onClick={() => setAddPassageModalOpen(true)}
                  >
                    Add Passage
                  </Button>
                </div>
              </CardHeader>

              <CardBody className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#F8FAFC]">
                    Indexed Passages & Evidence Anchors ({activeSource.versions[0]?.passages.length || 0})
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Deterministic Pattern Index
                  </span>
                </div>

                <div className="space-y-3">
                  {activeSource.versions[0]?.passages.map(passage => (
                    <div
                      key={passage.id}
                      className="p-4 rounded-lg bg-[#0D1220] border border-[#253047] space-y-2 border-l-2 border-l-[#6366F1] group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#F8FAFC]">
                          {passage.rule_title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#161E2E] border border-[#253047] text-[#818CF8]">
                            {passage.rule_type.replace('_', ' ')}
                          </span>
                          <button
                            onClick={() => handleCopyPassage(passage.id, passage.text)}
                            className="p-1 rounded text-[#64748B] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                            title="Copy verbatim passage text"
                          >
                            {copiedPassageId === passage.id ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#818CF8] font-mono">
                        {passage.section}
                      </div>

                      <div className="text-xs text-[#94A3B8] font-mono bg-[#111827] p-3 rounded border border-[#253047] leading-relaxed">
                        "{passage.text}"
                      </div>
                    </div>
                  ))}
                </div>

                {/* Changelog & Governance History */}
                <div className="pt-4 border-t border-[#253047] text-xs text-[#64748B] space-y-1">
                  <div className="font-semibold text-[#94A3B8]">
                    Version Changelog:
                  </div>
                  <p className="leading-relaxed">
                    {activeSource.versions[0]?.changelog || 'Authoritative brand rules ratified by stewardship committee.'}
                  </p>
                  <div className="text-[11px] font-mono pt-1 text-[#64748B]">
                    Effective Date: {activeSource.versions[0]?.effective_date} • Ratified by {activeSource.versions[0]?.created_by}
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <div className="p-12 text-center text-[#64748B]">
                Select a brand source on the left to inspect its passages.
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Brand Source Modal */}
      <NewSourceModal
        isOpen={newSourceModalOpen}
        onClose={() => setNewSourceModalOpen(false)}
        onSourceCreated={newSource => {
          onSourceCreated(newSource);
          setActiveSourceId(newSource.id);
        }}
      />

      {/* Add Passage to Existing Source Modal */}
      {activeSource && (
        <Modal
          isOpen={addPassageModalOpen}
          onClose={() => setAddPassageModalOpen(false)}
          title={`Add Rule Passage to ${activeSource.title}`}
          description={`Document Version: ${activeSource.current_version}`}
          maxWidth="lg"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setAddPassageModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddPassageSubmit}
                isLoading={isSavingPassage}
                disabled={!newText.trim()}
              >
                Append Rule Passage
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Section Reference"
                placeholder="e.g. Section 4.5: Social Disclosures"
                value={newSection}
                onChange={e => setNewSection(e.target.value)}
              />
              <Select
                label="Rule Type"
                options={[
                  { value: 'mandatory_disclaimer', label: 'Mandatory Disclaimer' },
                  { value: 'prohibited_phrase', label: 'Prohibited Phrasing' },
                  { value: 'tone_constraint', label: 'Tone Constraint' },
                  { value: 'trademark_syntax', label: 'Trademark Syntax' },
                ]}
                value={newRuleType}
                onChange={e => setNewRuleType(e.target.value as BrandSourcePassage['rule_type'])}
              />
            </div>

            <Input
              label="Rule Title"
              placeholder="e.g. Influencer Disclosure Requirement"
              value={newRuleTitle}
              onChange={e => setNewRuleTitle(e.target.value)}
            />

            <Textarea
              label="Verbatim Passage Text"
              placeholder="All sponsored marketing communications must incorporate clear and conspicuous #ad disclosures..."
              rows={4}
              value={newText}
              onChange={e => setNewText(e.target.value)}
              required
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
