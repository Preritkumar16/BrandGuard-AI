/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header, BreadcrumbItem } from './components/layout/Header';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { AssetListView } from './components/assets/AssetListView';
import { AssetDetailView } from './components/assets/AssetDetailView';
import { ReviewQueueView } from './components/reviews/ReviewQueueView';
import { SourcesView } from './components/sources/SourcesView';
import { AuditLogView } from './components/audit/AuditLogView';
import { SettingsView } from './components/settings/SettingsView';
import { GovernanceHubView } from './components/governance/GovernanceHubView';
import { NewAssetModal } from './components/assets/NewAssetModal';
import { NewSourceModal } from './components/sources/NewSourceModal';
import { LoginPage } from './components/auth/LoginPage';
import { RbacMatrixModal } from './components/auth/RbacMatrixModal';
import { NotificationsDrawer, NotificationItem } from './components/common/NotificationsDrawer';
import { ComplianceHealthModal } from './components/common/ComplianceHealthModal';
import { PolicyRulesModal } from './components/common/PolicyRulesModal';
import { Modal } from './components/UI/Modal';
import { Input } from './components/UI/Input';
import { Asset, BrandSource, ReviewQueueItem, User, UserRole } from './types';
import { authService } from './services/API/authService';
import { assetsService } from './services/API/assetsService';
import { sourcesService } from './services/API/sourcesService';
import { reviewsService } from './services/API/reviewsService';
import { auditService } from './services/API/auditService';
import { performGlobalSearch } from './services/API/searchService';
import { Search, FileText, BookOpen, AlertCircle } from 'lucide-react';
import { AppScreen, navigationFor } from './config/navigation';


// Tabs used by the main application content.
type NavTab =
  | 'dashboard'
  | 'governance-hub'
  | 'queue'
  | 'assets'
  | 'sources'
  | 'asset-detail'
  | 'audit-log'
  | 'settings';

// Maps Sidebar screen identifiers to the tabs rendered by App.
const SCREEN_TO_TAB: Partial<Record<AppScreen, NavTab>> = {
  dashboard: 'dashboard',
   assets: 'assets',
  sources: 'sources',
  queue: 'queue',
  settings: 'settings',
  activity: 'audit-log',
  'asset-workspace': 'asset-detail',
  findings: 'queue',
  reports: 'audit-log',
  'source-upload': 'sources',
  'source-detail': 'sources',
  'source-history': 'sources',
  feedback: 'queue',
};

// Keeps the Sidebar's selected screen in sync with the active App tab.
function getScreenForTab(tab: NavTab): AppScreen {
  switch (tab) {
    case 'asset-detail':
      return 'asset-workspace';
    case 'audit-log':
      return 'activity';
    case 'governance-hub':
    case 'sources':
      return 'sources';
    default:
      return tab;
  }
}


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('asset-sentinel-launch');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [sourcesCategoryFilter, setSourcesCategoryFilter] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // User state (RBAC session)
  const [currentUser, setCurrentUser] = useState<User>(authService.getCurrentUserSync());

  // Data states
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sources, setSources] = useState<BrandSource[]>([]);
  const [queue, setQueue] = useState<ReviewQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Drawers and Modals
  const [newAssetModalOpen, setNewAssetModalOpen] = useState<boolean>(false);
  const [newSourceModalOpen, setNewSourceModalOpen] = useState<boolean>(false);
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [complianceHealthOpen, setComplianceHealthOpen] = useState<boolean>(false);
  const [policyRulesOpen, setPolicyRulesOpen] = useState<boolean>(false);
  const [rbacModalOpen, setRbacModalOpen] = useState<boolean>(false);

  // Search Engine state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'asset' | 'passage' | 'finding'>('all');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'review_sla',
      title: 'Review SLA Expiring Soon',
      description: 'Q4 Enterprise SentinelMesh Launch has 3.5h remaining on governance SLA turnaround target.',
      timestamp: '15m ago',
      read: false,
      assetId: 'asset-sentinel-launch',
    },
    {
      id: 'notif-2',
      type: 'breach_alert',
      title: 'Statutory ROI Breach Detected',
      description: 'Audit engine detected unverified "guaranteed 10x ROI" assertion in marketing copy.',
      timestamp: '1h ago',
      read: false,
      assetId: 'asset-sentinel-launch',
    },
    {
      id: 'notif-3',
      type: 'source_update',
      title: 'Brand Tone Standard v2.4 Ratified',
      description: 'Brand Stewardship Committee has published updated guidance on prohibited marketing superlatives.',
      timestamp: 'Yesterday',
      read: true,
      sourceId: 'src-tone-01',
    },
  ]);

  // Initial Data Load
  const refreshAllData = async () => {
    try {
      const [assetsData, sourcesData, queueData, userData] = await Promise.all([
        assetsService.getAssets(),
        sourcesService.getSources(),
        reviewsService.getQueue(),
        authService.getMe(),
      ]);
      setAssets(assetsData);
      setSources(sourcesData);
      setQueue(queueData);
      setCurrentUser(userData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData();
    }
  }, [isAuthenticated]);

  // Keyboard shortcut for ⌘K search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Breadcrumb items
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    switch (currentTab) {
      case 'dashboard':
        return [{ label: 'Executive Operations Overview' }];
      case 'governance-hub':
        return [{ label: 'Policy Assurance & Verification Matrix' }];
      case 'queue':
        return [{ label: 'Human Review Workflow' }];
      case 'assets':
        return [{ label: 'Marketing Content Inventory' }];
      case 'sources':
        return [{ label: 'Brand Guidelines Catalog' }];
      case 'audit-log':
        return [{ label: 'Immutable Audit Trail' }];
      case 'settings':
        return [{ label: 'Governance Engine Settings' }];
      case 'asset-detail': {
        const found = assets.find(a => a.id === selectedAssetId);
        return [
          { label: 'Marketing Content Inventory', tab: 'assets' },
          { label: found ? found.title : 'Asset Inspection' },
        ];
      }
      default:
        return [{ label: 'Overview' }];
    }
  };

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setCurrentTab('asset-detail');
  };

  const handleNavigateToSources = (category?: string) => {
    if (category) {
      setSourcesCategoryFilter(category);
    } else {
      setSourcesCategoryFilter('all');
    }
    setCurrentTab('sources');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    refreshAllData();
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  // If user is not authenticated, render dedicated enterprise LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Execute deep global search
  const allFindings = auditService.getAllFindingsSync();
  const searchResults = performGlobalSearch(searchQuery, assets, sources, allFindings);

  const filteredSearchResults = searchResults.filter(item => {
    if (searchTypeFilter === 'all') return true;
    if (searchTypeFilter === 'asset') return item.type === 'asset';
    if (searchTypeFilter === 'passage') return item.type === 'passage' || item.type === 'source';
    if (searchTypeFilter === 'finding') return item.type === 'finding';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC]">
      {/* Sidebar Navigation Rail */}
      <Sidebar
        items={navigationFor(currentUser.role as UserRole).filter(item =>
          Boolean(SCREEN_TO_TAB[item.id])
        )}
        currentScreen={getScreenForTab(currentTab)}
        onSelectScreen={(screen: AppScreen) => {
          const nextTab = SCREEN_TO_TAB[screen];
          
          if (!nextTab) return;
          
          setCurrentTab(nextTab);
          setMobileSidebarOpen(false);

          if (nextTab === 'assets') {
            refreshAllData();
          }
        }}
        currentUser={currentUser}
        onUserChanged={user => setCurrentUser(user)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() =>
          setSidebarCollapsed(previous => !previous)
        }
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onLogout={handleLogout}
        roleSupported={true}
/>


      {/* Persistent Header */}
      <Header
        breadcrumbs={getBreadcrumbs()}
        onNavigateTab={tab => setCurrentTab(tab)}
        onNewAssetClick={() => setNewAssetModalOpen(true)}
        collapsed={sidebarCollapsed}
        onSearchClick={() => setSearchModalOpen(true)}
        onNotificationsClick={() => setNotificationsOpen(true)}
        unreadNotificationsCount={notifications.filter(n => !n.read).length}
        currentUser={currentUser}
        onOpenRbacModal={() => setRbacModalOpen(true)}
        onLogout={handleLogout}
        currentTab={currentTab}
      />

      {/* Main Content Area */}
      <main
        className={`pt-20 pb-12 px-6 transition-all duration-200 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="max-w-[1560px] mx-auto">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-[#64748B] font-mono">
              Initializing BrandGuard AI Governance Environment...
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardOverview
                  assets={assets}
                  sources={sources}
                  queue={queue}
                  currentUser={currentUser}
                  onSelectAsset={handleSelectAsset}
                  onNavigateToQueue={() => setCurrentTab('queue')}
                  onNavigateToSources={handleNavigateToSources}
                  onNavigateToAssets={() => setCurrentTab('assets')}
                  onNewAssetClick={() => setNewAssetModalOpen(true)}
                  onOpenComplianceHealth={() => setComplianceHealthOpen(true)}
                  onOpenPolicyRules={() => setPolicyRulesOpen(true)}
                />
              )}

              {currentTab === 'governance-hub' && (
                <GovernanceHubView
                  sources={sources}
                  currentUser={currentUser}
                  onNavigateToSources={handleNavigateToSources}
                  onSelectAsset={handleSelectAsset}
                  onOpenNewSourceModal={() => setNewSourceModalOpen(true)}
                />
              )}

              {currentTab === 'queue' && (
                <ReviewQueueView
                  queue={queue}
                  currentUser={currentUser}
                  onSelectQueueItem={handleSelectAsset}
                />
              )}

              {currentTab === 'assets' && (
                <AssetListView
                  assets={assets}
                  onSelectAsset={handleSelectAsset}
                  onNewAssetClick={() => setNewAssetModalOpen(true)}
                />
              )}

              {currentTab === 'sources' && (
                <SourcesView
                  sources={sources}
                  onSourceCreated={newSource => {
                    setSources(prev => [newSource, ...prev]);
                    setSelectedSourceId(newSource.id);
                  }}
                  selectedSourceId={selectedSourceId}
                  initialCategoryFilter={sourcesCategoryFilter}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'asset-detail' && (
                <AssetDetailView
                  assetId={selectedAssetId}
                  currentUser={currentUser}
                  onBack={() => setCurrentTab('assets')}
                  onViewSource={srcId => {
                    setSelectedSourceId(srcId);
                    setCurrentTab('sources');
                  }}
                />
              )}

              {currentTab === 'audit-log' && (
                <AuditLogView
                  assets={assets}
                  onSelectAsset={handleSelectAsset}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView currentUser={currentUser} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Submit New Content Modal */}
      <NewAssetModal
        isOpen={newAssetModalOpen}
        onClose={() => setNewAssetModalOpen(false)}
        onAssetCreated={newAsset => {
          setAssets(prev => [newAsset, ...prev]);
          setSelectedAssetId(newAsset.id);
          setCurrentTab('asset-detail');
        }}
      />

      {/* Upload/Add Brand Guideline Source Modal */}
      <NewSourceModal
        isOpen={newSourceModalOpen}
        onClose={() => setNewSourceModalOpen(false)}
        onSourceCreated={newSource => {
          setSources(prev => [newSource, ...prev]);
          setSelectedSourceId(newSource.id);
          setNewSourceModalOpen(false);
        }}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onNavigateToAsset={handleSelectAsset}
        onNavigateToSource={srcId => {
          setSelectedSourceId(srcId);
          setCurrentTab('sources');
        }}
      />

      {/* Compliance Health Breakdown Modal */}
      <ComplianceHealthModal
        isOpen={complianceHealthOpen}
        onClose={() => setComplianceHealthOpen(false)}
        onNavigateToSources={handleNavigateToSources}
      />

      {/* Governance Principles Rules Modal */}
      <PolicyRulesModal
        isOpen={policyRulesOpen}
        onClose={() => setPolicyRulesOpen(false)}
      />

      {/* RBAC Permissions Matrix Modal */}
      <RbacMatrixModal
        isOpen={rbacModalOpen}
        onClose={() => setRbacModalOpen(false)}
        currentRole={currentUser.role}
      />

      {/* Comprehensive Enterprise Search Engine (⌘K) */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setSearchQuery('');
        }}
        title="Brand Governance Global Search Engine"
        description="Search copy, brand guidelines, verbatim passages, and evidence-linked findings in real time."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <Input
            leftIcon={<Search className="w-4 h-4 text-[#6366F1]" />}
            placeholder="Search keywords, copy phrases, rules, disclaimers, or authors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />

          {/* Search Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0D1220] border border-[#253047] text-xs">
            <button
              onClick={() => setSearchTypeFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                searchTypeFilter === 'all'
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#253047]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              All Results ({searchResults.length})
            </button>
            <button
              onClick={() => setSearchTypeFilter('asset')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                searchTypeFilter === 'asset'
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#253047]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Assets & Copy ({searchResults.filter(r => r.type === 'asset').length})
            </button>
            <button
              onClick={() => setSearchTypeFilter('passage')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                searchTypeFilter === 'passage'
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#253047]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Guidelines & Passages ({searchResults.filter(r => r.type === 'passage' || r.type === 'source').length})
            </button>
            <button
              onClick={() => setSearchTypeFilter('finding')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                searchTypeFilter === 'finding'
                  ? 'bg-[#161E2E] text-[#F8FAFC] border border-[#253047]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Audit Findings ({searchResults.filter(r => r.type === 'finding').length})
            </button>
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredSearchResults.length === 0 && searchQuery.trim() ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                No matching guidelines, passages, copy, or findings found for "{searchQuery}".
              </div>
            ) : null}

            {filteredSearchResults.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setSearchModalOpen(false);
                  setSearchQuery('');
                  if (item.assetId) {
                    handleSelectAsset(item.assetId);
                  } else if (item.sourceId) {
                    setSelectedSourceId(item.sourceId);
                    setCurrentTab('sources');
                  }
                }}
                className="p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] hover:border-[#6366F1] transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'asset' ? (
                      <FileText className="w-3.5 h-3.5 text-[#818CF8] shrink-0" />
                    ) : item.type === 'finding' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#6366F1] transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#161E2E] border border-[#253047] text-[#94A3B8]">
                    {item.matchedField}
                  </span>
                </div>

                <div className="text-[11px] text-[#94A3B8]">
                  {item.subtitle}
                </div>

                {item.matchContext && (
                  <div className="text-[11px] font-mono text-[#818CF8] bg-[#111827] p-2 rounded border border-[#253047]/60 leading-relaxed">
                    {item.matchContext}
                  </div>
                )}
              </div>
            ))}

            {!searchQuery && (
              <div className="text-xs text-[#64748B] space-y-3 pt-2">
                <span className="font-semibold text-[#94A3B8] block">Popular Searches:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'SentinelMesh',
                    'guaranteed 10x ROI',
                    '100% unhackable',
                    'Section 4.1',
                    'Banned Superlatives',
                    'Trademark Casing',
                    'Sarah Lin',
                    'SOC 2',
                  ].map(term => (
                    <button
                      key={term}
                      onClick={() => setSearchQuery(term)}
                      className="px-2.5 py-1 rounded bg-[#0D1220] border border-[#253047] text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#6366F1] transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
