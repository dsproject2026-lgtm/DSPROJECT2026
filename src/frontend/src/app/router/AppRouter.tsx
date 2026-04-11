import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { BACKOFFICE_CONFIGS, getRoleHomeRoute, getRoleHomeRouteFromSession } from '@/config/role-navigation';
import { BackofficeLayout } from '@/components/layout/BackofficeLayout';
import { ElectorLayout } from '@/components/layout/ElectorLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AdminAuditPage } from '@/features/admin/pages/AdminAuditPage';
import { AdminCandidatesPage } from '@/features/admin/pages/AdminCandidatesPage';
import { AdminCommissionPage } from '@/features/admin/pages/AdminCommissionPage';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminSettingsPage } from '@/features/admin/pages/AdminSettingsPage';
import { AdminStudentsPage } from '@/features/admin/pages/AdminStudentsPage';
import { CodeLoginPage } from '@/features/auth/pages/CodeLoginPage';
import { FirstAccessPage } from '@/features/auth/pages/FirstAccessPage';
import { OnboardingLoaderPage } from '@/features/auth/pages/OnboardingLoaderPage';
import { PasswordLoginPage } from '@/features/auth/pages/PasswordLoginPage';
import { PasswordRecoveryPage } from '@/features/auth/pages/PasswordRecoveryPage';
import { CommissionCandidatesPage } from '@/features/commission/pages/CommissionCandidatesPage';
import { CommissionCandidatesRegisterPage } from '@/features/commission/pages/CommissionCandidatesRegisterPage';
import { CommissionDashboardPage } from '@/features/commission/pages/CommissionDashboardPage';
import { CommissionElectionsPage } from '@/features/commission/pages/CommissionElectionsPage';
import { CommissionResultsPage } from '@/features/commission/pages/CommissionResultsPage';
import { CommissionSettingsPage } from '@/features/commission/pages/CommissionSettingsPage';
import { CommissionStudentsPage } from '@/features/commission/pages/CommissionStudentsPage';
import { CommissionStudentsRegisterPage } from '@/features/commission/pages/CommissionStudentsRegisterPage';
import { ElectorDashboardPage } from '@/features/elector/pages/ElectorDashboardPage';
import { ElectorElectionDetailsPage } from '@/features/elector/pages/ElectorElectionDetailsPage';
import { ElectorElectionsPage } from '@/features/elector/pages/ElectorElectionsPage';
import { ElectorConfirmationPage } from '@/features/elector/pages/ElectorConfirmationPage';
import { ElectorResultsPage } from '@/features/elector/pages/ElectorResultsPage';
import { FiscalAuditPage } from '@/features/fiscal/pages/FiscalAuditPage';
import { FiscalDashboardPage } from '@/features/fiscal/pages/FiscalDashboardPage';
import { FiscalReportsPage } from '@/features/fiscal/pages/FiscalReportsPage';
import { FiscalResultsPage } from '@/features/fiscal/pages/FiscalResultsPage';
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
        <Route path="election-details/:electionId" element={<ElectorElectionDetailsPage />} />
        <Route path="elections/:electionId" element={<ElectorElectionsPage />} />
        <Route path="confirmacao" element={<ElectorConfirmationPage />} />
        <Route path="resultados" element={<ElectorResultsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          // <ProtectedRoute allowedPerfis={['ADMIN']}>
            <BackofficeLayout
              basePath={adminConfig.basePath}
              identityLabel={adminConfig.identityLabel}
              identityCampus={adminConfig.identityCampus}
              navItems={adminConfig.navItems}
            />
          // </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="candidatos" element={<Navigate to="visualizar" replace />} />
        <Route path="candidatos/visualizar" element={<AdminCandidatesPage />} />
        <Route path="candidatos/registrar" element={<AdminCandidatesPage />} />
        <Route path="estudantes" element={<Navigate to="visualizar" replace />} />
        <Route path="estudantes/visualizar" element={<AdminStudentsPage />} />
        <Route path="estudantes/registrar" element={<AdminStudentsPage />} />
        <Route path="comissao" element={<AdminCommissionPage />} />
        <Route path="auditoria" element={<AdminAuditPage />} />
        <Route path="configuracoes" element={<AdminSettingsPage />} />
      </Route>

      <Route
        path="/comissao"
        element={
          // <ProtectedRoute allowedPerfis={['GESTOR_ELEITORAL']}>
            <BackofficeLayout
              basePath={commissionConfig.basePath}
              identityLabel={commissionConfig.identityLabel}
              identityCampus={commissionConfig.identityCampus}
              navItems={commissionConfig.navItems}
            />
          // </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CommissionDashboardPage />} />
        <Route path="eleicoes" element={<Navigate to="visualizar" replace />} />
        <Route path="eleicoes/visualizar" element={<CommissionDashboardPage />} />
        <Route path="eleicoes/registrar" element={<CommissionElectionsPage />} />
        <Route path="resultados" element={<CommissionResultsPage />} />
        <Route path="candidatos" element={<Navigate to="visualizar" replace />} />
        <Route path="candidatos/visualizar" element={<CommissionCandidatesPage />} />
        <Route path="candidatos/registrar" element={<CommissionCandidatesRegisterPage />} />
        <Route path="estudantes" element={<Navigate to="visualizar" replace />} />
        <Route path="estudantes/visualizar" element={<CommissionStudentsPage />} />
        <Route path="estudantes/registrar" element={<CommissionStudentsRegisterPage />} />
        <Route path="configuracoes" element={<CommissionSettingsPage />} />
      </Route>

      <Route
        path="/fiscal"
        element={
          // <ProtectedRoute allowedPerfis={['AUDITOR']}>
            <BackofficeLayout
              basePath={fiscalConfig.basePath}
              identityLabel={fiscalConfig.identityLabel}
              identityCampus={fiscalConfig.identityCampus}
              navItems={fiscalConfig.navItems}
            />
          // </ProtectedRoute>
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
