/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, AssetVersion } from '../../types';
import { MOCK_ASSETS } from './mockData';
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

function isCreatedAssetVersion(
  value: unknown,
  assetId: string,
  previousVersionId: string,
  expectedContent: string
): value is AssetVersion {
  if (!value || typeof value !== 'object') return false;
  const version = value as Partial<AssetVersion>;
  return typeof version.version_id === 'string'
    && version.version_id.length > 0
    && version.version_id !== previousVersionId
    && version.asset_id === assetId
    && typeof version.version_number === 'string'
    && version.version_number.length > 0
    && version.content === expectedContent
    && typeof version.created_at === 'string'
    && typeof version.created_by?.id === 'string'
    && typeof version.audit_status === 'string';
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
  return asset.created_by.id === userId;
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
    previousVersionId: string,
    payload: {
      content: string;
      changelog: string;
    }
  ): Promise<AssetVersion> {
    const version = await apiFetch<unknown>(`/assets/${assetId}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!isCreatedAssetVersion(version, assetId, previousVersionId, payload.content)) {
      throw new ApiError(
        'The server response did not confirm a new version. The save outcome is unconfirmed.',
        200,
        version,
        'unknown'
      );
    }
    return version;
  },
};
