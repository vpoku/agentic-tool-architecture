/** Stub handler — replace with shared agent logic for production deployment. */
export async function handler(event: {
  path: string;
  httpMethod: string;
  body?: string;
}): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  const routes: Record<string, string> = {
    "POST /projects": "createProject",
    "POST /chat": "runGreenfieldAgent",
    "POST /migration/chat": "runMigrationAgent",
  };
  const key = `${event.httpMethod} ${event.path.replace(/^\/prod/, "")}`;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stub: true,
      route: routes[key] ?? "unknown",
      message: "Wire to @cloudarch/shared agent modules",
    }),
  };
}
