/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, AssetVersion } from '../../types';
import { MOCK_ASSETS } from './mockData';
import { authService } from './authService';
import { apiFetch } from './client';

let inMemoryAssets: Asset[] = [...MOCK_ASSETS];

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
  }): Promise<Asset> {
    try {
      return await apiFetch<Asset>('/assets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const currentUser = authService.getCurrentUserSync();
      const assetId = `asset-${Date.now().toString(36)}`;
      const versionId = `ver-${assetId}-1.0`;

      const initialVersion: AssetVersion = {
        version_id: versionId,
        asset_id: assetId,
        version_number: 'v1.0',
        content: payload.content,
        created_at: new Date().toISOString(),
        created_by: currentUser,
        audit_status: 'draft',
        changelog: 'Initial version created.',
      };

      const newAsset: Asset = {
        id: assetId,
        title: payload.title,
        channel: payload.channel,
        campaign: payload.campaign || 'General Marketing',
        created_by: currentUser,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_status: 'draft',
        current_version_id: versionId,
        versions: [initialVersion],
      };

      inMemoryAssets.unshift(newAsset);
      return newAsset;
    }
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
