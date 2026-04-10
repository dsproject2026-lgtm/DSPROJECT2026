import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { CodeLoginPage } from '@/features/auth/pages/CodeLoginPage';
import { FirstAccessPage } from '@/features/auth/pages/FirstAccessPage';
import { OnboardingLoaderPage } from '@/features/auth/pages/OnboardingLoaderPage';
import { PasswordLoginPage } from '@/features/auth/pages/PasswordLoginPage';
import { PasswordRecoveryPage } from '@/features/auth/pages/PasswordRecoveryPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ElectionsPage } from '@/features/elections/pages/ElectionsPage';

export function AppRouter() {
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
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/elections"
        element={
          <ProtectedRoute>
            <AppShell>
              <ElectionsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
