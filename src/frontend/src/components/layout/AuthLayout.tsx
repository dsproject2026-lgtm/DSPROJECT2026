import type { PropsWithChildren } from 'react';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-center justify-center px-4 py-6 sm:max-w-[620px] sm:px-8 sm:py-8">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
