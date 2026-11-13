/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, AssetVersion } from '../../types';
import { MOCK_ASSETS } from './mockData';
import { authService } from './authService';
import { ApiError, apiFetch } from './client';

let inMemoryAssets: Asset[] = [...MOCK_ASSETS];

export interface CreatedAssetResult {
  asset: Asset;
  source: 'api';
}

function isAssetWithCurrentVersion(value: unknown): value is Asset {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Partial<Asset>;
  return typeof asset.id === 'string'
    && asset.id.length > 0
    && typeof asset.title === 'string'
    && asset.title.length > 0
    && typeof asset.created_by?.id === 'string'
    && typeof asset.created_at === 'string'
    && typeof asset.updated_at === 'string'
    && typeof asset.current_status === 'string'
    && typeof asset.current_version_id === 'string'
    && asset.current_version_id.length > 0
    && Array.isArray(asset.versions)
    && asset.versions.some(version =>
      !!version
      && typeof version === 'object'
      && version.version_id === asset.current_version_id
      && version.asset_id === asset.id
      && typeof version.content === 'string'
      && typeof version.version_number === 'string'
      && typeof version.created_by?.id === 'string'
    );
}

function cacheAsset(asset: Asset): void {
  const index = inMemoryAssets.findIndex(item => item.id === asset.id);
  if (index >= 0) {
    inMemoryAssets[index] = asset;
  } else {
    inMemoryAssets.unshift(asset);
  }
}

export function isAssetOwnedBy(asset: Asset, userId: string): boolean {
  return asset.created_by.id === userId
    || asset.versions.some(version => version.created_by.id === userId);
}

export function canCreatorOpenAssetDetails(
  asset: Asset,
  userId: string,
  fromSubmissionsList: boolean
): boolean {
  return fromSubmissionsList && isAssetOwnedBy(asset, userId);
}

export const assetsService = {
  async getAssets(): Promise<Asset[]> {
    try {
      return await apiFetch<Asset[]>('/assets');
    } catch {
      return [...inMemoryAssets];
    }
  },

  async getAssetById(assetId: string): Promise<Asset | null> {
    try {
      return await apiFetch<Asset>(`/assets/${assetId}`);
    } catch {
      return inMemoryAssets.find(a => a.id === assetId) || null;
    }
  },

  async getAssetVersion(assetId: string, versionId: string): Promise<AssetVersion | null> {
    try {
      return await apiFetch<AssetVersion>(`/assets/${assetId}/versions/${versionId}`);
    } catch {
      const asset = inMemoryAssets.find(a => a.id === assetId);
      if (!asset) return null;
      return asset.versions.find(v => v.version_id === versionId) || null;
    }
  },

  async createAsset(payload: {
    title: string;
    channel: Asset['channel'];
    campaign?: string;
    content: string;
  }): Promise<CreatedAssetResult> {
    const asset = await apiFetch<unknown>('/assets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!isAssetWithCurrentVersion(asset)) {
      throw new ApiError(
        'The server response was incomplete, so the save outcome is unconfirmed.',
        200,
        undefined,
        'unknown'
      );
    }
    cacheAsset(asset);
    return { asset, source: 'api' };
  },

  updateLocalSnapshot(asset: Asset): void {
    cacheAsset(asset);
  },

  /**
   * Product Rule: Every saved revision creates a NEW immutable asset version.
   * Earlier approval does not carry over to newer versions.
   */
  async createAssetVersion(
    assetId: string,
    payload: {
      content: string;
      changelog: string;
    }
  ): Promise<AssetVersion> {
    try {
      return await apiFetch<AssetVersion>(`/assets/${assetId}/versions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const asset = inMemoryAssets.find(a => a.id === assetId);
      if (!asset) throw new Error('Asset not found');

      const currentUser = authService.getCurrentUserSync();
      const nextMajorOrMinor = `v1.${asset.versions.length}`;
      const versionId = `ver-${assetId}-${nextMajorOrMinor.replace('.', '_')}`;

      const newVersion: AssetVersion = {
        version_id: versionId,
        asset_id: assetId,
        version_number: nextMajorOrMinor,
        content: payload.content,
        created_at: new Date().toISOString(),
        created_by: currentUser,
        audit_status: 'draft',
        changelog: payload.changelog,
      };

      // Newer version resets approval per Product Rule 4
      asset.versions.push(newVersion);
      asset.current_version_id = versionId;
      asset.current_status = 'draft';
      asset.updated_at = new Date().toISOString();

      return newVersion;
    }
  },
};
