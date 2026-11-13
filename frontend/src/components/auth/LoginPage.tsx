
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
  Building2,
  ArrowRight,
  Shield,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { User as UserType } from '../../types';
import { authService } from '../../services/API/authService';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Badge } from '../UI/Badge';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [organisationName, setOrganisationName] = useState('');
  const [name, setName] = useState('');
  const [registrationPassword, setRegistrationPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('Please enter your email address and password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const user = await authService.login(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organisationName.trim() || !name.trim() || !email.trim() || !registrationPassword) {
      setError('Please complete all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await authService.register({
        organisation_name: organisationName.trim(),
        name: name.trim(),
        email: email.trim(),
        password: registrationPassword,
      });

      // Registration creates the account but does not authenticate the user.
      setPassword('');
      setRegistrationPassword('');
      setActiveTab('signin');

      setSuccess(
        'Account created successfully. Please sign in using your registered email and password.'
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">

        {/* Brand Header */}
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Authentication Form */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#253047] rounded-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65)] p-6 space-y-6">

            {/* Tabs */}
            <div className="flex border-b border-[#253047]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                  setSuccess(null);
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
                  setSuccess(null);
                }}
                className={`flex-1 pb-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'register'
                    ? 'border-[#6366F1] text-[#F8FAFC]'
                    : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Create Organisation Account
              </button>
            </div>

            {/* Feedback */}
            {error && (
              <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444]">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981] flex gap-2 items-start">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Sign In */}
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
                  label="Password"
                  type="password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Secure token-based authentication</span>
                  <span className="text-[11px] text-[#64748B]">
                    JWT Authentication
                  </span>
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

              /* Registration */
              <form onSubmit={handleRegister} className="space-y-4">

                <Input
                  label="Organisation Name"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  placeholder="Enter organisation name"
                  value={organisationName}
                  onChange={e => setOrganisationName(e.target.value)}
                  required
                />

                <Input
                  label="Full Name"
                  leftIcon={<User className="w-4 h-4" />}
                  placeholder="Enter your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />

                <Input
                  label="Corporate Email"
                  type="email"
                  leftIcon={<Mail className="w-4 h-4" />}
                  placeholder="name@organization.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Create Password"
                  type="password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  placeholder="Create your password"
                  value={registrationPassword}
                  onChange={e => setRegistrationPassword(e.target.value)}
                  required
                />

                <div className="p-3 rounded-lg bg-[#0D1220] border border-[#6366F1]/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#6366F1]" />
                    <span className="text-xs font-semibold text-[#F8FAFC]">
                      Initial Account Role
                    </span>
                    <Badge variant="info" size="sm">Admin</Badge>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    The backend automatically assigns the organisation creator
                    the Admin role. Additional role assignment is not currently
                    part of the registration API.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Create Organisation Account
                </Button>
              </form>
            )}
          </div>

          {/* RBAC Information */}
          <div className="lg:col-span-5 space-y-4">

            <div className="bg-[#111827] border border-[#253047] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#6366F1]" />
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Role-Based Access Control (RBAC)
                </h3>
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed">
                BrandGuard AI separates responsibilities to support brand
                integrity and compliance across different functional roles.
              </p>

              <div className="space-y-2.5 text-xs">

                {/* Creator */}
                <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">
                      1. Content Creator
                    </span>
                    <Badge variant="warning" size="sm">Creator</Badge>
                  </div>

                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Can draft copy, submit assets, and stage guideline revisions.
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#EF4444]">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cannot approve content or modify guidelines.</span>
                  </div>
                </div>

                {/* Reviewer */}
                <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">
                      2. Brand Reviewer
                    </span>
                    <Badge variant="compliant" size="sm">Reviewer</Badge>
                  </div>

                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Can review submissions, record approvals/rejections, and
                    manage the triage queue.
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[#F59E0B]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Cannot approve self-authored drafts.</span>
                  </div>
                </div>

                {/* Admin */}
                <div className="p-3 rounded-lg bg-[#0D1220] border border-[#253047] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#F8FAFC]">
                      3. Admin
                    </span>
                    <Badge variant="info" size="sm">Admin</Badge>
                  </div>

                  <div className="text-[11px] text-[#94A3B8] leading-normal">
                    Supervisory authority for organisation-level administration
                    and guideline approval.
                  </div>
                </div>
              </div>
            </div>

            {/* Security Callout */}
            <div className="p-3.5 rounded-xl bg-[#0D1220] border border-[#253047] text-[11px] text-[#64748B] flex items-center justify-between">
              <span>JWT-based Authentication</span>
              <span className="text-sm text-[#10B981]">
                Secure Session
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
