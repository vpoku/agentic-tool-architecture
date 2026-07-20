import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/orchestrator";
import { getChatMessages } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json();
  const projectId = String(body.projectId ?? "");
  const message = String(body.message ?? "");

  if (!projectId || !message) {
    return NextResponse.json({ error: "projectId and message required" }, { status: 400 });
  }

  const result = await runAgent(projectId, message);
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const messages = await getChatMessages(projectId);
  return NextResponse.json({ messages });
}
