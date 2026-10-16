import type { ReactNode } from 'react';

export default function Card({ title, subtitle, children, className = '' }: { title?: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-panel p-5 ${className}`}>
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {subtitle && <p className="mb-4 mt-1 text-sm text-mute">{subtitle}</p>}
      {title && !subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}
