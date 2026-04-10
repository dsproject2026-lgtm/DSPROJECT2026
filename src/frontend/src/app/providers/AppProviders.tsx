import type { PropsWithChildren } from 'react';
import { Toast } from '@/components/ui';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <Toast.Provider placement="top-right" />
    </>
  );
}
