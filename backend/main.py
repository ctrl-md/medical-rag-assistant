import statistics
import xml.etree.ElementTree as ET

import requests
import torch
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel

load_dotenv()

URL = "https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term="
client = genai.Client()


# ---------------------------------------------------------------------------
# Data ingestion (MedlinePlus)
# ---------------------------------------------------------------------------


def fetch_health_topic(query) -> list[dict] | None:
    api_url = f"{URL}{query}"

    try:
        response = requests.get(api_url)
        response.raise_for_status()
        root = ET.fromstring(response.text)
        doc_list = []
        for doc in root.findall(".//document"):
            title_elem = doc.find('content[@name="title"]')
            title = title_elem.text if title_elem is not None else "No Title"
            summary_elem = doc.find('content[@name="FullSummary"]')
            summary = summary_elem.text if summary_elem is not None else "No Summary"
            url = doc.get("url") if doc.get("url") is not None else "No URL"
            doc_list.append({"title": title, "summary": summary, "url": url})
        return doc_list
    except requests.RequestException as e:
        print(f"Error fetching health topic: {e}")
        return None


# ---------------------------------------------------------------------------
# Retrieval (TF-IDF with plain-TF fallback)
# ---------------------------------------------------------------------------


def embed(text, vocab):
    words = text.lower().split()
    vector = []
    for word in vocab:
        vector.append(words.count(word))
    return torch.tensor(vector, dtype=torch.float32)


def compute_idf(documents, vocab):
    dict_idf = {}
    for word in vocab:
        doc_count = sum(
            1 for doc in documents if word in doc["summary"].lower().split()
        )
        idf = torch.log(
            torch.tensor(len(documents) / (doc_count), dtype=torch.float32)
        )
        dict_idf[word] = idf
    return dict_idf


def tfidf_embed(text, vocab, idf_scores):
    vector = []
    tf = embed(text, vocab)
    for i, word in enumerate(vocab):
        idf = idf_scores.get(word, torch.tensor(0.0))
        vector.append(tf[i] * idf.item())
    return torch.tensor(vector, dtype=torch.float32)


def cosine_similarity(vec1, vec2):
    if vec1.norm() == 0 or vec2.norm() == 0:
        return torch.tensor(0.0)
    num = vec1 @ vec2
    denom = vec1.norm() * vec2.norm()
    return num / denom


def retrieve(query, vocab, idf_scores, documents, k):
    embed_query = tfidf_embed(query, vocab, idf_scores)
    zero_tfidf = embed_query.norm() == 0
    if zero_tfidf:
        embed_query = embed(query, vocab)
    scores = []
    for document in documents:
        if zero_tfidf:
            embed_document = embed(document["summary"], vocab)
        else:
            embed_document = tfidf_embed(document["summary"], vocab, idf_scores)
        scores.append(cosine_similarity(embed_query, embed_document))
    scores = torch.tensor(scores)
    k = min(k, len(documents))
    top_scores = torch.topk(scores, k)
    top_documents = []
    for index in top_scores.indices:
        top_documents.append(documents[index.item()])
    return top_documents


def evaluate_retrieval(test_queries, documents, vocab, idf_scores, k):
    precision_list = []
    recall_list = []
    for query, relevant_indices in test_queries:
        retrieved_documents = retrieve(query, vocab, idf_scores, documents, k)
        retrieved_indices = [documents.index(doc) for doc in retrieved_documents]
        relevant_retrieved_count = len(
            [i for i in retrieved_indices if i in relevant_indices]
        )
        precision_list.append(relevant_retrieved_count / len(retrieved_documents))
        recall_list.append(relevant_retrieved_count / len(relevant_indices))
    return statistics.mean(precision_list), statistics.mean(recall_list)


# ---------------------------------------------------------------------------
# Generation (Gemini, grounded + cited + safety-framed)
# ---------------------------------------------------------------------------


def build_prompt(query, retrieved_docs):
    prompt = f"Query: {query}\n\n"
    prompt += "Retrieved Documents:\n"
    for i, doc in enumerate(retrieved_docs):
        prompt += f"{i + 1}. Title: {doc['title']}\n"
        prompt += f"   Summary: {doc['summary']}\n"
        prompt += f"   URL: {doc['url']}\n\n"
    prompt += (
        "Answer using only the information in the numbered sources above; when you "
        "state something the sources support, cite it by number like [1]; if the "
        "sources don't contain enough information to answer, say so rather than "
        "filling the gap from general knowledge; use careful, non-diagnostic "
        "phrasing ('may be associated with', never 'you have'); and close with a "
        "clear recommendation to consult a healthcare provider for actual medical "
        "concerns.\n\n"
    )
    return prompt


def generate_answer(prompt):
    interaction = client.interactions.create(
        model="gemini-3.8-flash", input=prompt, stream=False
    )
    return getattr(interaction, "output_text", "")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="Grounded Medical Q&A Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    query: str


class Source(BaseModel):
    title: str
    url: str


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]


@app.post("/api/ask", response_model=AskResponse)
def ask(request: AskRequest):
    query = request.query.strip()

    docs = fetch_health_topic(query)
    if not docs:
        return AskResponse(
            answer=(
                "No results were found for that query in MedlinePlus. Try "
                "rephrasing it, or ask about a specific condition, medication, "
                "or symptom."
            ),
            sources=[],
        )

    all_words = set()
    for doc in docs:
        all_words.update(doc["summary"].lower().split())
    vocab = sorted(all_words)

    idf_scores = compute_idf(docs, vocab)
    retrieved = retrieve(query, vocab, idf_scores, docs, k=10)

    prompt = build_prompt(query, retrieved)
    answer = generate_answer(prompt)

    sources = [Source(title=doc["title"], url=doc["url"]) for doc in retrieved]
    return AskResponse(answer=answer, sources=sources)


@app.get("/health")
def health():
    return {"status": "ok"}
