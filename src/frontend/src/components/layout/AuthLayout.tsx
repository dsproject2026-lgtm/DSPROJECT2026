import type { PropsWithChildren } from 'react';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-bg">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] items-start px-5 py-4 sm:max-w-[620px] sm:px-10 sm:py-6 md:items-center">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
