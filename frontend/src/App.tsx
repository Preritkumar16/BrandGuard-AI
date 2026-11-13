/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header, BreadcrumbItem } from './components/layout/Header';
import { RoleDashboard } from './components/dashboard/RoleDashboard';
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
import { PolicyRulesModal } from './components/common/PolicyRulesModal';
import { Modal } from './components/UI/Modal';
import { Input } from './components/UI/Input';
import { Asset, BrandSource, ReviewQueueItem, User } from './types';
import { authService } from './services/API/authService';
import { assetsService, canCreatorOpenAssetDetails, isAssetOwnedBy } from './services/API/assetsService';
import { sourcesService } from './services/API/sourcesService';
import { reviewsService } from './services/API/reviewsService';
import { auditService } from './services/API/auditService';
import { performGlobalSearch } from './services/API/searchService';
import { Search, FileText, BookOpen, AlertCircle } from 'lucide-react';
import { AppScreen, NavItem, navigationFor, screenLabel } from './config/navigation';


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
};

function navigationItemsFor(role: User['role']): NavItem[] {
  return navigationFor(role);
}

// Keeps the Sidebar's selected screen in sync with the active App tab.
function getScreenForTab(tab: NavTab, role: User['role']): AppScreen {
  const navItem = navigationItemsFor(role).find(item => {
    const destination = item.id === 'submit' ? 'submit' : SCREEN_TO_TAB[item.id];
    return destination === tab;
  });
  if (navItem) return navItem.id;

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
  const [allowCreatorSubmissionAccess, setAllowCreatorSubmissionAccess] = useState(false);
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
      const userData = await authService.getMe();
      const [assetsData, sourcesData, queueData] = await Promise.all([
        assetsService.getAssets(),
        sourcesService.getSources(),
        reviewsService.getQueue(),
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
        return [{ label: screenLabel(currentUser.role, 'dashboard') }];
      case 'governance-hub':
        return [{ label: 'Governance overview' }];
      case 'queue':
        return [{ label: screenLabel(currentUser.role, 'queue') }];
      case 'assets':
        return [{ label: 'Asset Library' }];
      case 'sources':
        return [{ label: 'Brand Guidelines' }];
      case 'audit-log':
        return [{ label: 'Activity History' }];
      case 'settings':
        return [{ label: 'Settings' }];
      case 'asset-detail': {
        const selectedAsset = assets.find(a => a.id === selectedAssetId);
        const found = currentUser.role === 'creator'
          && (!selectedAsset
            || !canCreatorOpenAssetDetails(selectedAsset, currentUser.id, allowCreatorSubmissionAccess))
          ? undefined
          : selectedAsset;
        return [
          currentUser.role === 'creator'
            ? { label: 'My submissions', screen: 'dashboard' }
            : { label: 'Asset Library', screen: 'assets' },
          { label: found ? found.title : 'Asset details' },
        ];
      }
      default:
        return [{ label: 'Overview' }];
    }
  };

  const handleSelectAsset = (assetId: string, fromCreatorSubmissionList = false) => {
    const selectedAsset = assets.find(asset => asset.id === assetId);
    setAllowCreatorSubmissionAccess(
      currentUser.role === 'creator'
      && Boolean(selectedAsset
        && canCreatorOpenAssetDetails(selectedAsset, currentUser.id, fromCreatorSubmissionList)),
    );
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
  const visibleAssets = currentUser.role === 'creator'
    ? assets.filter(asset => isAssetOwnedBy(asset, currentUser.id))
    : assets;
  const visibleAssetIds = new Set(visibleAssets.map(asset => asset.id));
  const visibleVersionIds = new Set(visibleAssets.flatMap(asset => asset.versions.map(version => version.version_id)));
  const allFindings = auditService.getAllFindingsSync();
  const visibleFindings = currentUser.role === 'creator'
    ? Object.fromEntries(Object.entries(allFindings).filter(([versionId]) => visibleVersionIds.has(versionId)))
    : allFindings;
  const searchResults = performGlobalSearch(searchQuery, visibleAssets, sources, visibleFindings);
  const visibleNotifications = currentUser.role === 'creator'
    ? notifications.filter(notification => !notification.assetId || visibleAssetIds.has(notification.assetId))
    : notifications;

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
        items={navigationItemsFor(currentUser.role)}
        currentScreen={getScreenForTab(currentTab, currentUser.role)}
        onSelectScreen={(screen: AppScreen) => {
          if (screen === 'submit') {
            setNewAssetModalOpen(true);
            setMobileSidebarOpen(false);
            return;
          }

          const nextTab = SCREEN_TO_TAB[screen];
          if (!nextTab) return;

          setCurrentTab(nextTab);
          setMobileSidebarOpen(false);

          if (nextTab === 'assets') {
            refreshAllData();
          }
        }}
        currentUser={currentUser}
        onUserChanged={user => {
          setCurrentUser(user);
          if (user.role === 'creator') {
            setCurrentTab('dashboard');
            setAllowCreatorSubmissionAccess(false);
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() =>
          setSidebarCollapsed(previous => !previous)
        }
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        roleSupported={authService.isCurrentRoleSupported()}
      />

      {/* Persistent Header */}
      <Header
        breadcrumbs={getBreadcrumbs()}
        onNavigate={screen => {
          const nextTab = SCREEN_TO_TAB[screen];
          if (nextTab) setCurrentTab(nextTab);
        }}
        collapsed={sidebarCollapsed}
        onSearchClick={() => setSearchModalOpen(true)}
        onOpenRbacModal={() => setRbacModalOpen(true)}
        onNotificationsClick={() => setNotificationsOpen(true)}
        unreadNotificationsCount={visibleNotifications.filter(n => !n.read).length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenMobileNav={() => setMobileSidebarOpen(true)}
      />

      {/* Main Content Area */}
      <main
        className={`ml-0 pt-20 pb-12 px-4 sm:px-6 transition-all duration-200 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <div className="max-w-[1560px] mx-auto">
          {isLoading ? (
            <div className="p-16 text-center text-sm text-[#64748B]">
              Initializing BrandGuard AI Governance Environment...
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <RoleDashboard
                  assets={visibleAssets}
                  sources={sources}
                  queue={currentUser.role === 'creator' ? [] : queue}
                  currentUser={currentUser}
                  onSelectAsset={assetId => handleSelectAsset(assetId, currentUser.role === 'creator')}
                  onNavigateToQueue={() => setCurrentTab('queue')}
                  onNavigateToSources={handleNavigateToSources}
                  onNavigateToAssets={() => setCurrentTab('assets')}
                  onNavigateToAuditLog={() => setCurrentTab('audit-log')}
                  onNewAssetClick={() => setNewAssetModalOpen(true)}
                  onOpenRbacMatrix={() => setRbacModalOpen(true)}
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

              {currentTab === 'queue' && currentUser.role === 'creator' && (
                <div role="alert" className="rounded-xl border border-[#DCE2E9] bg-white p-6 text-sm text-[#4B5869]">
                  The Review Queue is not available to Creator accounts. Track your submissions from My submissions.
                </div>
              )}

              {currentTab === 'queue' && currentUser.role !== 'creator' && (
                <ReviewQueueView
                  queue={queue}
                  currentUser={currentUser}
                  onSelectQueueItem={handleSelectAsset}
                />
              )}

              {currentTab === 'assets' && (
                <AssetListView
                  assets={visibleAssets}
                  currentUser={currentUser}
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
                  allowCreatorSubmissionAccess={allowCreatorSubmissionAccess}
                  onBack={() => setCurrentTab(currentUser.role === 'creator' ? 'dashboard' : 'assets')}
                  onViewSource={srcId => {
                    setSelectedSourceId(srcId);
                    setCurrentTab('sources');
                  }}
                />
              )}

              {currentTab === 'audit-log' && (
                <AuditLogView
                  assets={visibleAssets}
                  currentUser={currentUser}
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
          setAllowCreatorSubmissionAccess(false);
          setCurrentTab(currentUser.role === 'creator' ? 'dashboard' : 'asset-detail');
          if (currentUser.role !== 'creator') setSelectedAssetId(newAsset.id);
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
        notifications={visibleNotifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onNavigateToAsset={assetId => {
          if (currentUser.role === 'creator') {
            setCurrentTab('dashboard');
          } else {
            handleSelectAsset(assetId);
          }
        }}
        onNavigateToSource={srcId => {
          setSelectedSourceId(srcId);
          setCurrentTab('sources');
        }}
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

            {filteredSearchResults.map(item => {
              const canNavigate = Boolean(item.sourceId)
                || (currentUser.role !== 'creator' && Boolean(item.assetId));
              return (
                <div
                  key={item.id}
                  onClick={canNavigate ? () => {
                    setSearchModalOpen(false);
                    setSearchQuery('');
                    if (item.assetId && currentUser.role !== 'creator') {
                    handleSelectAsset(item.assetId);
                    } else if (item.sourceId) {
                      setSelectedSourceId(item.sourceId);
                      setCurrentTab('sources');
                    }
                  } : undefined}
                  className={`p-3.5 rounded-lg bg-[#0D1220] border border-[#253047] transition-all space-y-1.5 group ${
                    canNavigate ? 'cursor-pointer hover:border-[#6366F1]' : 'cursor-default'
                  }`}
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
                    <span className="text-xs px-2 py-0.5 rounded bg-[#161E2E] border border-[#253047] text-[#94A3B8]">
                      {item.matchedField}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#94A3B8]">
                    {item.subtitle}
                  </div>

                  {item.matchContext && (
                    <div className="text-sm text-[#818CF8] bg-[#111827] p-2 rounded border border-[#253047]/60 leading-relaxed">
                      {item.matchContext}
                    </div>
                  )}
                </div>
              );
            })}

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
                    'Rohit Sharma',
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
