import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
  type ToolConfiguration,
  type Message,
  type ContentBlock,
  type ToolUseBlock,
} from "@aws-sdk/client-bedrock-runtime";

const DEFAULT_MODEL = "openai.gpt-oss-120b-1:0";
const DEFAULT_ARCHITECTURE_MODEL = "openai.gpt-oss-120b-1:0";

export function getBedrockClient(): BedrockRuntimeClient {
  const region = process.env.AWS_REGION ?? "us-gov-west-1";
  return new BedrockRuntimeClient({
    region,
    ...(process.env.AWS_USE_FIPS_ENDPOINT === "true" ? { useFipsEndpoint: true } : {}),
  });
}

export function getModelId(): string {
  return process.env.BEDROCK_MODEL_ID ?? DEFAULT_MODEL;
}

export function getArchitectureModelId(): string {
  return (
    process.env.BEDROCK_ARCHITECTURE_MODEL_ID ??
    process.env.BEDROCK_MODEL_ID ??
    DEFAULT_ARCHITECTURE_MODEL
  );
}

export function isOpenAiOssModel(modelId: string): boolean {
  return modelId.startsWith("openai.gpt-oss");
}

export interface ConverseOptions {
  system: string;
  messages: Message[];
  toolConfig?: ToolConfiguration;
  maxTokens?: number;
  modelId?: string;
}

export async function converse(options: ConverseOptions) {
  const modelId = options.modelId ?? getModelId();

  if (isOpenAiOssModel(modelId) && !options.toolConfig) {
    const text = await invokeOpenAiOssModel({
      modelId,
      system: options.system,
      userMessage: messageToText(options.messages),
      maxTokens: options.maxTokens ?? 4096,
    });
    return {
      output: {
        message: {
          role: "assistant" as const,
          content: [{ text }],
        },
      },
    };
  }

  const client = getBedrockClient();
  const command = new ConverseCommand({
    modelId,
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

export interface InvokeArchitectureOptions {
  system: string;
  userMessage: string;
  maxTokens?: number;
}

/** Invoke GPT OSS 120B (or configured architecture model) for structured JSON generation. */
export async function invokeArchitectureModel(
  options: InvokeArchitectureOptions
): Promise<string> {
  const modelId = getArchitectureModelId();

  if (isOpenAiOssModel(modelId)) {
    return invokeOpenAiOssModel({
      modelId,
      system: options.system,
      userMessage: options.userMessage,
      maxTokens: options.maxTokens ?? 8192,
    });
  }

  const response = await converse({
    system: options.system,
    messages: [{ role: "user", content: [{ text: options.userMessage }] }],
    maxTokens: options.maxTokens ?? 8192,
    modelId,
  });
  return textFromContent(response.output?.message?.content);
}

async function invokeOpenAiOssModel(options: {
  modelId: string;
  system: string;
  userMessage: string;
  maxTokens: number;
}): Promise<string> {
  const client = getBedrockClient();
  const body = {
    messages: [
      { role: "developer", content: options.system },
      { role: "user", content: options.userMessage },
    ],
    max_tokens: options.maxTokens,
    temperature: 0.3,
  };

  const command = new InvokeModelCommand({
    modelId: options.modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await client.send(command);
  const raw = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
    content?: Array<{ text?: string }>;
    output?: { message?: { content?: Array<{ text?: string }> } };
  };

  if (parsed.choices?.[0]?.message?.content) {
    return parsed.choices[0].message.content;
  }
  if (parsed.content?.[0]?.text) {
    return parsed.content[0].text;
  }
  if (parsed.output?.message?.content?.[0]?.text) {
    return parsed.output.message.content[0].text;
  }
  return raw;
}

function messageToText(messages: Message[]): string {
  return messages
    .map((m) => {
      const role = m.role ?? "user";
      const text = textFromContent(m.content);
      return `${role}: ${text}`;
    })
    .join("\n\n");
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
  const uses: ToolUseBlock[] = [];
  for (const block of blocks) {
    if ("toolUse" in block && block.toolUse) {
      uses.push(block.toolUse);
    }
  }
  return uses;
}

export function isMockMode(): boolean {
  return process.env.BEDROCK_MOCK_MODE === "true" || !process.env.AWS_ACCESS_KEY_ID;
}
