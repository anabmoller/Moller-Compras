import { useState } from "react";
import { colors, font, globalCSS } from "./styles/theme";

import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";

import LoginScreen from "./components/auth/LoginScreen";
import ChangePasswordScreen from "./components/auth/ChangePasswordScreen";
import Header from "./components/layout/Header";
import BottomNav from "./components/layout/BottomNav";
import DesktopSidebar from "./components/layout/DesktopSidebar";
import Notification from "./components/common/Notification";
import Dashboard from "./components/requests/Dashboard";
import RequestDetail from "./components/requests/RequestDetail";
import NewRequestForm from "./components/requests/NewRequestForm";
import InventoryScreen from "./components/inventory/InventoryScreen";
import AnalyticsScreen from "./components/analytics/AnalyticsScreen";
import SettingsScreen from "./components/settings/SettingsScreen";
import UserManagementScreen from "./components/admin/UserManagementScreen";
import BudgetManagementScreen from "./components/admin/BudgetManagementScreen";
import ParametersScreen from "./components/admin/ParametersScreen";
import ApprovalConfigScreen from "./components/admin/ApprovalConfigScreen";

// ============================================================
// YPOTI AGROPECUARIA — SISTEMA DE GESTION DE COMPRAS
// ============================================================

function AppContent() {
  const { currentUser, isAuthenticated, loading, can, forcePasswordChange } = useAuth();
  const {
    requests, notification, statusCounts, pendingApprovals, showNotif,
    addRequest, confirmRequest, approveStep, rejectRequest, sendForRevision,
    advanceStatus, updateRequest, dataLoading,
  } = useApp();

  const [screen, setScreen] = useState("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const selectedRequest = selectedRequestId ? requests.find(r => r.id === selectedRequestId) : null;
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEstablishment, setFilterEstablishment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Show loading spinner while checking Supabase session
  if (loading) {
    return (
      <div style={{
        fontFamily: font, background: colors.bg, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: colors.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Y</span>
          </div>
          <p style={{ color: colors.textLight, fontSize: 14 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Force password change on first login
  if (forcePasswordChange) {
    return <ChangePasswordScreen />;
  }

  // Show loading while Supabase data initializes (parameters, budgets, users, requests)
  if (dataLoading) {
    return (
      <div style={{
        fontFamily: font, background: colors.bg, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: colors.primary,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            boxShadow: `0 4px 16px ${colors.primary}30`,
          }}>
            <span style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Y</span>
          </div>
          <p style={{ color: colors.textLight, fontSize: 14, margin: "0 0 4px" }}>Cargando datos...</p>
          <p style={{ color: colors.textMuted, fontSize: 12, margin: 0 }}>Conectando con el servidor</p>
        </div>
      </div>
    );
  }

  // Filter requests based on role
  const visibleRequests = can("view_all_requests")
    ? requests
    : requests.filter(r => r.requester === currentUser.name || r.assignee === currentUser.name);

  const filtered = visibleRequests.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterEstablishment !== "all" && r.establishment !== filterEstablishment) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !r.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleNavigate = (target) => {
    setScreen(target);
    setSelectedRequestId(null);
    setShowNewForm(false);
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
    if (showNewForm && can("create_request")) {
      return (
        <NewRequestForm
          onSubmit={handleAddRequest}
          onCancel={() => setShowNewForm(false)}
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
          onAdvance={can("advance_status") ? advanceStatus : null}
          onUpdateRequest={updateRequest}
          canManageQuotations={can("manage_quotations")}
          onConfirm={can("create_request") ? confirmRequest : null}
          onApprove={approveStep}
          onReject={rejectRequest}
          onRevision={sendForRevision}
          onPrev={hasPrev ? () => setSelectedRequestId(filtered[currentIdx - 1].id) : null}
          onNext={hasNext ? () => setSelectedRequestId(filtered[currentIdx + 1].id) : null}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      );
    }

    if (screen === "inventory" && can("view_inventory")) {
      return <InventoryScreen onBack={() => setScreen("dashboard")} />;
    }

    if (screen === "analytics" && can("view_analytics")) {
      return (
        <AnalyticsScreen
          requests={visibleRequests}
          statusCounts={statusCounts}
          onBack={() => setScreen("dashboard")}
        />
      );
    }

    if (screen === "users" && can("manage_users")) {
      return <UserManagementScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "budgets" && can("view_analytics")) {
      return <BudgetManagementScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "parameters" && can("manage_settings")) {
      return <ParametersScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "approvalConfig" && can("manage_settings")) {
      return <ApprovalConfigScreen onBack={() => setScreen("settings")} />;
    }

    if (screen === "settings") {
      return (
        <SettingsScreen
          onBack={() => setScreen("dashboard")}
          onNavigate={handleNavigate}
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
      />
    );
  };

  const newRequestHandler = can("create_request") ? handleNewRequest : () => showNotif("Sin permiso", "error");

  return (
    <div style={{ fontFamily: font, background: colors.bg, minHeight: "100vh" }}>
      <DesktopSidebar
        screen={screen}
        onNavigate={handleNavigate}
        onNewRequest={newRequestHandler}
        currentUser={currentUser.name}
        canViewAnalytics={can("view_analytics")}
        canManageUsers={can("manage_users")}
      />

      <div className="app-main-content" style={{
        maxWidth: 480,
        margin: "0 auto",
        position: "relative",
        minHeight: "100vh",
      }}>
        <Notification notification={notification} />

        <div className="mobile-header">
          <Header currentUser={currentUser.name} />
        </div>

        {renderContent()}

        {!showNewForm && !selectedRequest && (
          <div className="mobile-bottom-nav">
            <BottomNav
              screen={screen}
              onNavigate={handleNavigate}
              onNewRequest={newRequestHandler}
              onNotify={showNotif}
              canViewAnalytics={can("view_analytics")}
            />
          </div>
        )}
      </div>

      <style>{globalCSS}</style>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
