/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole, PermissionAction, RolePermissions } from '../../types';
import { MOCK_USERS } from './mockData';
import { apiFetch } from './client';
import { ROLE_META, normalizeRole } from '../../config/roles';
import { ROLE_PERMISSIONS, can } from '../../config/permissions';

const SUPPORT_KEY = 'bg_role_supported';

function roleDefinition(role: UserRole): RolePermissions {
  const meta = ROLE_META[role];
  return {
    role,
    name: meta.name,
    badge: meta.badge,
    description: meta.description,
    allowedActions: ROLE_PERMISSIONS[role],
  };
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissions> = {
  admin: roleDefinition('admin'),
  source_owner: roleDefinition('source_owner'),
  creator: roleDefinition('creator'),
  reviewer: roleDefinition('reviewer'),
  compliance_reviewer: roleDefinition('compliance_reviewer'),
};

const SESSION_KEY = 'bg_session_user';
const AUTH_KEY = 'bg_is_authenticated';

// Load stored session or default to Marcus Vance
const rememberRoleSupport = (supported: boolean) => {
  try {
    localStorage.setItem(SUPPORT_KEY, supported ? 'true' : 'false');
  } catch {
    /* session flag is optional */
  }
};

const applyRole = (user: User): User => {
  const resolved = normalizeRole(user.role);
  rememberRoleSupport(resolved.supported);
  return { ...user, role: resolved.role };
};

const getStoredUser = (): User => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return applyRole(JSON.parse(raw) as User);
  } catch {
    /* fall through to the default reviewer persona */
  }
  return MOCK_USERS[1];
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
      currentUser = applyRole(res.user);
      authenticated = true;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(AUTH_KEY, 'true');
      return currentUser;
    } catch {
      const matched = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        id: `user-${Date.now().toString(36)}`,
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        email,
        role: 'creator' as UserRole,
        title: 'Marketing Specialist',
      };
      currentUser = applyRole(matched);
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
      currentUser = applyRole(res.user);
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
      currentUser = applyRole(await apiFetch<User>('/auth/me'));
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      return currentUser;
    } catch {
      return currentUser;
    }
  },

  isCurrentRoleSupported(): boolean {
    try {
      return localStorage.getItem(SUPPORT_KEY) !== 'false';
    } catch {
      return true;
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
    return can(user, action, targetAssetCreatorId);
  },
};
