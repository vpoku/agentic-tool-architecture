import type { Project, ChatMessage, ArchitectureProposal } from "@cloudarch/shared";

const projects = new Map<string, Project>();
const messages = new Map<string, ChatMessage[]>();

export function getDemoUserId(): string {
  return process.env.DEMO_USER_ID ?? "demo-user";
}

export async function createProject(input: {
  name: string;
  description: string;
  complianceLevel?: string;
}): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    projectId: crypto.randomUUID(),
    userId: getDemoUserId(),
    name: input.name.slice(0, 80) || "Untitled Project",
    description: input.description,
    complianceLevel: input.complianceLevel ?? "FedRAMP High",
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  projects.set(project.projectId, project);
  messages.set(project.projectId, []);
  return project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  return projects.get(projectId) ?? null;
}

export async function listProjects(userId?: string): Promise<Project[]> {
  const uid = userId ?? getDemoUserId();
  return Array.from(projects.values())
    .filter((p) => p.userId === uid)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const existed = projects.delete(projectId);
  messages.delete(projectId);
  return existed;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, "name" | "description" | "status" | "architecture" | "complianceLevel">>
): Promise<Project | null> {
  const project = projects.get(projectId);
  if (!project) return null;
  const updated: Project = {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  projects.set(projectId, updated);
  return updated;
}

export async function saveArchitecture(
  projectId: string,
  architecture: ArchitectureProposal
): Promise<Project | null> {
  return updateProject(projectId, {
    architecture,
    status: "ready",
  });
}

export async function getChatMessages(projectId: string): Promise<ChatMessage[]> {
  return messages.get(projectId) ?? [];
}

export async function addChatMessage(
  message: Omit<ChatMessage, "messageId" | "timestamp">
): Promise<ChatMessage> {
  const full: ChatMessage = {
    ...message,
    messageId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  const list = messages.get(message.projectId) ?? [];
  list.push(full);
  messages.set(message.projectId, list);
  return full;
}
