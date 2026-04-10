import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthBrand } from '@/features/auth/components/AuthBrand';
import { sessionStorageService } from '@/lib/storage/session-storage';

export function OnboardingLoaderPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const accessToken = sessionStorageService.getAccessToken();
      navigate(accessToken ? '/dashboard' : '/login', { replace: true });
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(26,86,219,0.11),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(5,122,85,0.08),transparent_45%)]" />
      <AuthBrand flicker showText={false} />
    </div>
  );
}
