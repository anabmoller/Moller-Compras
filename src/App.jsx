import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { normalizeStatus } from "./utils/statusHelpers";
import { hasPermission } from "./constants/users";

import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";

import LoginScreen from "./components/auth/LoginScreen";
import ChangePasswordScreen from "./components/auth/ChangePasswordScreen";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import DesktopSidebar from "./components/layout/DesktopSidebar";
import MobileDrawer from "./components/layout/MobileDrawer";
import Notification from "./components/common/Notification";
import Dashboard from "./components/requests/Dashboard";
import RequestDetail from "./components/requests/RequestDetail";
import NewRequestForm from "./components/requests/NewRequestForm";
import SettingsScreen from "./components/settings/SettingsScreen";
import ApprovalConfigScreen from "./components/admin/ApprovalConfigScreen";
import GlobalSearch from "./components/shared/GlobalSearch";
import ProfileScreen from "./components/admin/ProfileScreen";
import NotificationsScreen from "./components/shared/NotificationsScreen";

// Lazy-loaded screens (code-split into separate chunks)
const InventoryScreen = lazy(() => import("./components/inventory/InventoryScreen"));
const AnalyticsScreen = lazy(() => import("./components/analytics/AnalyticsScreen"));
const SecurityDashboard = lazy(() => import("./components/admin/SecurityDashboard.jsx"));
const UserManagementScreen = lazy(() => import("./components/admin/UserManagementScreen"));
const BudgetManagementScreen = lazy(() => import("./components/admin/BudgetManagementScreen"));
const ParametersScreen = lazy(() => import("./components/admin/ParametersScreen"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-lg bg-emerald-600 inline-flex items-center justify-center shadow-lg shadow-emerald-600/20 animate-pulse">
        <span className="text-white text-sm font-bold">Y</span>
      </div>
    </div>
  );
}

// ============================================================
// YPOTI AGROPECUARIA — SISTEMA DE GESTION DE COMPRAS
// ============================================================

function AppContent() {
  const { currentUser, isAuthenticated, loading, can, forcePasswordChange } = useAuth();
  const {
    requests, notification, statusCounts, pendingApprovals, showNotif,
    addRequest, confirmRequest, approveStep, rejectRequest, sendForRevision,
    advanceStatus, cancelRequest, updateRequest, dataLoading,
  } = useApp();

  const [screen, setScreen] = useState("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const selectedRequest = selectedRequestId ? requests.find(r => r.id === selectedRequestId) : null;
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEstablishment, setFilterEstablishment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [usdRate, setUsdRate] = useState(7800);
  const [usdLive, setUsdLive] = useState(false);
  const [devMode, setDevMode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Effective user: when dev mode is active, override currentUser and can()
  const effectiveUser = useMemo(() => {
    if (!devMode) return currentUser;
    return {
      ...currentUser,
      name: devMode.name,
      role: devMode.role,
      avatar: devMode.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    };
  }, [currentUser, devMode]);

  const effectiveCan = useCallback((permission) => {
    if (!devMode) return can(permission);
    return hasPermission(effectiveUser, permission);
  }, [can, devMode, effectiveUser]);

  // Fetch live USD→PYG rate with auto-refresh every 30 min + retry on failure
  const fetchUsdRate = useCallback((retryCount = 0) => {
    const RETRY_DELAYS = [5000, 30000, 300000]; // 5s, 30s, 5min
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(r => r.json())
      .then(d => { setUsdRate(Math.round(d.rates?.PYG || 7800)); setUsdLive(true); })
      .catch(() => {
        setUsdRate(7800); setUsdLive(false);
        if (retryCount < RETRY_DELAYS.length) {
          setTimeout(() => fetchUsdRate(retryCount + 1), RETRY_DELAYS[retryCount]);
        }
      });
  }, []);

  useEffect(() => {
    fetchUsdRate();
    const interval = setInterval(fetchUsdRate, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUsdRate]);

  // Cmd+K global search shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 inline-flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
            <span className="text-white text-xl font-bold">Y</span>
          </div>
          <p className="text-slate-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  if (forcePasswordChange) return <ChangePasswordScreen />;

  // Data loading
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 inline-flex items-center justify-center mb-4 shadow-lg shadow-emerald-600/20">
            <span className="text-white text-xl font-bold">Y</span>
          </div>
          <p className="text-slate-400 text-sm mb-1">Cargando datos...</p>
          <p className="text-slate-600 text-xs">Conectando con el servidor</p>
        </div>
      </div>
    );
  }

  // Filter requests based on role (use effective user for impersonation)
  const visibleRequests = effectiveCan("view_all_requests")
    ? requests
    : requests.filter(r => r.requester === effectiveUser.name || r.assignee === effectiveUser.name);

  const filtered = visibleRequests.filter(r => {
    if (filterStatus !== "all" && normalizeStatus(r.status) !== filterStatus) return false;
    if (filterEstablishment !== "all" && r.establishment !== filterEstablishment) return false;
    if (searchQuery && !r.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.id?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleNavigate = (target, requestId) => {
    if (target === 'request' && requestId) {
      setSelectedRequestId(requestId);
      setScreen('dashboard');
    } else {
      setScreen(target);
      setSelectedRequestId(null);
      setShowNewForm(false);
    }
  };

  const handleNewRequest = () => {
    setScreen("dashboard");
    setShowNewForm(true);
  };

  const handleAddRequest = (form) => {
    addRequest(form);
    setShowNewForm(false);
  };

  const renderContent = () => {
    if (showNewForm && effectiveCan("create_request")) {
      return (
        <NewRequestForm
          onSubmit={handleAddRequest}
          onCancel={() => setShowNewForm(false)}
          usdRate={usdRate}
          usdLive={usdLive}
        />
      );
    }

    if (selectedRequest) {
      const currentIdx = filtered.findIndex(r => r.id === selectedRequestId);
      const hasPrev = currentIdx > 0;
      const hasNext = currentIdx >= 0 && currentIdx < filtered.length - 1;
      return (
        <RequestDetail
          request={selectedRequest}
          onBack={() => setSelectedRequestId(null)}
          onAdvance={effectiveCan("advance_status") ? advanceStatus : null}
          onUpdateRequest={updateRequest}
          canManageQuotations={effectiveCan("manage_quotations")}
          onConfirm={effectiveCan("create_request") ? confirmRequest : null}
          onApprove={approveStep}
          onReject={rejectRequest}
          onRevision={sendForRevision}
          onCancel={cancelRequest}
          onPrev={hasPrev ? () => setSelectedRequestId(filtered[currentIdx - 1].id) : null}
          onNext={hasNext ? () => setSelectedRequestId(filtered[currentIdx + 1].id) : null}
          hasPrev={hasPrev}
          hasNext={hasNext}
          usdRate={usdRate}
        />
      );
    }

    if (screen === "inventory" && effectiveCan("view_inventory")) {
      return <Suspense fallback={<LazyFallback />}><InventoryScreen onBack={() => setScreen("dashboard")} /></Suspense>;
    }

    if ((screen === "analytics" || screen === "analysis") && effectiveCan("view_analytics")) {
      return (
        <Suspense fallback={<LazyFallback />}>
          <AnalyticsScreen
            requests={visibleRequests}
            statusCounts={statusCounts}
            onBack={() => setScreen("dashboard")}
            defaultSection={screen === "analysis" ? "strategic" : "operational"}
          />
        </Suspense>
      );
    }

    if (screen === "security" && effectiveCan("manage_users")) {
      return <Suspense fallback={<LazyFallback />}><SecurityDashboard onBack={() => setScreen("dashboard")} /></Suspense>;
    }

    if (screen === "users" && effectiveCan("manage_users")) {
      return <Suspense fallback={<LazyFallback />}><UserManagementScreen onBack={() => setScreen("settings")} /></Suspense>;
    }

    if (screen === "budgets" && effectiveCan("view_analytics")) {
      return <Suspense fallback={<LazyFallback />}><BudgetManagementScreen onBack={() => setScreen("settings")} /></Suspense>;
    }

    if (screen === "parameters" && effectiveCan("manage_settings")) {
      return <Suspense fallback={<LazyFallback />}><ParametersScreen onBack={() => setScreen("settings")} /></Suspense>;
    }

    if (screen === "approvalConfig" && effectiveCan("manage_settings")) {
      return <ApprovalConfigScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "notifications") {
      return <NotificationsScreen onBack={() => setScreen("dashboard")} onNavigate={handleNavigate} />;
    }

    if (screen === "profile") {
      return <ProfileScreen onBack={() => setScreen("dashboard")} currentUser={effectiveUser} />;
    }

    if (screen === "settings") {
      return (
        <SettingsScreen
          onBack={() => setScreen("dashboard")}
          onNavigate={handleNavigate}
          devMode={devMode}
          onSetDevMode={setDevMode}
        />
      );
    }

    return (
      <Dashboard
        requests={visibleRequests}
        filtered={filtered}
        statusCounts={statusCounts}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterEstablishment={filterEstablishment}
        setFilterEstablishment={setFilterEstablishment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectRequest={(r) => setSelectedRequestId(r.id)}
        usdRate={usdRate}
      />
    );
  };

  const newRequestHandler = effectiveCan("create_request") ? handleNewRequest : () => showNotif("Sin permiso", "error");

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      {devMode && (
        <div className="bg-red-600 text-white text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-3 sticky top-0 z-50">
          <span>🔧 Modo Dev: Viendo como {devMode.name} ({devMode.label})</span>
          <button
            onClick={() => { setDevMode(null); setScreen("settings"); }}
            className="underline ml-2 bg-transparent text-white border-none cursor-pointer text-sm font-medium"
          >
            Salir
          </button>
        </div>
      )}
      <DesktopSidebar
        screen={screen}
        onNavigate={handleNavigate}
        onNewRequest={newRequestHandler}
        currentUser={effectiveUser.name}
        canViewAnalytics={effectiveCan("view_analytics")}
        canManageUsers={effectiveCan("manage_users")}
        usdRate={usdRate}
        usdLive={usdLive}
        onRefreshRate={fetchUsdRate}
      />

      <div className="app-main-content w-full mx-auto relative min-h-screen px-0 sm:px-0">
        <Notification notification={notification} />

        <div className="mobile-header">
          <Header
            currentUser={effectiveUser.name}
            onToggleDrawer={() => setDrawerOpen(prev => !prev)}
            onNavigate={handleNavigate}
          />
        </div>

        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          screen={screen}
          onNavigate={handleNavigate}
          onNewRequest={newRequestHandler}
          currentUser={effectiveUser.name}
          canViewAnalytics={effectiveCan("view_analytics")}
          canManageUsers={effectiveCan("manage_users")}
        />

        {renderContent()}

        {!showNewForm && !selectedRequest && (
          <div className="mobile-bottom-nav">
            <BottomNav
              screen={screen}
              onNavigate={handleNavigate}
              onNewRequest={newRequestHandler}
              onNotify={showNotif}
              canViewAnalytics={effectiveCan("view_analytics")}
            />
          </div>
        )}
      </div>

      {/* Global search modal */}
      {showSearch && (
        <GlobalSearch
          onNavigate={handleNavigate}
          requests={visibleRequests}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppProvider>
                <AppContent />
            </AppProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
