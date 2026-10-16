import type { InputHTMLAttributes } from 'react';

export default function Field({ label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-mute">{label}</label>
      <input
        id={id}
        {...props}
        className="min-h-[44px] rounded-lg border border-line bg-ink px-3 text-sm text-slate-100 placeholder:text-mute focus:border-accent"
      />
    </div>
  );
}
