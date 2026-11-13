
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BackendBrandSource } from '../../types';
import { apiFetch } from './client';

export interface SourceApprovalResponse {
  message: string;
  version_id: string;
  indexed_passages: number;
  status: string;
}

export const sourcesService = {
  /**
   * Retrieve sources belonging to the authenticated organisation.
   */
  async getSources(): Promise<BackendBrandSource[]> {
    return apiFetch<BackendBrandSource[]>('/sources/');
  },

  /**
   * Upload a source document.
   * Supported formats: PDF, TXT, DOCX.
   * Maximum file size: 15 MB.
   */
  async createSource(formData: FormData): Promise<BackendBrandSource> {
    return apiFetch<BackendBrandSource>('/sources/', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Approve and index a source version.
   * The backend prevents the original uploader from approving their own version.
   */
  async approveSourceVersion(
    sourceId: string,
    versionId: string
  ): Promise<SourceApprovalResponse> {
    return apiFetch<SourceApprovalResponse>(
      `/sources/${encodeURIComponent(sourceId)}/versions/${encodeURIComponent(versionId)}/approve`,
      {
        method: 'POST',
      }
    );
  },
};
