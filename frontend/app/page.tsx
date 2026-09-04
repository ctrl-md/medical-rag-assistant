"use client";

import { useState } from "react";
import QueryForm from "./components/QueryForm";
import AnswerDisplay from "./components/AnswerDisplay";
import SourcesList from "./components/SourcesList";
import { AskResponse } from "@/lib/types";

// Called directly from the browser rather than through Next.js's rewrite proxy.
// On Netlify's free tier, that proxy runs as a Netlify Function with a hard
// 10-second timeout -- far shorter than Render's free-tier cold start (30-60s
// after 15 minutes of inactivity). Fetching the backend directly means the
// browser's own request (which has no built-in timeout) is what waits through
// a cold start, not a Netlify Function that would kill it first.
const BACKEND_URL = process.env.API || "http://127.0.0.1:8000";

// Generous enough to comfortably cover a Render cold start, but not infinite --
// if the backend is genuinely unreachable, the person asking shouldn't be left
// staring at a spinner forever.
const REQUEST_TIMEOUT_MS = 90_000;

export default function Home() {
  const [query, setQuery] = useState("");
  const [askedQuery, setAskedQuery] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slowStart, setSlowStart] = useState(false);

  async function handleAsk(submittedQuery: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setSlowStart(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // The backend's free-tier host may need to wake up first. If this is
    // still loading after a few seconds, let the person know that's likely
    // what's happening rather than leave them guessing whether it's broken.
    const slowStartTimer = setTimeout(() => setSlowStart(true), 6_000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: submittedQuery }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try {
          const errorBody = await res.json();
          if (errorBody.detail) {
            message = errorBody.detail;
          }
        } catch {
          // response body wasn't valid JSON -- fall back to the generic message above
        }
        throw new Error(message);
      }

      const data: AskResponse = await res.json();
      setAskedQuery(submittedQuery);
      setResult(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "The request timed out. The backend may be waking up from being idle -- please wait a moment and try again.",
        );
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(
          `Something went wrong: ${message}. Check that the backend server is running and your GEMINI_API_KEY is set.`,
        );
      }
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(slowStartTimer);
      setLoading(false);
      setSlowStart(false);
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
              {slowStart
                ? "Still working -- the backend may be waking up from being idle, this can take up to a minute\u2026"
                : "Searching MedlinePlus and building a grounded answer\u2026"}
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
