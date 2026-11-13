
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReviewDecision, ReviewQueueItem } from '../../types';
import { apiFetch } from './client';

export const reviewsService = {
  async getQueue(): Promise<ReviewQueueItem[]> {
    throw new Error(
      'Review queue is not available yet. The backend endpoint has not been implemented.'
    );
  },

  async submitReview(
    _assetId: string,
    _versionId: string
  ): Promise<{ success: boolean; message: string }> {
    throw new Error(
      'Submitting assets for human review is not available yet. The backend endpoint has not been implemented.'
    );
  },

  async submitDecision(
    _assetId: string,
    _versionId: string,
    _payload: {
      decision: 'approved' | 'rejected' | 'revision_requested';
      notes: string;
    }
  ): Promise<ReviewDecision> {
    throw new Error(
      'Recording review decisions is not available yet. The backend endpoint has not been implemented.'
    );
  },

  async getVersionHistory(
    assetId: string,
    versionId: string
  ): Promise<ReviewDecision[]> {
    return apiFetch<ReviewDecision[]>(
      `/assets/${encodeURIComponent(assetId)}/versions/${encodeURIComponent(versionId)}/history`
    );
  },
};
