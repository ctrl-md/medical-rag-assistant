# Ground — a grounded medical Q&A assistant

A RAG (Retrieval-Augmented Generation) system that answers health questions using only
real, cited content from MedlinePlus (the U.S. National Library of Medicine's public
health information service) — never general model knowledge. Every answer includes
numbered citations linking back to the exact source used.

## Stack

- **Backend**: FastAPI (Python) — MedlinePlus retrieval, a from-scratch TF-IDF
  cosine-similarity retriever, and grounded generation via the Gemini API
- **Frontend**: Next.js + TypeScript (App Router) + Tailwind CSS v4 — a componentized
  React UI with a hand-written markdown-to-React renderer for the model's formatted
  output

## How it works

1. **Retrieval**: the query is sent to MedlinePlus's public API, real health topic
   summaries are fetched, and the most relevant ones are ranked with a from-scratch
   TF-IDF cosine-similarity retriever (with a plain-TF fallback for very short,
   corpus-common queries, e.g. a bare "diabetes" against an all-diabetes corpus).
2. **Generation**: the retrieved documents are handed to Gemini as numbered sources,
   with explicit instructions to answer only from them, cite by number, use careful
   non-diagnostic language, and recommend consulting a real healthcare provider.
3. **Frontend**: Next.js calls the backend, renders the answer's headers/bold/italic/
   citation markers as real React elements (not raw HTML injection), and shows a
   clickable source list.

## Setup

This runs as two separate services — a Python API server and a Node frontend server —
talking to each other. That's the standard way to run this combination, and Next.js's
built-in rewrites (configured in `frontend/next.config.js`) let the browser call
`/api/ask` on the frontend's own origin without any CORS setup needed.

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and paste your real Gemini API key from
[Google AI Studio](https://aistudio.google.com/apikey) in place of `your-api-key-here`.

Run it:
```bash
uvicorn main:app --reload
```

This starts the API on `http://127.0.0.1:8000`.

### 2. Frontend

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

This starts Next.js on `http://localhost:3000`.

### 3. Use it

Open `http://localhost:3000` in your browser. Both servers need to be running at the
same time — the frontend has nothing to show without the backend behind it.

## Project structure

```
medical-rag-assistant/
├── backend/
│   ├── main.py            # FastAPI app + full RAG pipeline
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── layout.tsx      # Root layout, fonts
    │   ├── page.tsx        # Main page, state + API call
    │   ├── globals.css
    │   └── components/
    │       ├── QueryForm.tsx
    │       ├── AnswerDisplay.tsx
    │       └── SourcesList.tsx
    ├── lib/
    │   ├── types.ts        # Shared API types
    │   └── markdown.tsx    # Answer text -> React nodes
    ├── next.config.js      # Proxies /api/* to the FastAPI backend
    └── package.json
```

## API

**POST** `/api/ask`
```json
{ "query": "what are the symptoms of type 2 diabetes?" }
```
Returns:
```json
{
  "answer": "...",
  "sources": [{ "title": "...", "url": "..." }]
}
```

## Notes

- This tool provides general health information for educational purposes. It does
  not diagnose conditions, and every response is built with that framing baked into
  the generation prompt itself, not added as an afterthought.
- The retrieval logic (TF-IDF, cosine similarity, the hybrid fallback for
  corpus-common queries) was built from scratch, not from a library — see the
  accompanying capstone writeup for the full design decisions and trade-offs behind it.
