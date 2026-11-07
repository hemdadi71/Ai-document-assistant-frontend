import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="block">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs text-[#a4aec1]"
      >
        {label}
      </label>

      {children}

      {hint && (
        <p className="mt-1.5 text-[10px] text-[#69768e]">
          {hint}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-[11px] text-[#ef9e9e]">
          {error}
        </p>
      )}
    </div>
  );
}
