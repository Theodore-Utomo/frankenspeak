import { NextResponse } from "next/server";
import {
  getEmbedding,
  findTopK,
  loadVectorStore,
} from "@/lib/vectors";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const CHAT_MODEL = "gemini-2.5-flash";
const TOP_K = 6;

const CAT_SYSTEM_PREFIX = `You are a cat speaking in first person. Keep replies short and in character. Use the following knowledge about yourself when relevant. If the user's question isn't covered here, answer briefly as a cat would. Do not mention that you are an AI or have a knowledge base.

Knowledge about you:
`;

export async function POST(req: Request) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set" },
      { status: 500 }
    );
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json(
      { error: "Missing or empty message" },
      { status: 400 }
    );
  }

  let chunks: Awaited<ReturnType<typeof loadVectorStore>>;
  try {
    chunks = await loadVectorStore();
  } catch (err) {
    const isMissing = err && typeof err === "object" && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT";
    return NextResponse.json(
      { error: isMissing ? "No vector store found. Run npm run ingest first." : (err instanceof Error ? err.message : "Failed to load vector store") },
      { status: 503 }
    );
  }

  if (chunks.length === 0) {
    return NextResponse.json(
      { error: "Vector store is empty. Add content in content/cat/ and run npm run ingest." },
      { status: 503 }
    );
  }

  try {
    const queryEmbedding = await getEmbedding(message);
    const topChunks = findTopK(queryEmbedding, chunks, Math.min(TOP_K, chunks.length));
    const context = topChunks.map((c) => c.text).join("\n\n");
    const systemContent = CAT_SYSTEM_PREFIX + context;

    const url = `${GEMINI_BASE}/models/${CHAT_MODEL}:generateContent?key=${geminiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContent }] },
        contents: [{ parts: [{ text: message }] }],
        generationConfig: {
          maxOutputTokens: 256,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Gemini chat failed: ${res.status} ${err}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Meow?";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 500 }
    );
  }
}
