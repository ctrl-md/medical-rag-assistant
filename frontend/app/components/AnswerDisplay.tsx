import { renderAnswer } from "@/lib/markdown";

interface AnswerDisplayProps {
  query: string;
  answer: string;
}

export default function AnswerDisplay({ query, answer }: AnswerDisplayProps) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        You asked &mdash;{" "}
        <span className="font-medium text-slate-700">{query}</span>
      </p>
      <div>{renderAnswer(answer)}</div>
    </div>
  );
}
