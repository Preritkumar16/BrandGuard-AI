import { UserRole } from '../types';

export type AppScreen =
  | 'dashboard'
  | 'assets'
  | 'sources'
  | 'activity'
  | 'settings'
  | 'submit'
  | 'asset-workspace'
  | 'queue';

export interface NavItem {
  id: AppScreen;
  label: string;
  section: string;
}

const ADMIN_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Organisation overview', section: 'Organisation' },
  { id: 'assets', label: 'Asset Library', section: 'Organisation' },
  { id: 'sources', label: 'Brand Guidelines', section: 'Sources' },
  { id: 'activity', label: 'Activity History', section: 'Oversight' },
  { id: 'settings', label: 'Settings', section: 'Oversight' },
];

const SOURCE_OWNER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Brand sources', section: 'Sources' },
  { id: 'sources', label: 'Brand Guidelines', section: 'Sources' },
];

const CREATOR_NAV: NavItem[] = [
  { id: 'dashboard', label: 'My submissions', section: 'Workspace' },
  { id: 'submit', label: 'Submit Content', section: 'Workspace' },
  { id: 'sources', label: 'Brand Guidelines', section: 'Reference' },
];

const REVIEWER_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Review overview', section: 'Reviews' },
  { id: 'queue', label: 'Review Queue', section: 'Reviews' },
];

const COMPLIANCE_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Compliance overview', section: 'Governance' },
  { id: 'sources', label: 'Brand Guidelines', section: 'Governance' },
  { id: 'asset-workspace', label: 'Evidence', section: 'Oversight' },
  { id: 'activity', label: 'Activity History', section: 'Oversight' },
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
