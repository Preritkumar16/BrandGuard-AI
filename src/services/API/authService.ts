/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole, PermissionAction, RolePermissions } from '../../types';
import { MOCK_USERS } from './mockData';
import { apiFetch } from './client';

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissions> = {
  creator: {
    role: 'creator',
    name: 'Content Creator / Marketing Specialist',
    badge: 'Creator',
    description: 'Submits copy and campaign assets, inspects audit findings, and drafts immutable revision branches.',
    allowedActions: [
      'submit_asset',
      'draft_revision',
      'run_audit',
      'view_audit_log',
    ],
  },
  reviewer: {
    role: 'reviewer',
    name: 'Brand Steward / Compliance Reviewer',
    badge: 'Reviewer',
    description: 'Performs formal human governance sign-offs, requests revisions, and triages the review queue. Subject to Rule 6 (cannot approve self-authored copy).',
    allowedActions: [
      'submit_asset',
      'draft_revision',
      'run_audit',
      'review_decision',
      'approve_asset',
      'view_audit_log',
      'manage_sources',
    ],
  },
  admin: {
    role: 'admin',
    name: 'VP Brand Operations / Super Admin',
    badge: 'Admin',
    description: 'Full supervisory authority across brand governance: ratifies guideline sources, tunes engine strictness, and oversees SLA policies.',
    allowedActions: [
      'submit_asset',
      'draft_revision',
      'run_audit',
      'review_decision',
      'approve_asset',
      'manage_sources',
      'manage_settings',
      'view_audit_log',
    ],
  },
};

const SESSION_KEY = 'bg_session_user';
const AUTH_KEY = 'bg_is_authenticated';

// Load stored session or default to Marcus Vance
const getStoredUser = (): User => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return MOCK_USERS[1]; // Marcus Vance (Reviewer)
};

const getStoredAuthStatus = (): boolean => {
  try {
    const val = localStorage.getItem(AUTH_KEY);
    if (val !== null) return val === 'true';
  } catch {}
  return true; // Default logged in for smooth exploration, can logout anytime to see login screen
};

let currentUser: User = getStoredUser();
let authenticated: boolean = getStoredAuthStatus();

export const authService = {
  isAuthenticated(): boolean {
    return authenticated;
  },

  async login(email: string, password?: string): Promise<User> {
    try {
      const res = await apiFetch<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      currentUser = res.user;
      authenticated = true;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_KEY, 'true');
      return currentUser;
    } catch {
      // Find matching mock user by email
      const matched = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        id: `user-${Date.now().toString(36)}`,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email,
        role: 'creator' as UserRole,
        title: 'Marketing Specialist',
      };
      currentUser = matched;
      authenticated = true;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_KEY, 'true');
      return currentUser;
    }
  },

  async register(payload: { name: string; email: string; role: UserRole; title?: string }): Promise<User> {
    try {
      const res = await apiFetch<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      currentUser = res.user;
      authenticated = true;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_KEY, 'true');
      return currentUser;
    } catch {
      const newUser: User = {
        id: `user-${Date.now().toString(36)}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        title: payload.title || 'Brand Governance Member',
        avatar: payload.name.slice(0, 2).toUpperCase(),
      };
      MOCK_USERS.push(newUser);
      currentUser = newUser;
      authenticated = true;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_KEY, 'true');
      return currentUser;
    }
  },

  async logout(): Promise<void> {
    authenticated = false;
    localStorage.setItem(AUTH_KEY, 'false');
  },

  async getMe(): Promise<User> {
    try {
      return await apiFetch<User>('/auth/me');
    } catch {
      return currentUser;
    }
  },

  async switchUser(userId: string): Promise<User> {
    const found = MOCK_USERS.find(u => u.id === userId);
    if (found) {
      currentUser = found;
      authenticated = true;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_KEY, 'true');
    }
    return currentUser;
  },

  getAvailableUsers(): User[] {
    return MOCK_USERS;
  },

  getCurrentUserSync(): User {
    return currentUser;
  },

  getRoleDefinition(role: UserRole): RolePermissions {
    return ROLE_DEFINITIONS[role];
  },

  getAllRoleDefinitions(): Record<UserRole, RolePermissions> {
    return ROLE_DEFINITIONS;
  },

  /**
   * Evaluates role-based authorization for an action.
   * Also checks Rule 6: A creator cannot approve their own content.
   */
  checkAuthorization(
    action: PermissionAction,
    user: User = currentUser,
    targetAssetCreatorId?: string
  ): { allowed: boolean; reason?: string } {
    const roleDef = ROLE_DEFINITIONS[user.role];
    if (!roleDef) {
      return { allowed: false, reason: 'Unknown user role' };
    }

    // Basic action permission check
    if (!roleDef.allowedActions.includes(action)) {
      return {
        allowed: false,
        reason: `Role '${user.role.toUpperCase()}' is not authorized to perform action '${action}'. Required role: ${
          action === 'manage_settings'
            ? 'Admin'
            : action === 'approve_asset'
            ? 'Reviewer or Admin'
            : action === 'manage_sources'
            ? 'Reviewer or Admin'
            : 'Authorized personnel'
        }.`,
      };
    }

    // Strict Rule 6 Enforcement: Creator cannot approve their own content!
    if (action === 'approve_asset' && targetAssetCreatorId && targetAssetCreatorId === user.id) {
      return {
        allowed: false,
        reason: 'Rule 6 Conflict of Interest: A creator must not approve their own content. Escalation to an independent brand steward is required.',
      };
    }

    return { allowed: true };
  },
};
