/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, BrandSource, AuditFinding } from '../../types';

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
  sources: BrandSource[],
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

  // 2. Search Brand Sources (Titles, Categories, Descriptions)
  for (const source of sources) {
    if (source.title.toLowerCase().includes(q) || source.description.toLowerCase().includes(q)) {
      results.push({
        id: `src-${source.id}`,
        type: 'source',
        title: source.title,
        subtitle: `${source.current_version} • Category: ${source.category.replace('_', ' ').toUpperCase()} • ${source.passage_count} Passages`,
        matchContext: source.description,
        matchedField: 'Guideline Source',
        category: source.category,
        sourceId: source.id,
      });
    }

    // Search Passages inside Sources
    for (const ver of source.versions) {
      for (const passage of ver.passages) {
        const textIdx = passage.text.toLowerCase().indexOf(q);
        const titleMatch = passage.rule_title.toLowerCase().includes(q);
        const sectionMatch = passage.section.toLowerCase().includes(q);

        if (textIdx !== -1 || titleMatch || sectionMatch) {
          let snippet = passage.text;
          if (textIdx !== -1) {
            const start = Math.max(0, textIdx - 30);
            const end = Math.min(passage.text.length, textIdx + q.length + 35);
            snippet = `...${passage.text.slice(start, end)}...`;
          }

          results.push({
            id: `pas-${passage.id}`,
            type: 'passage',
            title: `${passage.rule_title} (${passage.section})`,
            subtitle: `In ${source.title} (${source.current_version}) • Type: ${passage.rule_type.replace('_', ' ')}`,
            matchContext: snippet,
            matchedField: titleMatch ? 'Rule Title' : sectionMatch ? 'Rule Section' : 'Passage Text',
            sourceId: source.id,
          });
        }
      }
    }
  }

  // 3. Search Audit Findings
  for (const [vId, findingsList] of Object.entries(allFindings)) {
    for (const finding of findingsList) {
      const matchTitle = finding.title.toLowerCase().includes(q);
      const matchDesc = finding.description.toLowerCase().includes(q);
      const matchFlagged = finding.flagged_text.toLowerCase().includes(q);
      const matchReplacement = finding.suggested_replacement.toLowerCase().includes(q);
      const matchExcerpt = finding.evidence.excerpt.toLowerCase().includes(q);

      if (matchTitle || matchDesc || matchFlagged || matchReplacement || matchExcerpt) {
        // Find corresponding asset
        const parentAsset = assets.find(a => a.versions.some(v => v.version_id === vId));
        results.push({
          id: `finding-${finding.id}`,
          type: 'finding',
          title: `[${finding.severity.toUpperCase()}] ${finding.title}`,
          subtitle: `Flagged: "${finding.flagged_text}" ➔ Replacement: "${finding.suggested_replacement}"`,
          matchContext: `Cited in ${finding.evidence.source_title}: "${finding.evidence.excerpt}"`,
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
