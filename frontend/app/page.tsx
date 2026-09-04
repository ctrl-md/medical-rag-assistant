"use client";

import { useState } from "react";
import QueryForm from "./components/QueryForm";
import AnswerDisplay from "./components/AnswerDisplay";
import SourcesList from "./components/SourcesList";
import { AskResponse } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [askedQuery, setAskedQuery] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(submittedQuery: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: submittedQuery }),
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data: AskResponse = await res.json();
      setAskedQuery(submittedQuery);
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(
        `Something went wrong: ${message}. Check that the backend server is running and your GEMINI_API_KEY is set.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-200">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082M9.75 3.104a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Ground</h1>
            <p className="text-sm text-slate-500">
              Sourced answers from MedlinePlus, not general knowledge
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <svg
              className="h-5 w-5 flex-shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-8.25 3.75h.008v.008h-.008v-.008z"
              />
            </svg>
            <p className="text-[13px] leading-relaxed text-amber-800">
              This tool provides general health information for educational
              purposes and does not diagnose conditions. For any personal
              medical concern, please consult a qualified healthcare provider.
            </p>
          </div>

          <QueryForm
            value={query}
            onChange={setQuery}
            onSubmit={handleAsk}
            disabled={loading}
          />

          {loading && (
            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <svg
                className="h-4 w-4 animate-spin text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Searching MedlinePlus and building a grounded answer&hellip;
            </div>
          )}

          {error && (
            <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {result && (
            <div className="mt-8 border-t border-slate-100 pt-6">
              <AnswerDisplay query={askedQuery} answer={result.answer} />
              <SourcesList sources={result.sources} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
