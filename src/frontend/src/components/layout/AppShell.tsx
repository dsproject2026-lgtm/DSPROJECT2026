import type { PropsWithChildren } from 'react';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-bg w-full">
      
      {/* HEADER */}
      <header className="border-b border-border bg-white">
        <div className="max-w-[1024px] mx-auto flex flex-row sm:flex-row items-center justify-between p-4 gap-3">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <img src="/images/logo.svg" alt="logoup" className="h-10 w-10 sm:h-12 sm:w-12" />
            <h2 className="text-xl sm:text-2xl font-bold">SIVO-UP</h2>
          </div>

          {/* AVATAR / ACTIONS */}
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-500 rounded-[50%]" >
            
          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        {children}
      </main>

    </div>
  );
}
