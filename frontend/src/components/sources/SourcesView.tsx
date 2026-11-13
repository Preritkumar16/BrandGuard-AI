
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  FileText,
  Search,
  X,
  ShieldCheck,
  CalendarDays,
  UserRound,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { BackendBrandSource, User } from '../../types';
import { Button } from '../UI/Button';
import { Card, CardBody, CardHeader } from '../UI/Card';
import { NewSourceModal } from './NewSourceModal';
import { sourcesService } from '../../services/API/sourcesService';
import { can } from '../../config/permissions';

interface SourcesViewProps {
  sources: BackendBrandSource[];
  onSourceCreated: (source: BackendBrandSource) => void;
  selectedSourceId?: string | null;
  initialCategoryFilter?: string;
  currentUser?: User | null;
}

const categories = [
  { id: 'all', label: 'All Domains' },
  { id: 'guideline_pdf', label: 'Brand Guidelines' },
  { id: 'legal', label: 'Legal & Regulatory' },
  { id: 'tone_voice', label: 'Tone of Voice' },
  { id: 'trademark', label: 'Trademark & Marks' },
  { id: 'security', label: 'Security & Certifications' },
  { id: 'product', label: 'Product Guidelines' },
];

const formatSourceType = (value: string) =>
  value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString();
};

export const SourcesView: React.FC<SourcesViewProps> = ({
  sources,
  onSourceCreated,
  selectedSourceId,
  initialCategoryFilter = 'all',
  currentUser,
}) => {
  const [activeSourceId, setActiveSourceId] = useState<string | null>(
    selectedSourceId || sources[0]?.id || null
  );
  const [newSourceModalOpen, setNewSourceModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] =
    useState(initialCategoryFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalResults, setApprovalResults] = useState<
    Record<string, { status: string; indexedPassages: number }>
  >({});

  useEffect(() => {
    if (selectedSourceId) {
      setActiveSourceId(selectedSourceId);
    }
  }, [selectedSourceId]);

  useEffect(() => {
    setCategoryFilter(initialCategoryFilter || 'all');
  }, [initialCategoryFilter]);

  useEffect(() => {
    if (
      activeSourceId &&
      !sources.some(source => source.id === activeSourceId)
    ) {
      setActiveSourceId(sources[0]?.id || null);
    }
  }, [sources, activeSourceId]);

  const filteredSources = sources.filter(source => {
    const matchesCategory =
      categoryFilter === 'all' ||
      source.source_type === categoryFilter;

    const searchableText = [
      source.name,
      source.source_type,
      source.id,
      source.current_version_id,
    ]
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchableText.includes(
      searchQuery.trim().toLowerCase()
    );

    return matchesCategory && matchesSearch;
  });

  const activeSource =
    filteredSources.find(source => source.id === activeSourceId) ||
    filteredSources[0] ||
    null;

  const handleApproveSource = async (source: BackendBrandSource) => {
    if (!source.current_version_id || isApproving) return;

    try {
      setIsApproving(true);
      setApprovalError(null);

      const response = await sourcesService.approveSourceVersion(
        source.id,
        source.current_version_id
      );

      setApprovalResults(previous => ({
        ...previous,
        [source.id]: {
          status: response.status,
          indexedPassages: response.indexed_passages,
        },
      }));
    } catch (error: unknown) {
      setApprovalError(
        error instanceof Error
          ? error.message
          : 'Unable to approve and index this source.'
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleSourceCreated = (source: BackendBrandSource) => {
    onSourceCreated(source);
    setActiveSourceId(source.id);
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const canUpload =
    !!currentUser && can(currentUser, 'upload_source').allowed;

  const canApprove =
    !!currentUser &&
    !!activeSource &&
    activeSource.owner_user_id !== currentUser.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#F8FAFC] md:text-[1.75rem]">
            Brand Guidelines
          </h1>
          <p className="mt-1 text-sm leading-5 text-[#94A3B8]">
            Manage uploaded guideline documents and their source records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && !canUpload && (
            <span className="text-xs text-[#F59E0B] hidden md:inline">
              Source upload is restricted by your role
            </span>
          )}

          <Button
            variant="primary"
            size="sm"
            disabled={!canUpload}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setNewSourceModalOpen(true)}
          >
            Add Brand Source
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-[#111827] border border-[#253047]">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryFilter(category.id)}
              className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                categoryFilter === category.id
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#3B4866] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161E2E]/40'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            placeholder="Search source names, types or IDs..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="w-full h-9 rounded-lg bg-[#0D1220] border border-[#253047] pl-9 pr-8 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] transition-colors"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#64748B] hover:text-[#F8FAFC]"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Source List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-medium text-[#64748B] px-1 flex items-center justify-between">
            <span>Registered Source Documents ({filteredSources.length})</span>
            <span>Select to inspect</span>
          </div>

          {filteredSources.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#64748B] rounded-xl bg-[#111827] border border-[#253047]">
              {sources.length === 0
                ? 'No source documents have been uploaded yet.'
                : 'No source documents match the selected filter.'}
            </div>
          ) : (
            filteredSources.map(source => {
              const isSelected = activeSource?.id === source.id;
              const approval = approvalResults[source.id];

              return (
                <button
                  type="button"
                  key={source.id}
                  onClick={() => {
                    setActiveSourceId(source.id);
                    setApprovalError(null);
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#161E2E] border-[#6366F1]'
                      : 'bg-[#111827] border-[#253047] hover:border-[#3B4866]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[#818CF8] bg-[#6366F1]/10 px-2 py-0.5 rounded border border-[#6366F1]/20">
                      {formatSourceType(source.source_type)}
                    </span>

                    {approval && (
                      <span className="text-[11px] text-[#10B981] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {approval.status}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-1">
                    {source.name}
                  </h3>

                  <p className="text-[11px] text-[#64748B] font-mono break-all">
                    ID: {source.id}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#253047]/60 flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Uploaded</span>
                    <span className="font-mono">
                      {formatDate(source.created_at)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Source Details */}
        <div className="lg:col-span-7">
          {activeSource ? (
            <Card>
              <CardHeader className="bg-[#0D1220]/60">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#818CF8] shrink-0" />
                    <h2 className="text-sm font-bold text-[#F8FAFC] break-words">
                      {activeSource.name}
                    </h2>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    {formatSourceType(activeSource.source_type)}
                  </p>
                </div>
              </CardHeader>

              <CardBody className="space-y-5 p-5">
                {approvalError && (
                  <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{approvalError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-[#818CF8] mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#64748B]">
                        Current Version ID
                      </p>
                      <p className="text-xs font-mono text-[#CBD5E1] break-all mt-1">
                        {activeSource.current_version_id || 'Not available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-4 h-4 text-[#818CF8] mt-0.5" />
                    <div>
                      <p className="text-xs text-[#64748B]">
                        Uploaded On
                      </p>
                      <p className="text-sm text-[#CBD5E1] mt-1">
                        {formatDate(activeSource.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <UserRound className="w-4 h-4 text-[#818CF8] mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#64748B]">
                        Uploaded By (User ID)
                      </p>
                      <p className="text-xs font-mono text-[#CBD5E1] break-all mt-1">
                        {activeSource.owner_user_id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-4 h-4 text-[#818CF8] mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-[#64748B]">
                        Organisation ID
                      </p>
                      <p className="text-xs font-mono text-[#CBD5E1] break-all mt-1">
                        {activeSource.organisation_id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#253047] space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#818CF8]" />
                    <span className="text-xs font-semibold text-[#F8FAFC]">
                      Document Processing & Approval
                    </span>
                  </div>

                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    Uploaded documents are initially created as draft source
                    versions. The backend extracts the document text during
                    upload. Source passages are indexed when an authorised
                    reviewer approves the version.
                  </p>

                  {approvalResults[activeSource.id] ? (
                    <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 space-y-1">
                      <p className="text-xs font-semibold text-[#10B981] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Approval confirmed by backend
                      </p>
                      <p className="text-xs text-[#CBD5E1]">
                        Status: {approvalResults[activeSource.id].status}
                      </p>
                      <p className="text-xs text-[#CBD5E1]">
                        Indexed passages: {approvalResults[activeSource.id].indexedPassages}
                      </p>
                    </div>
                  ) : canApprove &&
                    activeSource.current_version_id ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={isApproving}
                      disabled={isApproving}
                      leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                      onClick={() => void handleApproveSource(activeSource)}
                    >
                      Approve & Index Source
                    </Button>
                  ) : (
                    <p className="text-[11px] text-[#64748B]">
                      {currentUser &&
                      activeSource.owner_user_id === currentUser.id
                        ? 'You uploaded this source. Another organisation member must approve it.'
                        : 'Approval requires an authenticated reviewer account.'}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#253047]">
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Passage inspection, version history and source editing
                    are not currently exposed by the connected backend API.
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <div className="p-12 text-center text-[#64748B]">
                Select a brand source to inspect its metadata.
              </div>
            </Card>
          )}
        </div>
      </div>

      <NewSourceModal
        isOpen={newSourceModalOpen}
        onClose={() => setNewSourceModalOpen(false)}
        onSourceCreated={handleSourceCreated}
      />
    </div>
  );
};
