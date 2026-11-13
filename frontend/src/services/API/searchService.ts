/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, BackendBrandSource, AuditFinding } from '../../types';

export interface SearchResultItem {
  id: string;
  type: 'asset' | 'source' | 'passage' | 'finding';
  title: string;
  subtitle: string;
  matchContext: string;
  matchedField: string;
  category?: string;
  severity?: string;
  assetId?: string;
  versionId?: string;
  sourceId?: string;
}

export function performGlobalSearch(
  query: string,
  assets: Asset[],
  sources: BackendBrandSource[],
  allFindings: Record<string, AuditFinding[]>
): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Assets (Titles, Campaigns, Channel, Authors, and Version Contents)
  for (const asset of assets) {
    // Title match
    if (asset.title.toLowerCase().includes(q)) {
      results.push({
        id: `asset-${asset.id}`,
        type: 'asset',
        title: asset.title,
        subtitle: `${asset.channel.replace('_', ' ')} • Status: ${asset.current_status.replace('_', ' ').toUpperCase()} • ${asset.versions.length} versions`,
        matchContext: `Asset Title: "${asset.title}"`,
        matchedField: 'Title',
        category: asset.channel,
        assetId: asset.id,
        versionId: asset.current_version_id,
      });
    }
    // Campaign match
    else if (asset.campaign && asset.campaign.toLowerCase().includes(q)) {
      results.push({
        id: `asset-camp-${asset.id}`,
        type: 'asset',
        title: asset.title,
        subtitle: `Campaign: ${asset.campaign} • ${asset.channel}`,
        matchContext: `Campaign: "${asset.campaign}"`,
        matchedField: 'Campaign',
        assetId: asset.id,
        versionId: asset.current_version_id,
      });
    }
    // Author match
    else if (asset.created_by.name.toLowerCase().includes(q)) {
      results.push({
        id: `asset-auth-${asset.id}`,
        type: 'asset',
        title: asset.title,
        subtitle: `Author: ${asset.created_by.name} (${asset.created_by.title})`,
        matchContext: `Created by ${asset.created_by.name}`,
        matchedField: 'Author',
        assetId: asset.id,
        versionId: asset.current_version_id,
      });
    }

    // Search Version Content
    for (const ver of asset.versions) {
      const contentIdx = ver.content.toLowerCase().indexOf(q);
      if (contentIdx !== -1) {
        const start = Math.max(0, contentIdx - 35);
        const end = Math.min(ver.content.length, contentIdx + q.length + 35);
        const snippet = `...${ver.content.slice(start, end).replace(/\n/g, ' ')}...`;

        // Check if not already added
        if (!results.some(r => r.assetId === asset.id && r.versionId === ver.version_id && r.matchedField === 'Content')) {
          results.push({
            id: `asset-content-${ver.version_id}`,
            type: 'asset',
            title: `${asset.title} (${ver.version_number})`,
            subtitle: `Matches draft copy in ${ver.version_number} • Status: ${ver.audit_status}`,
            matchContext: snippet,
            matchedField: 'Content',
            assetId: asset.id,
            versionId: ver.version_id,
          });
        }
      }
    }
  }

  // 2. Search Backend Brand Sources (Names and Types)
  for (const source of sources) {
    if (source.name.toLowerCase().includes(q) || source.source_type.toLowerCase().includes(q)) {
      results.push({
        id: `src-${source.id}`,
        type: 'source',
        title: source.name,
        subtitle: `Type: ${source.source_type.toUpperCase()} • Uploaded: ${new Date(source.created_at).toLocaleDateString()}`,
        matchContext: `Brand Guideline Source: ${source.name} (${source.source_type})`,
        matchedField: 'Guideline Source',
        category: source.source_type,
        sourceId: source.id,
      });
    }
  }

  // 3. Search Audit Findings
  for (const [vId, findingsList] of Object.entries(allFindings)) {
    for (const finding of findingsList) {
      const matchTitle = finding.title.toLowerCase().includes(q);
      const matchDesc = finding.description.toLowerCase().includes(q);
      const matchFlagged = finding.flagged_text.toLowerCase().includes(q);
      const matchReplacement = finding.suggested_replacement.toLowerCase().includes(q);
      const matchExcerpt = finding.evidence?.excerpt?.toLowerCase().includes(q) ?? false;

      if (matchTitle || matchDesc || matchFlagged || matchReplacement || matchExcerpt) {
        // Find corresponding asset
        const parentAsset = assets.find(a => a.versions.some(v => v.version_id === vId));
        results.push({
          id: `finding-${finding.id}`,
          type: 'finding',
          title: `[${finding.severity.toUpperCase()}] ${finding.title}`,
          subtitle: `Flagged: "${finding.flagged_text}" ➔ Replacement: "${finding.suggested_replacement}"`,
          matchContext: `Cited in ${finding.evidence?.source_title ?? 'Source'}: "${finding.evidence?.excerpt ?? finding.description}"`,
          matchedField: matchFlagged ? 'Flagged Phrase' : matchReplacement ? 'Replacement' : 'Finding Description',
          category: finding.category,
          severity: finding.severity,
          assetId: parentAsset?.id,
          versionId: vId,
        });
      }
    }
  }

  return results;
}