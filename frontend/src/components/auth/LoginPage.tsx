/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
  KeyRound,
  Layers,
} from 'lucide-react';
import { UserRole, User as UserType } from '../../types';
import { authService, ROLE_DEFINITIONS } from '../../services/API/authService';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Badge } from '../UI/Badge';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('marcus.vance@brandguard.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('creator');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableUsers = authService.getAvailableUsers();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide an enterprise work email.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.login(email, password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and work email are required.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.register({
        name,
        email,
        role: selectedRole,
        title: title || (selectedRole === 'admin' ? 'Brand Administrator' : selectedRole === 'reviewer' ? 'Compliance Reviewer' : 'Marketing Specialist'),
      });
      onLoginSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSignIn = async (userId: string) => {
    try {
      setIsLoading(true);
      const user = await authService.switchUser(userId);
      onLoginSuccess(user);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Brand Logo & Headline */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#6366F1] shadow-[0_0_24px_-4px_rgba(99,102,241,0.35)] mb-2">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            BrandGuard AI
          </h1>
          <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
            Enterprise Brand Governance & Evidence-Linked Content Compliance Console
          </p>
        </div>

        {/* Main Grid: Sign In Form + Role Based Access Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#253047] rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65)] p-6 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-[#253047]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                }}
                className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'signin'
                    ? 'border-[#6366F1] text-[#F8FAFC]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Enterprise Credentials Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                }}
                className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'register'
                    ? 'border-[#6366F1] text-[#F8FAFC]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Provision New Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                {error}
              </div>
            )}

            {/* Quick Demo Role Selector */}
            <div className="p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] block">
                Quick Role-Based Demo Sign-In (Select Persona):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {availableUsers.map(user => {
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickSignIn(user.id)}
                      className="p-2.5 rounded-md bg-[#161E2E] border border-[#253047] hover:border-[#6366F1] transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors truncate">
                          {user.name.split(' ')[0]}
                        </span>
                        <Badge
                          variant={
                            user.role === 'admin'
                              ? 'info'
                              : user.role === 'reviewer'
                              ? 'compliant'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate leading-tight">
                        {user.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form */}
            {activeTab === 'signin' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Input
                  label="Work Email Address"
                  type="email"
                  leftIcon={<Mail className="w-4 h-4" />}
                  placeholder="name@organization.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password / Token"
                  type="password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  placeholder="Enter enterprise credentials"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded bg-[#0D1220] border-[#253047] text-[#6366F1] focus:ring-[#6366F1]"
                    />
                    <span>Remember authorization token</span>
                  </label>
                  <span className="text-[11px] text-[#64748B]">SAML 2.0 / Okta Ready</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Authenticate & Enter Console
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Full Name"
                  leftIcon={<User className="w-4 h-4" />}
                  placeholder="e.g. Jordan Hayes"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />

                <Input
                  label="Corporate Email"
                  type="email"
                  leftIcon={<Mail className="w-4 h-4" />}
                  placeholder="jordan.hayes@brandguard.internal"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label="Assigned Governance Role (RBAC)"
                    options={[
                      { value: 'creator', label: 'Creator (Draft & Submit Only)' },
                      { value: 'reviewer', label: 'Reviewer (Governance Sign-off)' },
                      { value: 'admin', label: 'Admin (Full Policy Authority)' },
                    ]}
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value as UserRole)}
                  />
                  <Input
                    label="Job Title / Division"
                    placeholder="e.g. Lead Brand Strategist"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Provision User & Grant Access
                </Button>
              </form>
            )}
          </div>

          {/* Right: RBAC Authorization Matrix & Security Rules (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#111827] border border-[#253047] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#6366F1]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                  Role-Based Access Control (RBAC)
                </h3>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                BrandGuard AI strictly isolates duties to enforce brand integrity and legal compliance across three functional tiers:
              </p>

              {/* Roles Breakdown */}
              <div className="space-y-2.5 text-xs">
                {/* Creator */}
                <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">1. Content Creator</span>
                    <Badge variant="warning" size="sm">CREATOR</Badge>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Can draft copy, submit assets, and stage guideline revisions.
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#EF4444] font-mono">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cannot approve content or modify guidelines (Rule 6).</span>
                  </div>
                </div>

                {/* Reviewer */}
                <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">2. Brand Reviewer</span>
                    <Badge variant="compliant" size="sm">REVIEWER</Badge>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Can review submissions, record approvals/rejections, and manage the triage queue.
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#F59E0B] font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Forbidden from approving self-authored drafts.</span>
                  </div>
                </div>

                {/* Admin */}
                <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">3. Brand Administrator</span>
                    <Badge variant="info" size="sm">ADMIN</Badge>
                  </div>
                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Supervisory authority. Ratifies new guideline sources, configures SLA hours, and tunes engine sensitivity.
                  </div>
                </div>
              </div>
            </div>

            {/* Security Callout */}
            <div className="p-3.5 rounded-xl bg-[#0D1220] border border-[#253047] text-[11px] text-[#64748B] flex items-center justify-between">
              <span>SOC-2 Type II Validated</span>
              <span className="text-[#10B981] font-mono">Session Guard Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
