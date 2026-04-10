import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';

import { sessionStorageService } from '@/lib/storage/session-storage';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const accessToken = sessionStorageService.getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
