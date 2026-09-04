"use client";

import { FormEvent } from "react";

interface QueryFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  disabled: boolean;
}

export default function QueryForm({
  value,
  onChange,
  onSubmit,
  disabled,
}: QueryFormProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. what are the symptoms of type 2 diabetes?"
          autoComplete="off"
          required
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
        />
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-[15px] font-medium text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        Ask
      </button>
    </form>
  );
}
