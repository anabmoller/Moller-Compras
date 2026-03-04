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

// Retry wrapper: handles stale chunk errors after Vercel deploys
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch(() => {
      // On chunk load failure, reload once to get fresh assets
      const reloaded = sessionStorage.getItem("ypoti_chunk_reload");
      if (!reloaded) {
        sessionStorage.setItem("ypoti_chunk_reload", "1");
        window.location.reload();
      }
      return importFn(); // rethrow if second attempt also fails
    })
  );
}

// Lazy-loaded screens (code-split into separate chunks)
const InventoryScreen = lazyRetry(() => import("./components/inventory/InventoryScreen"));
const AnalyticsScreen = lazyRetry(() => import("./components/analytics/AnalyticsScreen"));
const SecurityDashboard = lazyRetry(() => import("./components/admin/SecurityDashboard.jsx"));
const UserManagementScreen = lazyRetry(() => import("./components/admin/UserManagementScreen"));
const BudgetManagementScreen = lazyRetry(() => import("./components/admin/BudgetManagementScreen"));
const ParametersScreen = lazyRetry(() => import("./components/admin/ParametersScreen"));
const MovimientosScreen = lazyRetry(() => import("./components/ganado/MovimientosScreen"));
const NuevoMovimientoForm = lazyRetry(() => import("./components/ganado/NuevoMovimientoForm"));
const MovimientoDetail = lazyRetry(() => import("./components/ganado/MovimientoDetail"));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-lg bg-[#1F2A44] inline-flex items-center justify-center shadow-lg shadow-black/20 animate-pulse">
        <span className="text-white text-sm font-bold">AMs</span>
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
    advanceStatus, cancelRequest, updateRequest, dataLoading, setDevOverride,
  } = useApp();

  const [screen, setScreen] = useState("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const selectedRequest = selectedRequestId ? requests.find(r => r.id === selectedRequestId) : null;
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEstablishment, setFilterEstablishment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [usdRate, setUsdRate] = useState(7800);
  const [usdLive, setUsdLive] = useState(false);
  const [devMode, setDevMode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Dev mode impersonation: only available in development builds
  const isDevModeActive = import.meta.env.DEV && devMode;

  // Effective user: when dev mode is active (DEV only), override currentUser
  const effectiveUser = useMemo(() => {
    if (!isDevModeActive) return currentUser;
    return {
      ...currentUser,
      name: devMode.name,
      role: devMode.role,
      email: devMode.username || currentUser.email,
      avatar: devMode.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase(),
    };
  }, [currentUser, isDevModeActive, devMode]);

  // Sync dev mode override to AppContext for permission checks in mutations
  useEffect(() => {
    if (isDevModeActive) {
      setDevOverride({
        ...currentUser,
        name: devMode.name,
        role: devMode.role,
        email: devMode.username || currentUser?.email,
        avatar: devMode.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      });
    } else {
      setDevOverride(null);
    }
  }, [isDevModeActive, devMode, currentUser, setDevOverride]);

  const effectiveCan = useCallback((permission) => {
    if (!isDevModeActive) return can(permission);
    return hasPermission(effectiveUser, permission);
  }, [can, isDevModeActive, effectiveUser]);

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
          <div className="w-12 h-12 rounded-xl bg-[#1F2A44] inline-flex items-center justify-center mb-4 shadow-lg shadow-black/20">
            <span className="text-white text-xl font-bold">AMs</span>
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
          <div className="w-12 h-12 rounded-xl bg-[#1F2A44] inline-flex items-center justify-center mb-4 shadow-lg shadow-black/20">
            <span className="text-white text-xl font-bold">AMs</span>
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
    } else if (target === 'ganado-detail' && requestId) {
      setSelectedMovimientoId(requestId);
      setScreen('ganado-detail');
    } else {
      setScreen(target);
      setSelectedRequestId(null);
      setSelectedMovimientoId(null);
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

    if (screen === "ganado" && effectiveCan("view_ganado")) {
      return (
        <Suspense fallback={<LazyFallback />}>
          <MovimientosScreen
            onBack={() => setScreen("dashboard")}
            onNavigate={handleNavigate}
            canCreate={effectiveCan("create_movimiento_ganado")}
            canValidate={effectiveCan("validate_movimiento_ganado")}
          />
        </Suspense>
      );
    }

    if (screen === "ganado-new" && effectiveCan("create_movimiento_ganado")) {
      return (
        <Suspense fallback={<LazyFallback />}>
          <NuevoMovimientoForm
            onCancel={() => setScreen("ganado")}
            onCreated={() => setScreen("ganado")}
          />
        </Suspense>
      );
    }

    if (screen === "ganado-detail" && effectiveCan("view_ganado") && selectedMovimientoId) {
      return (
        <Suspense fallback={<LazyFallback />}>
          <MovimientoDetail
            movimientoUuid={selectedMovimientoId}
            onBack={() => { setSelectedMovimientoId(null); setScreen("ganado"); }}
            onNavigate={handleNavigate}
          />
        </Suspense>
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
      {isDevModeActive && (
        <div className="bg-red-600 text-white text-sm font-medium text-center py-2 px-4 flex items-center justify-center gap-3 sticky top-0 z-50">
          <span>Modo Dev: Viendo como {devMode.name} ({devMode.label})</span>
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
        canViewGanado={effectiveCan("view_ganado")}
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
          canViewGanado={effectiveCan("view_ganado")}
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
