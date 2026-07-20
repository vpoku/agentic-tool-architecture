import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ToolConfiguration,
  type Message,
  type ContentBlock,
  type ToolUseBlock,
} from "@aws-sdk/client-bedrock-runtime";

export function getBedrockClient(): BedrockRuntimeClient {
  const region = process.env.AWS_REGION ?? "us-gov-west-1";
  return new BedrockRuntimeClient({
    region,
    ...(process.env.AWS_USE_FIPS_ENDPOINT === "true" ? { useFipsEndpoint: true } : {}),
  });
}

export function getModelId(): string {
  return (
    process.env.BEDROCK_MODEL_ID ??
    "anthropic.claude-3-5-sonnet-20241022-v2:0"
  );
}

export interface ConverseOptions {
  system: string;
  messages: Message[];
  toolConfig?: ToolConfiguration;
  maxTokens?: number;
}

export async function converse(options: ConverseOptions) {
  const client = getBedrockClient();
  const command = new ConverseCommand({
    modelId: getModelId(),
    system: [{ text: options.system }],
    messages: options.messages,
    toolConfig: options.toolConfig,
    inferenceConfig: {
      maxTokens: options.maxTokens ?? 4096,
      temperature: 0.3,
    },
  });
  return client.send(command);
}

export function textFromContent(blocks?: ContentBlock[]): string {
  if (!blocks) return "";
  return blocks
    .map((b) => ("text" in b && b.text ? b.text : ""))
    .filter(Boolean)
    .join("\n");
}

export function toolUsesFromContent(blocks?: ContentBlock[]): ToolUseBlock[] {
  if (!blocks) return [];
  return blocks.filter((b): b is ToolUseBlock => "toolUse" in b && !!b.toolUse).map((b) => b.toolUse!);
}

export function isMockMode(): boolean {
  return process.env.BEDROCK_MOCK_MODE === "true" || !process.env.AWS_ACCESS_KEY_ID;
}
