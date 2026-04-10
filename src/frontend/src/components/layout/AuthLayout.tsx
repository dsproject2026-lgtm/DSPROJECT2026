import type { PropsWithChildren } from 'react';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[#F2F4F8]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] items-start px-5 pb-12 pt-16 sm:max-w-[620px] sm:px-10 sm:pt-20 md:items-center md:pb-14 md:pt-10">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
