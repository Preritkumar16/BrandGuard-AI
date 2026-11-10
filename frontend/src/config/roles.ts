import { UserRole } from '../types';

export interface RoleMeta {
  role: UserRole;
  name: string;
  badge: string;
  description: string;
  homeLabel: string;
}

export const ROLE_META: Record<UserRole, RoleMeta> = {
  admin: {
    role: 'admin',
    name: 'Organisation Admin',
    badge: 'Organisation Admin',
    description: 'Tenant governance, user provisioning, and oversight. Does not auto-approve content.',
    homeLabel: 'Organisation overview',
  },
  source_owner: {
    role: 'source_owner',
    name: 'Source Owner',
    badge: 'Source Owner',
    description: 'Owns brand-source custody, uploads, and version history.',
    homeLabel: 'Source dashboard',
  },
  creator: {
    role: 'creator',
    name: 'Creator',
    badge: 'Creator',
    description: 'Submits marketing assets, inspects findings, and resubmits revisions.',
    homeLabel: 'Creator dashboard',
  },
  reviewer: {
    role: 'reviewer',
    name: 'Reviewer / Approver',
    badge: 'Reviewer / Approver',
    description: 'Inspects a specific version and approves, rejects, or requests changes.',
    homeLabel: 'Review dashboard',
  },
  compliance_reviewer: {
    role: 'compliance_reviewer',
    name: 'Compliance Reviewer',
    badge: 'Compliance Reviewer',
    description: 'Read-only oversight of findings, evidence, and decision history.',
    homeLabel: 'Compliance dashboard',
  },
};

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: 'admin',
  organisation_admin: 'admin',
  organization_admin: 'admin',
  source_owner: 'source_owner',
  sourceowner: 'source_owner',
  creator: 'creator',
  reviewer: 'reviewer',
  approver: 'reviewer',
  compliance_reviewer: 'compliance_reviewer',
  compliance: 'compliance_reviewer',
};

export function normalizeRole(raw: string | undefined | null): { role: UserRole; supported: boolean } {
  if (!raw) return { role: 'creator', supported: false };
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const mapped = ROLE_ALIASES[key];
  if (!mapped) return { role: 'creator', supported: false };
  return { role: mapped, supported: true };
}

export function roleLabel(role: UserRole): string {
  return ROLE_META[role]?.badge ?? role;
}
