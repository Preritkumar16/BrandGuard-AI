import { PermissionAction, User, UserRole } from '../types';

export type AccessLevel = 'full' | 'view' | 'assigned' | 'none' | 'forbidden';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: [
    'submit_asset',
    'draft_revision',
    'run_audit',
    'review_decision',
    'approve_asset',
    'manage_sources',
    'manage_settings',
    'view_audit_log',
    'view_users',
    'manage_users',
    'view_sources',
    'upload_source',
    'view_compliance',
    'view_assets',
    'view_queue',
  ],
  source_owner: [
    'submit_asset',
    'draft_revision',
    'view_audit_log',
    'manage_sources',
    'view_sources',
    'upload_source',
    'view_assets',
  ],
  creator: [
    'submit_asset',
    'draft_revision',
    'run_audit',
    'view_audit_log',
    'view_assets',
    'view_sources',
  ],
  reviewer: [
    'submit_asset',
    'draft_revision',
    'run_audit',
    'review_decision',
    'approve_asset',
    'manage_sources',
    'view_audit_log',
    'view_sources',
    'view_assets',
    'view_queue',
    'view_compliance',
  ],
  compliance_reviewer: [
    'view_audit_log',
    'view_sources',
    'view_compliance',
    'view_assets',
    'view_queue',
    'review_decision',
  ],
};

export interface MatrixRow {
  domain: string;
  capability: string;
  access: Record<UserRole, AccessLevel>;
}

export const PERMISSION_MATRIX: MatrixRow[] = [
  {
    domain: 'Asset management',
    capability: 'Ingest and submit assets',
    access: { admin: 'view', source_owner: 'view', creator: 'full', reviewer: 'view', compliance_reviewer: 'view' },
  },
  {
    domain: 'Asset management',
    capability: 'Edit content and create a new revision',
    access: { admin: 'view', source_owner: 'view', creator: 'full', reviewer: 'none', compliance_reviewer: 'none' },
  },
  {
    domain: 'Asset management',
    capability: 'View findings and evidence',
    access: { admin: 'full', source_owner: 'view', creator: 'full', reviewer: 'full', compliance_reviewer: 'full' },
  },
  {
    domain: 'Asset management',
    capability: 'Compare versions',
    access: { admin: 'full', source_owner: 'view', creator: 'full', reviewer: 'full', compliance_reviewer: 'full' },
  },
  {
    domain: 'Brand sources',
    capability: 'View brand sources',
    access: { admin: 'full', source_owner: 'full', creator: 'view', reviewer: 'view', compliance_reviewer: 'full' },
  },
  {
    domain: 'Brand sources',
    capability: 'Upload a source',
    access: { admin: 'full', source_owner: 'full', creator: 'none', reviewer: 'none', compliance_reviewer: 'none' },
  },
  {
    domain: 'Brand sources',
    capability: 'Approve or supersede a source version',
    access: { admin: 'none', source_owner: 'none', creator: 'none', reviewer: 'none', compliance_reviewer: 'none' },
  },
  {
    domain: 'Review',
    capability: 'Open the review queue',
    access: { admin: 'view', source_owner: 'none', creator: 'none', reviewer: 'full', compliance_reviewer: 'view' },
  },
  {
    domain: 'Review',
    capability: 'Approve, reject, or request changes',
    access: { admin: 'assigned', source_owner: 'forbidden', creator: 'forbidden', reviewer: 'full', compliance_reviewer: 'view' },
  },
  {
    domain: 'Review',
    capability: 'Approve own asset',
    access: { admin: 'forbidden', source_owner: 'forbidden', creator: 'forbidden', reviewer: 'forbidden', compliance_reviewer: 'forbidden' },
  },
  {
    domain: 'Compliance',
    capability: 'Compliance findings and decision history',
    access: { admin: 'view', source_owner: 'none', creator: 'view', reviewer: 'view', compliance_reviewer: 'full' },
  },
  {
    domain: 'Compliance',
    capability: 'Export a compliance report',
    access: { admin: 'none', source_owner: 'none', creator: 'none', reviewer: 'none', compliance_reviewer: 'none' },
  },
  {
    domain: 'Administration',
    capability: 'User directory and role matrix',
    access: { admin: 'full', source_owner: 'none', creator: 'none', reviewer: 'none', compliance_reviewer: 'none' },
  },
  {
    domain: 'Administration',
    capability: 'Engine settings',
    access: { admin: 'full', source_owner: 'none', creator: 'none', reviewer: 'none', compliance_reviewer: 'none' },
  },
];

export function can(
  user: Pick<User, 'id' | 'role'> | undefined,
  action: PermissionAction,
  targetAssetCreatorId?: string
): { allowed: boolean; reason?: string } {
  if (!user) return { allowed: false, reason: 'Sign in required.' };
  const allowedActions = ROLE_PERMISSIONS[user.role];
  if (!allowedActions) return { allowed: false, reason: 'Unknown user role.' };
  if (!allowedActions.includes(action)) {
    return {
      allowed: false,
      reason: `${user.role} is not allowed to ${action.replaceAll('_', ' ')}. The backend must enforce this as well.`,
    };
  }
  if (action === 'approve_asset' && targetAssetCreatorId && targetAssetCreatorId === user.id) {
    return {
      allowed: false,
      reason: 'A person cannot approve an asset they created. The backend must enforce this as well.',
    };
  }
  return { allowed: true };
}
