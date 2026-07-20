import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Project, ChatMessage, ArchitectureProposal } from "@cloudarch/shared";
import * as memoryStore from "./projects";

const TABLE_PROJECTS = process.env.DYNAMODB_PROJECTS_TABLE ?? "CloudArch-Projects";
const TABLE_MESSAGES = process.env.DYNAMODB_MESSAGES_TABLE ?? "CloudArch-Messages";
const USE_DYNAMODB = process.env.USE_DYNAMODB === "true";

function getClient() {
  const region = process.env.AWS_REGION ?? "us-gov-west-1";
  const config: ConstructorParameters<typeof DynamoDBClient>[0] = { region };
  if (process.env.AWS_USE_FIPS_ENDPOINT === "true") {
    config.useFipsEndpoint = true;
  }
  const client = new DynamoDBClient(config);
  return DynamoDBDocumentClient.from(client);
}

export async function ensureTables(): Promise<void> {
  if (!USE_DYNAMODB) return;
  const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-gov-west-1" });

  for (const tableName of [TABLE_PROJECTS, TABLE_MESSAGES]) {
    try {
      await client.send(new DescribeTableCommand({ TableName: tableName }));
    } catch {
      const keySchema =
        tableName === TABLE_PROJECTS
          ? [
              { AttributeName: "userId", KeyType: "HASH" as const },
              { AttributeName: "projectId", KeyType: "RANGE" as const },
            ]
          : [
              { AttributeName: "projectId", KeyType: "HASH" as const },
              { AttributeName: "timestamp", KeyType: "RANGE" as const },
            ];
      const attrDefs =
        tableName === TABLE_PROJECTS
          ? [
              { AttributeName: "userId", AttributeType: "S" as const },
              { AttributeName: "projectId", AttributeType: "S" as const },
            ]
          : [
              { AttributeName: "projectId", AttributeType: "S" as const },
              { AttributeName: "timestamp", AttributeType: "S" as const },
            ];

      await client.send(
        new CreateTableCommand({
          TableName: tableName,
          KeySchema: keySchema,
          AttributeDefinitions: attrDefs,
          BillingMode: "PAY_PER_REQUEST",
        })
      );
    }
  }
}

export async function createProject(input: {
  name: string;
  description: string;
  complianceLevel?: string;
}): Promise<Project> {
  if (!USE_DYNAMODB) return memoryStore.createProject(input);

  const project = await memoryStore.createProject(input);
  const doc = getClient();
  await doc.send(new PutCommand({ TableName: TABLE_PROJECTS, Item: project }));
  return project;
}

export async function getProject(projectId: string): Promise<Project | null> {
  if (!USE_DYNAMODB) return memoryStore.getProject(projectId);

  const doc = getClient();
  const userId = memoryStore.getDemoUserId();
  const result = await doc.send(
    new GetCommand({
      TableName: TABLE_PROJECTS,
      Key: { userId, projectId },
    })
  );
  return (result.Item as Project) ?? memoryStore.getProject(projectId);
}

export async function listProjects(userId?: string): Promise<Project[]> {
  if (!USE_DYNAMODB) return memoryStore.listProjects(userId);

  const doc = getClient();
  const uid = userId ?? memoryStore.getDemoUserId();
  const result = await doc.send(
    new QueryCommand({
      TableName: TABLE_PROJECTS,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": uid },
    })
  );
  const items = (result.Items as Project[]) ?? [];
  if (items.length === 0) return memoryStore.listProjects(userId);
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveArchitecture(
  projectId: string,
  architecture: ArchitectureProposal
): Promise<Project | null> {
  const updated = await memoryStore.saveArchitecture(projectId, architecture);
  if (!updated || !USE_DYNAMODB) return updated;

  const doc = getClient();
  await doc.send(
    new PutCommand({
      TableName: TABLE_PROJECTS,
      Item: updated,
    })
  );
  return updated;
}

export async function getChatMessages(projectId: string): Promise<ChatMessage[]> {
  if (!USE_DYNAMODB) return memoryStore.getChatMessages(projectId);

  const doc = getClient();
  const result = await doc.send(
    new QueryCommand({
      TableName: TABLE_MESSAGES,
      KeyConditionExpression: "projectId = :pid",
      ExpressionAttributeValues: { ":pid": projectId },
    })
  );
  const items = (result.Items as ChatMessage[]) ?? [];
  if (items.length === 0) return memoryStore.getChatMessages(projectId);
  return items.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export async function addChatMessage(
  message: Omit<ChatMessage, "messageId" | "timestamp">
): Promise<ChatMessage> {
  const full = await memoryStore.addChatMessage(message);
  if (!USE_DYNAMODB) return full;

  const doc = getClient();
  await doc.send(
    new PutCommand({
      TableName: TABLE_MESSAGES,
      Item: { ...full, timestamp: full.timestamp },
    })
  );
  return full;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Pick<Project, "name" | "description" | "status" | "architecture" | "complianceLevel">>
): Promise<Project | null> {
  const updated = await memoryStore.updateProject(projectId, updates);
  if (!updated || !USE_DYNAMODB) return updated;

  const doc = getClient();
  await doc.send(
    new PutCommand({
      TableName: TABLE_PROJECTS,
      Item: updated,
    })
  );
  return updated;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const deleted = await memoryStore.deleteProject(projectId);
  if (!USE_DYNAMODB || !deleted) return deleted;

  const doc = getClient();
  const userId = memoryStore.getDemoUserId();
  await doc.send(
    new PutCommand({
      TableName: TABLE_PROJECTS,
      Item: {
        projectId,
        userId,
        deleted: true,
        updatedAt: new Date().toISOString(),
      },
    })
  );
  return deleted;
}

export { getDemoUserId } from "./projects";
