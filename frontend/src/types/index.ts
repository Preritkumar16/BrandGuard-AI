/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'admin'
  | 'source_owner'
  | 'creator'
  | 'reviewer'
  | 'compliance_reviewer';

export type PermissionAction =
  | 'submit_asset'
  | 'draft_revision'
  | 'run_audit'
  | 'review_decision'
  | 'approve_asset'
  | 'manage_sources'
  | 'manage_settings'
  | 'view_audit_log'
  | 'view_users'
  | 'manage_users'
  | 'view_sources'
  | 'upload_source'
  | 'view_compliance'
  | 'export_report'
  | 'view_assets'
  | 'view_queue';

export interface RolePermissions {
  role: UserRole;
  name: string;
  badge: string;
  description: string;
  allowedActions: PermissionAction[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title?: string;
}

export type ComplianceStatus = 
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'review_required'
  | 'breach'
  | 'failed'
  | 'unavailable'
  | 'deprecated';

export type FindingSeverity = 'breach' | 'warning' | 'compliant' | 'unverified';

export interface BrandSourcePassage {
  id: string;
  section: string;
  rule_title: string;
  text: string;
  rule_type: 'mandatory_disclaimer' | 'prohibited_phrase' | 'tone_constraint' | 'trademark_syntax' | 'factual_claim';
  severity: FindingSeverity;
}

export interface BrandSourceVersion {
  version_id: string;
  source_id: string;
  version_tag: string;
  effective_date: string;
  status: 'approved' | 'in_review' | 'draft' | 'deprecated';
  created_by: string;
  changelog: string;
  passages: BrandSourcePassage[];
}

export interface BrandSource {
  id: string;
  title: string;
  category: 'legal' | 'tone_voice' | 'trademark' | 'security' | 'product';
  description: string;
  status: 'approved' | 'in_review' | 'draft' | 'deprecated';
  current_version: string;
  versions: BrandSourceVersion[];
  passage_count: number;
  updated_at: string;
}

export interface EvidenceReference {
  source_id: string;
  source_title: string;
  source_version: string;
  passage_id: string;
  section: string;
  excerpt: string;
  match_confidence: number; // e.g. 0.96 (96%)
}

export interface AuditFinding {
  id: string;
  version_id: string;
  category: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  flagged_text: string;
  suggested_replacement: string;
  evidence: EvidenceReference;
  status: 'open' | 'accepted' | 'dismissed';
}

export interface ReviewDecision {
  decision_id: string;
  version_id: string;
  reviewer: User;
  decision: 'approved' | 'rejected' | 'revision_requested';
  notes: string;
  timestamp: string;
}

export interface AssetVersion {
  version_id: string;
  asset_id: string;
  version_number: string; // e.g. "v1.0", "v1.1"
  content: string;
  created_at: string;
  created_by: User;
  audit_status: ComplianceStatus;
  audit_source?: 'api' | 'local' | 'unavailable';
  audit_server_outcome?: 'confirmed' | 'unknown' | 'rejected';
  audit_summary?: {
    total_findings: number;
    breaches: number;
    warnings: number;
    compliant_checks: number;
    audit_date: string;
    engine_version: string;
  };
  review_decision?: ReviewDecision;
  changelog?: string;
}

export interface Asset {
  id: string;
  title: string;
  channel: 'linkedin' | 'email' | 'landing_page' | 'press_release' | 'product_sheet' | 'ad_copy';
  campaign?: string;
  created_by: User;
  created_at: string;
  updated_at: string;
  current_status: ComplianceStatus;
  current_version_id: string;
  versions: AssetVersion[];
}

export interface ReviewQueueItem {
  asset_id: string;
  version_id: string;
  asset_title: string;
  channel: string;
  version_number: string;
  creator: User;
  submitted_at: string;
  priority: 'high' | 'medium' | 'low';
  breach_count: number;
  warning_count: number;
  status: ComplianceStatus;
  sla_hours_remaining: number;
}
