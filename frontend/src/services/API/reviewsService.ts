/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReviewDecision, ReviewQueueItem } from '../../types';
import { MOCK_REVIEW_QUEUE, MOCK_ASSETS } from './mockData';
import { ApiError, apiFetch } from './client';

let inMemoryQueue: ReviewQueueItem[] = [...MOCK_REVIEW_QUEUE];

export type ReviewQueueSource = 'api' | 'demo' | 'unavailable';

export interface ReviewQueueResult {
  items: ReviewQueueItem[];
  source: ReviewQueueSource;
}

export interface SubmitReviewResult {
  success: boolean;
  message?: string;
}

function isReviewQueueItem(value: unknown): value is ReviewQueueItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ReviewQueueItem>;
  const creator = item.creator;
  const roles = ['admin', 'source_owner', 'creator', 'reviewer', 'compliance_reviewer'];
  return typeof item.asset_id === 'string'
    && typeof item.version_id === 'string'
    && typeof item.asset_title === 'string'
    && typeof item.channel === 'string'
    && typeof item.version_number === 'string'
    && !!creator
    && typeof creator.id === 'string'
    && typeof creator.name === 'string'
    && typeof creator.email === 'string'
    && typeof creator.role === 'string'
    && roles.includes(creator.role)
    && typeof item.submitted_at === 'string'
    && Number.isFinite(Date.parse(item.submitted_at))
    && (item.priority === 'high' || item.priority === 'medium' || item.priority === 'low')
    && Number.isFinite(item.breach_count)
    && Number.isFinite(item.warning_count)
    && typeof item.status === 'string'
    && Number.isFinite(item.sla_hours_remaining);
}

function validateQueue(value: unknown): ReviewQueueItem[] {
  if (!Array.isArray(value) || !value.every(isReviewQueueItem)) {
    throw new ApiError('The review queue response was incomplete.', 200, value, 'unknown');
  }
  return value;
}

function isReviewDecision(
  value: unknown,
  versionId: string,
  expectedDecision: ReviewDecision['decision']
): value is ReviewDecision {
  if (!value || typeof value !== 'object') return false;
  const decision = value as Partial<ReviewDecision>;
  const reviewer = decision.reviewer;
  const roles = ['admin', 'source_owner', 'creator', 'reviewer', 'compliance_reviewer'];
  return typeof decision.decision_id === 'string'
    && decision.decision_id.length > 0
    && decision.version_id === versionId
    && !!reviewer
    && typeof reviewer.id === 'string'
    && typeof reviewer.name === 'string'
    && typeof reviewer.email === 'string'
    && typeof reviewer.role === 'string'
    && roles.includes(reviewer.role)
    && decision.decision === expectedDecision
    && typeof decision.notes === 'string'
    && typeof decision.timestamp === 'string'
    && Number.isFinite(Date.parse(decision.timestamp));
}

export const reviewsService = {
  async getQueue(): Promise<ReviewQueueResult> {
    try {
      return {
        items: validateQueue(await apiFetch<unknown>('/reviews/queue')),
        source: 'api',
      };
    } catch {
      return { items: [...inMemoryQueue], source: 'demo' };
    }
  },

  async refreshQueue(): Promise<ReviewQueueItem[]> {
    return validateQueue(await apiFetch<unknown>('/reviews/queue'));
  },

  async submitReview(assetId: string, versionId: string): Promise<SubmitReviewResult> {
    const response = await apiFetch<unknown>(`/assets/${assetId}/versions/${versionId}/submit-review`, {
      method: 'POST',
    });
    if (!response || typeof response !== 'object'
      || typeof (response as Partial<SubmitReviewResult>).success !== 'boolean') {
      throw new ApiError(
        'The server response did not confirm the review submission.',
        200,
        response,
        'unknown'
      );
    }

    const result = response as SubmitReviewResult;
    return {
      success: result.success,
      message: typeof result.message === 'string' ? result.message : undefined,
    };
  },

  /**
   * Submit formal review decision.
   * Enforces Rule 6: A creator must not approve their own content.
   */
  async submitDecision(
    assetId: string,
    versionId: string,
    payload: {
      decision: 'approved' | 'rejected' | 'revision_requested';
      notes: string;
    }
  ): Promise<ReviewDecision> {
    const response = await apiFetch<unknown>(`/assets/${assetId}/versions/${versionId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!isReviewDecision(response, versionId, payload.decision)) {
      throw new ApiError(
        'The server response did not confirm a decision for this version.',
        200,
        response,
        'unknown'
      );
    }
    return response;
  },

  async getVersionHistory(assetId: string, versionId: string): Promise<ReviewDecision[]> {
    try {
      return await apiFetch<ReviewDecision[]>(`/assets/${assetId}/versions/${versionId}/history`);
    } catch {
      const asset = MOCK_ASSETS.find(a => a.id === assetId);
      const version = asset?.versions.find(v => v.version_id === versionId);
      return version?.review_decision ? [version.review_decision] : [];
    }
  },
};
