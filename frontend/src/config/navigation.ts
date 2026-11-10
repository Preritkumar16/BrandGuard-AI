import { UserRole } from '../types';

export type AppScreen =
  | 'dashboard'
  | 'assets'
  | 'users'
  | 'roles'
  | 'sources'
  | 'activity'
  | 'settings'
  | 'submit'
  | 'asset-workspace'
  | 'queue'
  | 'findings'
  | 'reports'
  | 'source-upload'
  | 'source-detail'
  | 'source-history'
  | 'feedback';

export interface NavItem {
  id: AppScreen;
  label: string;
  section: string;
}

const ADMIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Overview', section: 'Organisation' },
  { id: 'assets', label: 'All Assets', section: 'Organisation' },
  { id: 'users', label: 'User Management', section: 'Access' },
  { id: 'roles', label: 'Roles & Permissions', section: 'Access' },
  { id: 'sources', label: 'Brand Sources', section: 'Sources' },
  { id: 'activity', label: 'Activity History', section: 'Oversight' },
  { id: 'settings', label: 'Admin Settings', section: 'Oversight' },
];

const SOURCE_OWNER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Source Dashboard', section: 'Sources' },
  { id: 'sources', label: 'Brand Sources', section: 'Sources' },
  { id: 'source-upload', label: 'Upload Source', section: 'Sources' },
  { id: 'source-detail', label: 'Source Detail', section: 'Sources' },
  { id: 'source-history', label: 'Version History', section: 'Sources' },
];

const CREATOR_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Creator Dashboard', section: 'Workspace' },
  { id: 'submit', label: 'Submit Asset', section: 'Workspace' },
  { id: 'asset-workspace', label: 'Asset Workspace', section: 'Review' },
  { id: 'source-history', label: 'Version History', section: 'Review' },
  { id: 'feedback', label: 'Feedback', section: 'Review' },
];

const REVIEWER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Review Dashboard', section: 'Reviews' },
  { id: 'queue', label: 'Review Queue', section: 'Reviews' },
  { id: 'asset-workspace', label: 'Asset Review', section: 'Decision' },
  { id: 'findings', label: 'Evidence', section: 'Decision' },
  { id: 'feedback', label: 'Approval Actions', section: 'Decision' },
];

const COMPLIANCE_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Compliance Dashboard', section: 'Governance' },
  { id: 'findings', label: 'Compliance Findings', section: 'Governance' },
  { id: 'sources', label: 'Brand Sources', section: 'Governance' },
  { id: 'asset-workspace', label: 'Evidence', section: 'Oversight' },
  { id: 'activity', label: 'Decision History', section: 'Oversight' },
  { id: 'reports', label: 'Reports', section: 'Oversight' },
];

export const ROLE_NAVIGATION: Record<UserRole, NavItem[]> = {
  admin: ADMIN_NAV,
  source_owner: SOURCE_OWNER_NAV,
  creator: CREATOR_NAV,
  reviewer: REVIEWER_NAV,
  compliance_reviewer: COMPLIANCE_NAV,
};

export function navigationFor(role: UserRole): NavItem[] {
  return ROLE_NAVIGATION[role] ?? CREATOR_NAV;
}

export function homeScreen(): AppScreen {
  return 'dashboard';
}

export function canOpenScreen(role: UserRole, screen: AppScreen): boolean {
  return navigationFor(role).some(item => item.id === screen);
}

export function screenLabel(role: UserRole, screen: AppScreen): string {
  return navigationFor(role).find(item => item.id === screen)?.label ?? 'Overview';
}
