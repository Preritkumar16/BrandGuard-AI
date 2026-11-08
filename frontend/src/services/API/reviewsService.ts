/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReviewDecision, ReviewQueueItem } from '../../types';
import { MOCK_REVIEW_QUEUE, MOCK_ASSETS } from './mockData';
import { authService } from './authService';
import { apiFetch } from './client';

let inMemoryQueue: ReviewQueueItem[] = [...MOCK_REVIEW_QUEUE];

export const reviewsService = {
  async getQueue(): Promise<ReviewQueueItem[]> {
    try {
      return await apiFetch<ReviewQueueItem[]>('/reviews/queue');
    } catch {
      return [...inMemoryQueue];
    }
  },

  async submitReview(assetId: string, versionId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiFetch(`/assets/${assetId}/versions/${versionId}/submit-review`, {
        method: 'POST',
      });
    } catch {
      const asset = MOCK_ASSETS.find(a => a.id === assetId);
      const version = asset?.versions.find(v => v.version_id === versionId);
      if (!asset || !version) throw new Error('Asset or version not found');

      version.audit_status = 'in_review';
      asset.current_status = 'in_review';

      // Check if already in queue
      const existing = inMemoryQueue.find(q => q.version_id === versionId);
      if (!existing) {
        inMemoryQueue.unshift({
          asset_id: asset.id,
          version_id: version.version_id,
          asset_title: asset.title,
          channel: asset.channel,
          version_number: version.version_number,
          creator: version.created_by,
          submitted_at: new Date().toISOString(),
          priority: 'high',
          breach_count: version.audit_summary?.breaches || 0,
          warning_count: version.audit_summary?.warnings || 0,
          status: 'in_review',
          sla_hours_remaining: 8.0,
        });
      }

      return { success: true, message: 'Submitted for human review' };
    }
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
    try {
      return await apiFetch<ReviewDecision>(`/assets/${assetId}/versions/${versionId}/decision`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {
      const asset = MOCK_ASSETS.find(a => a.id === assetId);
      const version = asset?.versions.find(v => v.version_id === versionId);
      if (!asset || !version) throw new Error('Asset or version not found');

      const reviewer = authService.getCurrentUserSync();

      // Rule 6 Enforcement: A creator must not approve their own content!
      if (payload.decision === 'approved' && version.created_by.id === reviewer.id) {
        throw new Error('Compliance Violation (Rule 6): A creator cannot approve their own content. Escalation to an independent brand steward is required.');
      }

      const decisionRecord: ReviewDecision = {
        decision_id: `dec-${Date.now().toString(36)}`,
        version_id: versionId,
        reviewer,
        decision: payload.decision,
        notes: payload.notes,
        timestamp: new Date().toISOString(),
      };

      version.review_decision = decisionRecord;

      if (payload.decision === 'approved') {
        version.audit_status = 'approved';
        asset.current_status = 'approved';
      } else if (payload.decision === 'rejected') {
        version.audit_status = 'rejected';
        asset.current_status = 'rejected';
      } else {
        version.audit_status = 'review_required';
        asset.current_status = 'review_required';
      }

      // Remove from queue
      inMemoryQueue = inMemoryQueue.filter(q => q.version_id !== versionId);

      return decisionRecord;
    }
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
