import type { ReactNode } from 'react';

export default function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-6">
        <div className="mb-6 flex items-center gap-2.5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3DD6B5" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
            <path d="M9 12l2.2 2.2L15.5 10" />
          </svg>
          <span className="text-xl font-semibold">Sentinel</span>
        </div>
        <h1 className="mb-4 text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
