import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';
const styles: Record<Variant, string> = {
  primary: 'bg-accent text-[#06231D] font-semibold hover:brightness-110',
  ghost: 'border border-[#3A4452] text-slate-100 hover:bg-raised',
  danger: 'bg-danger text-[#2A0A0A] font-semibold hover:brightness-110',
};

export default function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`min-h-[44px] rounded-lg px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}
