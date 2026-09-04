import { Source } from "@/lib/types";

interface SourcesListProps {
  sources: Source[];
}

export default function SourcesList({ sources }: SourcesListProps) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Sources
      </p>
      <div className="space-y-2">
        {sources.map((source, i) => (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            key={source.url + i}
            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 group-hover:bg-indigo-100">
              {i + 1}
            </span>
            <span className="flex-1 text-sm text-slate-700 group-hover:text-indigo-700">
              {source.title}
            </span>
            <svg
              className="h-4 w-4 flex-shrink-0 text-slate-300 group-hover:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
