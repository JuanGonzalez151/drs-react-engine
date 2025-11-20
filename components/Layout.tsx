import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-red-500 selection:text-white font-sans">
      <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {/* DRS Logo Icon */}
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] opacity-30"></div>
                <span className="font-mono text-xs font-black text-white tracking-tighter">DRS</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-none">
                  DRS <span className="text-slate-600 text-sm font-normal">| Data Reasoning System</span>
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <span className="text-xs font-mono text-red-500 animate-pulse">● SYSTEM ONLINE</span>
              <div className="h-4 w-[1px] bg-slate-800"></div>
              <span className="text-xs text-slate-500 font-mono">"Reduce the drag on your analysis."</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative">
        {children}
      </main>
    </div>
  );
};