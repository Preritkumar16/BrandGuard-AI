
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  UserRole,
  PermissionAction,
  RolePermissions,
} from '../../types';

import { apiFetch, AUTH_TOKEN_KEY } from './client';
import { ROLE_META, normalizeRole, roleLabel } from '../../config/roles';
import { ROLE_PERMISSIONS, can } from '../../config/permissions';

const SESSION_KEY = 'bg_session_user';
const AUTH_KEY = 'bg_is_authenticated';
const SUPPORT_KEY = 'bg_role_supported';

interface BackendUser {
  id: string;
  organisation_id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterPayload {
  organisation_name: string;
  name: string;
  email: string;
  password: string;
}

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

const rememberRoleSupport = (supported: boolean) => {
  try {
    localStorage.setItem(SUPPORT_KEY, supported ? 'true' : 'false');
  } catch {
    // Optional UI metadata.
  }
};

function mapBackendUser(data: BackendUser): User {
  if (!data.is_active) {
    throw new Error('This account is inactive. Contact your administrator.');
  }

  const resolved = normalizeRole(data.role);
  rememberRoleSupport(resolved.supported);

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: resolved.role,
    title: roleLabel(resolved.role),
    avatar: data.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join(''),
  };
}

function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_KEY, 'true');
}

function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.setItem(AUTH_KEY, 'false');
}

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

let currentUser: User | null = getStoredUser();
let authenticated = false;

try {
  authenticated =
    localStorage.getItem(AUTH_KEY) === 'true' &&
    Boolean(localStorage.getItem(AUTH_TOKEN_KEY)) &&
    Boolean(currentUser);
} catch {
  authenticated = false;
}

export const authService = {
  isAuthenticated(): boolean {
    return authenticated;
  },

  async login(email: string, password?: string): Promise<User> {
    if (!password) {
      throw new Error('Password is required.');
    }

    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.access_token) {
      throw new Error('The server did not return an access token.');
    }

    localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);

    try {
      const user = await this.getMe();
      return user;
    } catch (error) {
      clearSession();
      currentUser = null;
      authenticated = false;
      throw error;
    }
  },

  async register(payload: RegisterPayload): Promise<User> {
    const response = await apiFetch<BackendUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // Registration does not return a JWT.
    // The user must sign in separately.
    return mapBackendUser(response);
  },

  async logout(): Promise<void> {
    clearSession();
    currentUser = null;
    authenticated = false;
  },

  async getMe(): Promise<User> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      throw new Error('No active backend session. Please sign in.');
    }

    try {
      const response = await apiFetch<BackendUser>('/auth/me');
      const user = mapBackendUser(response);

      currentUser = user;
      authenticated = true;
      saveSession(user);

      return user;
    } catch (error) {
      clearSession();
      currentUser = null;
      authenticated = false;
      throw error;
    }
  },

  isCurrentRoleSupported(): boolean {
    try {
      return localStorage.getItem(SUPPORT_KEY) !== 'false';
    } catch {
      return true;
    }
  },

  // Demo-user switching is intentionally disabled in backend mode.
  async switchUser(_userId: string): Promise<User> {
    throw new Error(
      'Demo-user switching is unavailable in backend authentication mode.'
    );
  },

  getAvailableUsers(): User[] {
    return [];
  },

  getCurrentUserSync(): User {
    if (!currentUser) {
      throw new Error('No authenticated user is available.');
    }

    return currentUser;
  },

  getRoleDefinition(role: UserRole): RolePermissions {
    return ROLE_DEFINITIONS[role];
  },

  getAllRoleDefinitions(): Record<UserRole, RolePermissions> {
    return ROLE_DEFINITIONS;
  },

  checkAuthorization(
    action: PermissionAction,
    user: User = this.getCurrentUserSync(),
    targetAssetCreatorId?: string
  ): { allowed: boolean; reason?: string } {
    return can(user, action, targetAssetCreatorId);
  },
};
