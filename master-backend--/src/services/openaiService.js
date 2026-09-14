const OpenAI = require("openai");
const { PETGPT_SYSTEM_PROMPT } = require("../prompts/petgptSystemPrompt");

const OPENAI_MODEL = process.env.OPENAI_MODEL || process.env.PETGPT_AI_MODEL || "gpt-5.6-sol";
const MAX_HISTORY_MESSAGES = 10;

let client = null;

const DECISION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: [
        "greeting",
        "general_question",
        "health_question",
        "health_assessment",
        "emergency_health",
        "product_search",
        "product_recommendation",
        "nutrition",
        "grooming",
        "behavior",
        "order_tracking",
        "shipping",
        "returns",
        "consultant_request",
        "unknown",
      ],
    },
    petType: { type: ["string", "null"] },
    breed: { type: ["string", "null"] },
    age: { type: ["string", "null"] },
    weight: { type: ["string", "null"] },
    healthDomain: {
      type: ["string", "null"],
      enum: [
        "urinary",
        "digestive",
        "skin",
        "ear",
        "eye",
        "dental",
        "respiratory",
        "neurologic",
        "systemic",
        "mobility",
        "pain",
        "injury",
        "poisoning",
        "appetite",
        "behavior",
        "allergy",
        "parasites",
        "general illness",
        null,
      ],
    },
    problem: { type: ["string", "null"] },
    symptoms: { type: "array", items: { type: "string" } },
    emergency: { type: "boolean" },
    emergencyReason: { type: ["string", "null"] },
    needsMoreInfo: { type: "boolean" },
    nextQuestion: { type: ["string", "null"] },
    assessmentComplete: { type: "boolean" },
    readyForProductSearch: { type: "boolean" },
    requestedCategory: { type: ["string", "null"] },
    requestedProductType: { type: ["string", "null"] },
    requestedForm: { type: ["string", "null"] },
    lifeStage: { type: ["string", "null"] },
    recommendedCategory: { type: ["string", "null"] },
    productType: { type: ["string", "null"] },
    concern: { type: ["string", "null"] },
    searchTerms: { type: "array", items: { type: "string" } },
  },
  required: [
    "intent",
    "petType",
    "breed",
    "age",
    "weight",
    "healthDomain",
    "problem",
    "symptoms",
    "emergency",
    "emergencyReason",
    "needsMoreInfo",
    "nextQuestion",
    "assessmentComplete",
    "readyForProductSearch",
    "requestedCategory",
    "requestedProductType",
    "requestedForm",
    "lifeStage",
    "recommendedCategory",
    "productType",
    "concern",
    "searchTerms",
  ],
};

function apiKey() {
  return process.env.OPENAI_API_KEY || process.env.PETGPT_AI_API_KEY || "";
}

function isOpenAIEnabled() {
  return Boolean(apiKey()) && process.env.PETGPT_AI_ENABLED !== "false";
}

function getClient() {
  if (!client) client = new OpenAI({ apiKey: apiKey() });
  return client;
}

function normalizeHistory(history = []) {
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .filter((item) => item?.content)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content).slice(0, 1200),
    }));
}

function outputText(response) {
  if (response?.output_text) return response.output_text;
  return (response?.output || [])
    .flatMap((item) => item.content || [])
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function logOpenAI(event, metadata = {}) {
  if (process.env.NODE_ENV === "test") return;
  console.log(`[PetAssistant] OpenAI ${event}`, {
    model: OPENAI_MODEL,
    ...metadata,
  });
}

function logOpenAIError(error) {
  console.error("[PetAssistant] OpenAI error:", {
    message: error?.message,
    status: error?.status || error?.code || null,
    type: error?.type || null,
  });
}

async function createResponse(payload, metadata = {}) {
  if (!isOpenAIEnabled()) return null;
  logOpenAI("request started", metadata);
  try {
    const response = await getClient().responses.create(payload);
    logOpenAI("response received", {
      ...metadata,
      responseId: response?.id,
    });
    return response;
  } catch (error) {
    logOpenAIError(error);
    throw error;
  }
}

async function runPetAssistantDecision({ message, history, context, safety }) {
  if (!isOpenAIEnabled()) return null;
  const response = await createResponse({
    model: OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: `${PETGPT_SYSTEM_PROMPT}\n\nReturn only the structured routing decision requested by the schema. Do not invent products or order details. If deterministic safety context says emergency, classify as emergency_health.`,
      },
      ...normalizeHistory(history),
      {
        role: "user",
        content: [
          `Latest customer message: ${message}`,
          `Known structured context: ${JSON.stringify(context || {})}`,
          `Deterministic safety context: ${JSON.stringify(safety || {})}`,
        ].join("\n"),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "pet_assistant_decision",
        schema: DECISION_SCHEMA,
        strict: true, 
      },
    },
    max_output_tokens: 500,
  }, { purpose: "decision" });

  const text = outputText(response);
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("[PetAssistant] classifier parsing failed", {
      message: error?.message,
      responseId: response?.id,
    });
    return null;
  }
}  

async function generatePetAssistantMessage({ message, history, products, orderContext, context, intent, safety, recommendationReady }) {
  if (!isOpenAIEnabled()) return null;
  const response = await createResponse({
    model: OPENAI_MODEL,
    input: [
      { role: "system", content: PETGPT_SYSTEM_PROMPT },
      ...normalizeHistory(history),
      {
        role: "user",
        content: [
          `Latest customer message: ${message}`,
          `Structured route/context: ${JSON.stringify({ intent, recommendationReady, conversationState: context, safety })}`,
          `Real products returned by store search: ${JSON.stringify((products || []).map(({ id, name, price, stock, category, petType, prescriptionRequired, vetOnly, reason }) => ({ id, name, price, stock, category, petType, prescriptionRequired, vetOnly, reason })))}`,
          `Order context from backend: ${JSON.stringify(orderContext || null)}`,
        ].join("\n"),
      },
    ],
    max_output_tokens: 350,
  }, { purpose: "message", intent });
  return outputText(response) || null;
}

module.exports = {
  OPENAI_MODEL,
  generatePetAssistantMessage,
  isOpenAIEnabled,
  runPetAssistantDecision,
};
