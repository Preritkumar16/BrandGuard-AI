/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrandSource, BrandSourceVersion, BrandSourcePassage } from '../../types';
import { MOCK_SOURCES } from './mockData';
import { apiFetch } from './client';

let inMemorySources: BrandSource[] = [...MOCK_SOURCES];

export const sourcesService = {
  async getSources(): Promise<BrandSource[]> {
    try {
      return await apiFetch<BrandSource[]>('/sources');
    } catch {
      return inMemorySources.map(s => ({
        ...s,
        versions: s.versions.map(v => ({
          ...v,
          passages: [...v.passages],
        })),
      }));
    }
  },

  getAllSourcesSync(): BrandSource[] {
    return inMemorySources;
  },

  async getSourceById(sourceId: string): Promise<BrandSource | null> {
    try {
      return await apiFetch<BrandSource>(`/sources/${sourceId}`);
    } catch {
      const found = inMemorySources.find(s => s.id === sourceId);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    }
  },

  async createSource(payload: {
    title: string;
    category: BrandSource['category'];
    description: string;
    initial_version_tag: string;
    passages: Omit<BrandSourcePassage, 'id'>[];
  }): Promise<BrandSource> {
    try {
      return await apiFetch<BrandSource>('/sources', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const newSourceId = `src-${Date.now().toString(36)}`;
      const newVersionId = `${newSourceId}-${payload.initial_version_tag}`;

      const passagesWithId: BrandSourcePassage[] = payload.passages.map((p, idx) => ({
        ...p,
        id: `pas-${Date.now().toString(36)}-${idx}`,
      }));

      const newVersion: BrandSourceVersion = {
        version_id: newVersionId,
        source_id: newSourceId,
        version_tag: payload.initial_version_tag || 'v1.0',
        effective_date: new Date().toISOString().split('T')[0],
        status: 'approved',
        created_by: 'Brand Stewardship Committee',
        changelog: 'Initial version provisioning.',
        passages: passagesWithId,
      };

      const newSource: BrandSource = {
        id: newSourceId,
        title: payload.title,
        category: payload.category,
        description: payload.description,
        status: 'approved',
        current_version: payload.initial_version_tag || 'v1.0',
        passage_count: passagesWithId.length,
        updated_at: new Date().toISOString(),
        versions: [newVersion],
      };

      inMemorySources.unshift(newSource);
      return JSON.parse(JSON.stringify(newSource));
    }
  },

  async addPassageToSource(
    sourceId: string,
    passage: Omit<BrandSourcePassage, 'id'>
  ): Promise<BrandSourcePassage> {
    const source = inMemorySources.find(s => s.id === sourceId);
    if (!source) throw new Error('Brand source not found');

    const newPassage: BrandSourcePassage = {
      ...passage,
      id: `pas-${Date.now().toString(36)}`,
    };

    if (source.versions.length > 0) {
      source.versions[0].passages.push(newPassage);
      source.passage_count = source.versions[0].passages.length;
      source.updated_at = new Date().toISOString();
    }

    return newPassage;
  },

  async createSourceVersion(
    sourceId: string,
    payload: {
      version_tag: string;
      changelog: string;
      passages: BrandSourcePassage[];
    }
  ): Promise<BrandSourceVersion> {
    try {
      return await apiFetch<BrandSourceVersion>(`/sources/${sourceId}/versions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const source = inMemorySources.find(s => s.id === sourceId);
      if (!source) throw new Error('Brand source not found');

      const newVer: BrandSourceVersion = {
        version_id: `${sourceId}-${payload.version_tag}`,
        source_id: sourceId,
        version_tag: payload.version_tag,
        effective_date: new Date().toISOString().split('T')[0],
        status: 'approved',
        created_by: 'Brand Governance Administrator',
        changelog: payload.changelog,
        passages: payload.passages,
      };

      source.versions.unshift(newVer);
      source.current_version = payload.version_tag;
      source.passage_count = payload.passages.length;
      source.updated_at = new Date().toISOString();
      return JSON.parse(JSON.stringify(newVer));
    }
  },
};
