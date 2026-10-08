import type { NextRequest } from "next/server";

const backendUrl = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = `${backendUrl}/${path.join("/")}${new URL(request.url).search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const response = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
    return new Response(response.body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return Response.json({ detail: "Learnova API is not reachable. Start the backend on port 8000." }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
