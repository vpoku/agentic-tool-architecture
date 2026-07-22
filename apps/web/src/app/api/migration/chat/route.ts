import { NextResponse } from "next/server";
import { getChatMessages } from "@/lib/store";
import { runMigrationAgent } from "@/lib/agent/migration-orchestrator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  const messages = await getChatMessages(projectId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = String(body.projectId ?? "");
    const message = String(body.message ?? "");
    if (!projectId || !message) {
      return NextResponse.json({ error: "projectId and message required" }, { status: 400 });
    }
    const result = await runMigrationAgent(projectId, message);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Migration agent failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
