import type { OAuthCredentials, OAuthLoginCallbacks } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const PROVIDER_ID = "fireworks";
const PROVIDER_NAME = "Fireworks AI";
const BASE_URL = "https://api.fireworks.ai/inference/v1";
const MODELS_DEV_URL = "https://models.dev/api.json";
const MODELS_DEV_PROVIDER_KEY = "fireworks-ai";

type ProviderModel = {
  id: string;
  name: string;
  reasoning: boolean;
  input: Array<"text" | "image">;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
  contextWindow: number;
  maxTokens: number;
};

const DEFAULT_MODELS: ProviderModel[] = [
  {
    id: "accounts/fireworks/models/kimi-k2-instruct",
    name: "Kimi K2 Instruct",
    reasoning: false,
    input: ["text"],
    cost: { input: 1, output: 3, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 16384,
  },
  {
    id: "accounts/fireworks/models/glm-4p7",
    name: "GLM 4.7",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.6, output: 2.2, cacheRead: 0.3, cacheWrite: 0 },
    contextWindow: 198000,
    maxTokens: 198000,
  },
  {
    id: "accounts/fireworks/models/glm-5",
    name: "GLM 5",
    reasoning: true,
    input: ["text"],
    cost: { input: 1, output: 3.2, cacheRead: 0.5, cacheWrite: 0 },
    contextWindow: 202752,
    maxTokens: 131072,
  },
  {
    id: "accounts/fireworks/models/deepseek-v3p1",
    name: "DeepSeek V3.1",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.56, output: 1.68, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 163840,
    maxTokens: 163840,
  },
  {
    id: "accounts/fireworks/models/minimax-m2p1",
    name: "MiniMax-M2.1",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0 },
    contextWindow: 200000,
    maxTokens: 200000,
  },
  {
    id: "accounts/fireworks/models/glm-4p5-air",
    name: "GLM 4.5 Air",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.22, output: 0.88, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131072,
    maxTokens: 131072,
  },
  {
    id: "accounts/fireworks/models/deepseek-v3p2",
    name: "DeepSeek V3.2",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.56, output: 1.68, cacheRead: 0.28, cacheWrite: 0 },
    contextWindow: 160000,
    maxTokens: 160000,
  },
  {
    id: "accounts/fireworks/models/minimax-m2p5",
    name: "MiniMax-M2.5",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0 },
    contextWindow: 196608,
    maxTokens: 196608,
  },
  {
    id: "accounts/fireworks/models/gpt-oss-120b",
    name: "GPT OSS 120B",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.15, output: 0.6, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131072,
    maxTokens: 32768,
  },
  {
    id: "accounts/fireworks/models/kimi-k2p5",
    name: "Kimi K2.5",
    reasoning: true,
    input: ["text", "image"],
    cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
    contextWindow: 256000,
    maxTokens: 256000,
  },
  {
    id: "accounts/fireworks/models/kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.6, output: 2.5, cacheRead: 0.3, cacheWrite: 0 },
    contextWindow: 256000,
    maxTokens: 256000,
  },
  {
    id: "accounts/fireworks/models/glm-4p5",
    name: "GLM 4.5",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.55, output: 2.19, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131072,
    maxTokens: 131072,
  },
  {
    id: "accounts/fireworks/models/gpt-oss-20b",
    name: "GPT OSS 20B",
    reasoning: true,
    input: ["text"],
    cost: { input: 0.05, output: 0.2, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 131072,
    maxTokens: 32768,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeInput(value: unknown): Array<"text" | "image"> {
  if (!isRecord(value) || !Array.isArray(value.input)) return ["text"];
  const inputs = value.input.filter((item): item is string => typeof item === "string");
  return inputs.includes("image") || inputs.includes("video") ? ["text", "image"] : ["text"];
}

function normalizeProviderModel(id: string, value: unknown): ProviderModel | undefined {
  if (!isRecord(value)) return undefined;

  const cost = isRecord(value.cost) ? value.cost : {};
  const limit = isRecord(value.limit) ? value.limit : {};
  const name = typeof value.name === "string" && value.name.trim() ? value.name.trim() : id;

  return {
    id,
    name,
    reasoning: Boolean(value.reasoning),
    input: normalizeInput(value.modalities),
    cost: {
      input: toFiniteNumber(cost.input),
      output: toFiniteNumber(cost.output),
      cacheRead: toFiniteNumber(cost.cache_read ?? cost.cacheRead),
      cacheWrite: toFiniteNumber(cost.cache_write ?? cost.cacheWrite),
    },
    contextWindow: Math.max(1, Math.floor(toFiniteNumber(limit.context, 128000))),
    maxTokens: Math.max(1, Math.floor(toFiniteNumber(limit.output, 16384))),
  };
}

async function fetchModelsFromModelsDev(): Promise<ProviderModel[] | undefined> {
  try {
    const res = await fetch(MODELS_DEV_URL);
    if (!res.ok) return undefined;
    const data = (await res.json()) as Record<string, unknown>;
    const provider = data[MODELS_DEV_PROVIDER_KEY];
    if (!isRecord(provider) || !isRecord(provider.models)) return undefined;

    const models = Object.entries(provider.models as Record<string, unknown>)
      .map(([id, val]) => normalizeProviderModel(id, val))
      .filter((m): m is ProviderModel => Boolean(m))
      .sort((a, b) => a.id.localeCompare(b.id));

    return models.length > 0 ? models : undefined;
  } catch {
    return undefined;
  }
}

async function loginWithApiKey(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
  const key = (
    await callbacks.onPrompt({ message: `Paste ${PROVIDER_NAME} API key:` })
  ).trim();

  if (!key) throw new Error("No API key provided.");

  return {
    access: key,
    refresh: key,
    expires: Date.now() + 3650 * 24 * 60 * 60 * 1000,
  };
}

async function refreshApiKey(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  return credentials;
}

export default function fireworksExtension(pi: ExtensionAPI) {
  // Register immediately with fallback models, then update asynchronously
  pi.registerProvider(PROVIDER_ID, {
    baseUrl: BASE_URL,
    apiKey: "FIREWORKS_API_KEY",
    api: "openai-completions",
    models: DEFAULT_MODELS,
    oauth: {
      name: PROVIDER_NAME,
      login: loginWithApiKey,
      refreshToken: refreshApiKey,
      getApiKey: (credentials) => credentials.access,
    },
  });

  console.log(`[fireworks] Registered ${DEFAULT_MODELS.length} models (fallback)`);

  // Fetch fresh models from models.dev and re-register if successful
  fetchModelsFromModelsDev().then((models) => {
    if (!models) return;
    pi.registerProvider(PROVIDER_ID, {
      baseUrl: BASE_URL,
      apiKey: "FIREWORKS_API_KEY",
      api: "openai-completions",
      models,
      oauth: {
        name: PROVIDER_NAME,
        login: loginWithApiKey,
        refreshToken: refreshApiKey,
        getApiKey: (credentials) => credentials.access,
      },
    });
    console.log(`[fireworks] Updated to ${models.length} models from models.dev`);
  });
}
