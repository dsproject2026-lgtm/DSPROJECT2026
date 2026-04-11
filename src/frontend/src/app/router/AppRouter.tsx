import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { BACKOFFICE_CONFIGS, getRoleHomeRoute, getRoleHomeRouteFromSession } from '@/config/role-navigation';
import { BackofficeLayout } from '@/components/layout/BackofficeLayout';
import { ElectorLayout } from '@/components/layout/ElectorLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdminAuditPage, AdminCandidatesPage, AdminCommissionPage, AdminDashboardPage, AdminSettingsPage, AdminStudentsPage } from '@/features/admin/pages/AdminPages';
import { CodeLoginPage } from '@/features/auth/pages/CodeLoginPage';
import { FirstAccessPage } from '@/features/auth/pages/FirstAccessPage';
import { OnboardingLoaderPage } from '@/features/auth/pages/OnboardingLoaderPage';
import { PasswordLoginPage } from '@/features/auth/pages/PasswordLoginPage';
import { PasswordRecoveryPage } from '@/features/auth/pages/PasswordRecoveryPage';
import {
  CommissionCandidatesPage,
  CommissionDashboardPage,
  CommissionElectionsPage,
  CommissionResultsPage,
  CommissionSettingsPage,
  CommissionStudentsPage,
} from '@/features/commission/pages/CommissionPages';
import { ElectorDashboardPage } from '@/features/elector/pages/ElectorDashboardPage';
import { ElectorElectionsPage } from '@/features/elector/pages/ElectorElectionsPage';
import { ElectorConfirmationPage, ElectorResultsPage } from '@/features/elector/pages/ElectorPages';
import { FiscalAuditPage, FiscalDashboardPage, FiscalReportsPage, FiscalResultsPage } from '@/features/fiscal/pages/FiscalPages';
import { sessionStorageService } from '@/lib/storage/session-storage';

function RoleHomeRedirect() {
  const session = sessionStorageService.getSession();
  const homePath = getRoleHomeRouteFromSession(session);
  return <Navigate to={homePath ?? '/login'} replace />;
}

function LegacyElectionsRedirect() {
  const location = useLocation();
  const session = sessionStorageService.getSession();

  if (!session?.user?.perfil) {
    return <Navigate to="/login" replace />;
  }

  if (session.user.perfil !== 'ELEITOR') {
    return <Navigate to={getRoleHomeRoute(session.user.perfil)} replace />;
  }

  const params = new URLSearchParams(location.search);
  const electionId = params.get('id');

  if (electionId) {
    return <Navigate to={`/eleitor/elections/${encodeURIComponent(electionId)}`} replace />;
  }

  return <Navigate to="/eleitor/dashboard" replace />;
}

export function AppRouter() {
  const adminConfig = BACKOFFICE_CONFIGS.ADMIN;
  const commissionConfig = BACKOFFICE_CONFIGS.GESTOR_ELEITORAL;
  const fiscalConfig = BACKOFFICE_CONFIGS.AUDITOR;

  return (
    <Routes>
      <Route path="/" element={<OnboardingLoaderPage />} />
      <Route path="/onboarding" element={<OnboardingLoaderPage />} />
      <Route path="/login" element={<CodeLoginPage />} />
      <Route path="/login/password" element={<PasswordLoginPage />} />
      <Route path="/login/first-access" element={<FirstAccessPage />} />
      <Route path="/login/first-access/reset" element={<FirstAccessPage />} />
      <Route path="/primeiro-acesso" element={<FirstAccessPage />} />
      <Route path="/recuperar-senha" element={<PasswordRecoveryPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleHomeRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/elections"
        element={
          <ProtectedRoute>
            <LegacyElectionsRedirect />
          </ProtectedRoute>
        }
      />

      <Route
        path="/eleitor"
        element={
          <ProtectedRoute allowedPerfis={['ELEITOR']}>
            <ElectorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ElectorDashboardPage />} />
        <Route path="elections" element={<Navigate to="dashboard" replace />} />
        <Route path="elections/:electionId" element={<ElectorElectionsPage />} />
        <Route path="confirmacao" element={<ElectorConfirmationPage />} />
        <Route path="resultados" element={<ElectorResultsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedPerfis={['ADMIN']}>
            <BackofficeLayout
              basePath={adminConfig.basePath}
              identityLabel={adminConfig.identityLabel}
              identityCampus={adminConfig.identityCampus}
              navItems={adminConfig.navItems}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="candidatos" element={<AdminCandidatesPage />} />
        <Route path="estudantes" element={<AdminStudentsPage />} />
        <Route path="comissao" element={<AdminCommissionPage />} />
        <Route path="auditoria" element={<AdminAuditPage />} />
        <Route path="configuracoes" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/comissao"
        element={
          <ProtectedRoute allowedPerfis={['GESTOR_ELEITORAL']}>
            <BackofficeLayout
              basePath={commissionConfig.basePath}
              identityLabel={commissionConfig.identityLabel}
              identityCampus={commissionConfig.identityCampus}
              navItems={commissionConfig.navItems}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CommissionDashboardPage />} />
        <Route path="eleicoes" element={<CommissionElectionsPage />} />
        <Route path="resultados" element={<CommissionResultsPage />} />
        <Route path="candidatos" element={<CommissionCandidatesPage />} />
        <Route path="estudantes" element={<CommissionStudentsPage />} />
        <Route path="configuracoes" element={<CommissionSettingsPage />} />
      </Route>

      <Route
        path="/fiscal"
        element={
          <ProtectedRoute allowedPerfis={['AUDITOR']}>
            <BackofficeLayout
              basePath={fiscalConfig.basePath}
              identityLabel={fiscalConfig.identityLabel}
              identityCampus={fiscalConfig.identityCampus}
              navItems={fiscalConfig.navItems}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<FiscalDashboardPage />} />
        <Route path="auditoria" element={<FiscalAuditPage />} />
        <Route path="resultados" element={<FiscalResultsPage />} />
        <Route path="relatorios" element={<FiscalReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
