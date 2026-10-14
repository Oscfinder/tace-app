"use client";

import { forwardRef, type ComponentProps, type ReactNode } from "react";

export const inputClass =
  "block min-h-12 w-full rounded-xl border border-[#d5e1ee] bg-white px-3.5 py-3 text-base text-tace-navy outline-none transition placeholder:text-tace-gray/60 focus-visible:border-tace-blue focus-visible:ring-4 focus-visible:ring-tace-blue/15 aria-[invalid=true]:border-tace-red aria-[invalid=true]:ring-tace-red/10";

// Label + control + hint + error, wired together for screen readers:
// the control gets aria-describedby/aria-invalid and the error is announced.
export function FormField({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-tace-navy">
        {label}
        {required ? (
          <span className="ml-0.5 text-tace-red" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-normal text-tace-gray">(optional)</span>
        )}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-tace-gray">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-tace-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: string) {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ") || undefined;
}

export const TextInput = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & { error?: string; hint?: string }
>(function TextInput({ id, error, hint, className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id ?? "", error, hint)}
      className={`${inputClass} ${className}`}
      {...props}
    />
  );
});

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea"> & { error?: string; hint?: string }
>(function TextArea({ id, error, hint, className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      id={id}
      rows={3}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id ?? "", error, hint)}
      className={`${inputClass} ${className}`}
      {...props}
    />
  );
});

export const NativeSelect = forwardRef<
  HTMLSelectElement,
  ComponentProps<"select"> & {
    error?: string;
    hint?: string;
    placeholder?: string;
    options: readonly { value: string; label: string }[];
  }
>(function NativeSelect(
  { id, error, hint, placeholder = "Select…", options, className = "", ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id ?? "", error, hint)}
      defaultValue=""
      className={`${inputClass} ${className}`}
      {...props}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
});

// A big tappable checkbox row (44px+ target) for multi-select lists.
export const CheckRow = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & { label: string }
>(function CheckRow({ label, ...props }, ref) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#d5e1ee] bg-white px-3.5 py-2.5 text-[15px] text-tace-navy has-[:checked]:border-tace-blue has-[:checked]:bg-[#f2faff]">
      <input
        ref={ref}
        type="checkbox"
        className="size-5 shrink-0 accent-tace-blue"
        {...props}
      />
      {label}
    </label>
  );
});

export const RadioCard = forwardRef<
  HTMLInputElement,
  ComponentProps<"input"> & { label: string; hint?: string }
>(function RadioCard({ label, hint, ...props }, ref) {
  return (
    <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-[#d5e1ee] bg-white px-4 py-3 has-[:checked]:border-tace-blue has-[:checked]:bg-[#f2faff] has-[:checked]:ring-4 has-[:checked]:ring-tace-blue/10">
      <input
        ref={ref}
        type="radio"
        className="mt-1 size-5 shrink-0 accent-tace-blue"
        {...props}
      />
      <span>
        <span className="block text-[15px] font-semibold text-tace-navy">{label}</span>
        {hint ? <span className="mt-0.5 block text-sm text-tace-gray">{hint}</span> : null}
      </span>
    </label>
  );
});
