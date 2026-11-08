/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Filter, Plus, ArrowRight, Layers, FileText, X } from 'lucide-react';
import { Asset, ComplianceStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';

interface AssetListViewProps {
  assets: Asset[];
  onSelectAsset: (assetId: string) => void;
  onNewAssetClick: () => void;
}

export const AssetListView: React.FC<AssetListViewProps> = ({
  assets,
  onSelectAsset,
  onNewAssetClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.campaign && asset.campaign.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChannel = channelFilter === 'all' || asset.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || asset.current_status === statusFilter;

    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            Asset Repository
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Authoritative registry of marketing assets, immutable version branches, and audit histories.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={onNewAssetClick}
        >
          Submit Content
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#111827] border border-[#253047] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by title, campaign, or keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-lg bg-[#0D1220] border border-[#253047] pl-9 pr-8 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#64748B] hover:text-[#F8FAFC] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-44">
          <Select
            options={[
              { value: 'all', label: 'All Channels' },
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'email', label: 'Email' },
              { value: 'landing_page', label: 'Landing Page' },
              { value: 'press_release', label: 'Press Release' },
              { value: 'product_sheet', label: 'Product Sheet' },
            ]}
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
          />
        </div>

        <div className="w-48">
          <Select
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'approved', label: 'Approved' },
              { value: 'review_required', label: 'Review Required' },
              { value: 'breach', label: 'Rule Breach' },
              { value: 'in_review', label: 'In Review' },
              { value: 'draft', label: 'Draft' },
            ]}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Asset Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#253047] bg-[#0D1220]/70 text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-5">Asset Details</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Latest Version</th>
                <th className="py-3 px-4">Governance Status</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#253047]/60 text-xs text-[#94A3B8]">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B]">
                    No assets found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const latestVersion = asset.versions[asset.versions.length - 1];
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => onSelectAsset(asset.id)}
                      className="hover:bg-[#161E2E]/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors truncate max-w-md">
                          {asset.title}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5 truncate">
                          {asset.campaign || 'Global Communications'}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px] uppercase">
                        <span className="px-2 py-0.5 rounded bg-[#161E2E] border border-[#253047] text-[#94A3B8]">
                          {asset.channel.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono text-xs text-[#F8FAFC]">
                        <span className="px-2 py-0.5 rounded bg-[#0D1220] border border-[#253047]">
                          {latestVersion ? latestVersion.version_number : 'v1.0'}
                        </span>
                        <span className="text-[10px] text-[#64748B] ml-2">
                          ({asset.versions.length} versions)
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <Badge status={asset.current_status} size="sm" />
                      </td>

                      <td className="py-4 px-4 text-[11px]">
                        <div className="text-[#F8FAFC] font-medium">{asset.created_by.name}</div>
                        <div className="text-[#64748B]">{new Date(asset.updated_at).toLocaleDateString()}</div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectAsset(asset.id);
                          }}
                          className="p-1.5 rounded text-[#818CF8] hover:text-[#F8FAFC] hover:bg-[#253047]/60 transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span className="text-xs">Inspect</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
