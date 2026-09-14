const OpenAI = require("openai");
const ApiError = require("../utils/apiError");
const aiCallingService = require("./aiCallingService");
const { getEmailBrand } = require("./emailService");

const MODEL = process.env.OPENAI_CALLING_MODEL || process.env.OPENAI_MODEL || "gpt-5.6-terra";
const PRODUCT_RESULT_LIMIT = 5;
const RECENT_MESSAGE_LIMIT = 12;

let client = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new ApiError(500, "OpenAI is not configured. OPENAI_API_KEY is required.");
  }
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

const tools = [
  {
    type: "function",
    name: "update_customer_status",
    description: "Update the active customer's lead status with an audit record.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: {
          type: "string",
          enum: ["interested", "not_interested", "callback_requested", "information_sent", "do_not_call", "completed"],
        },
        reason: { type: "string" },
      },
      required: ["status", "reason"],
    },
  },
  {
    type: "function",
    name: "send_email_information",
    description: "Send approved store information by email to the active customer.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        email: { type: ["string", "null"] },
        subject: { type: ["string", "null"] },
        message: { type: ["string", "null"] },
      },
      required: ["email", "subject", "message"],
    },
  },
  {
    type: "function",
    name: "send_whatsapp_information",
    description: "Send approved store information over the configured WhatsApp provider.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        whatsappNumber: { type: ["string", "null"] },
        message: { type: ["string", "null"] },
      },
      required: ["whatsappNumber", "message"],
    },
  },
  {
    type: "function",
    name: "schedule_callback",
    description: "Schedule a callback after the customer gives a clear date and time.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        scheduledAt: { type: "string" },
        timezone: { type: "string" },
        notes: { type: ["string", "null"] },
      },
      required: ["scheduledAt", "timezone", "notes"],
    },
  },
  {
    type: "function",
    name: "mark_do_not_call",
    description: "Permanently suppress the customer from future calling campaigns.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: { reason: { type: "string" } },
      required: ["reason"],
    },
  },
  {
    type: "function",
    name: "end_call",
    description: "Politely end the active call.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        outcome: {
          type: "string",
          enum: ["interested", "not_interested", "callback_requested", "information_sent", "do_not_call", "completed"],
        },
      },
      required: ["outcome"],
    },
  },
];

function outputText(response) {
  if (response?.output_text) return response.output_text;
  return (response?.output || [])
    .flatMap((item) => item.content || [])
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function brandText(value, brand) {
  return String(value || "").replace(/\bBest\s+Vet\s+Care\b/gi, brand);
}

function normalizeSpeechText(transcript) {
  return String(transcript || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isWeakAcknowledgement(transcript) {
  const text = normalizeSpeechText(transcript);
  return /^(h+m+|hm+|hmm+|uh huh|uhhuh|okay|ok|yes|yeah|yep|sure|alright|right|thank you|thanks|thank u)$/i.test(text);
}

function lastAssistantMessage(conversation = []) {
  return [...conversation].reverse().find((message) => message.role === "assistant")?.content || "";
}

function isPositiveAcknowledgement(transcript) {
  const text = normalizeSpeechText(transcript);
  return /^(yes|yeah|yep|sure|ok|okay|alright|right|please|go ahead|yes please|haan|ha)$/i.test(text);
}

function isNegativeAcknowledgement(transcript) {
  const text = normalizeSpeechText(transcript);
  return /^(no|nope|not now|don't|dont|na|nahi|no thank you|no thanks)$/i.test(text);
}

function isInterestedCustomerSpeech(transcript) {
  const text = normalizeSpeechText(transcript);
  return isPositiveAcknowledgement(transcript) ||
    /\b(interested|i need|i want|looking for|send|share|price|available|availability|medicine|food|grooming|product|dog|cat|pet)\b/.test(text);
}

function shouldTreatNegativeAsNotInterested(transcript, conversation = []) {
  if (!isNegativeAcknowledgement(transcript)) return false;
  const previous = normalizeSpeechText(lastAssistantMessage(conversation));
  return !previous ||
    /\b(good time|time to speak|interested|need any|looking for|can i help|would you like)\b/.test(previous);
}

async function updateLeadStatusIfNeeded(call, callId, status, reason, db) {
  const currentStatus = call?.customer?.leadStatus;
  if (!call?.customer?.id || currentStatus === status || currentStatus === "do_not_call") return;
  await aiCallingService.updateCustomerLeadStatus({
    customerId: call.customer.id,
    callId,
    status,
    reason,
    user: null,
  }, db).catch(() => undefined);
}

function contextualAcknowledgementReply(transcript, conversation = [], brand) {
  if (!isPositiveAcknowledgement(transcript)) return null;
  const previous = normalizeSpeechText(lastAssistantMessage(conversation));
  if (!previous) return null;

  if (/\bdo you mean\b/.test(previous) && /\bfood\b/.test(previous) && /\bdog\b/.test(previous)) {
    return "Great. Should I share the available dog food options on WhatsApp or email?";
  }
  if (/\bis the food for a dog or a cat\b/.test(previous)) {
    return "Sure. Is it for a dog or a cat?";
  }
  if (/\bwould you prefer\b/.test(previous) && /\bwhatsapp\b/.test(previous) && /\bemail\b/.test(previous)) {
    return "Sure. Would you like me to send it on WhatsApp or email?";
  }
  if (/\bshould i share\b/.test(previous) && /\bemail\b/.test(previous)) {
    return `Sure, I can share it. Please say email or WhatsApp so I can send the details from ${brand}.`;
  }

  return null;
} 

function customerEndIntent(transcript, conversation = []) {
  const text = normalizeSpeechText(transcript);
  const hasConversation = conversation.some((message) => message.role === "assistant");
  if (
    /\b(do not call|don't call|dont call|stop calling|remove my number|never call|no more calls)\b/.test(text) ||
    /\b(call mat|mat call|phone mat|dobara mat|fir se mat|again mat)\b/.test(text)
  ) {
    return { outcome: "do_not_call", reason: "Customer asked not to be called again" };
  }
  if (
    /\b(not interested|no interest|no need|do not need|don't need|dont need|not required|cancel|cut the call|hang up)\b/.test(text) ||
    /\b(bye|goodbye|ok bye|thank you bye|bas|nahi chahiye|na chahiye|jarurat nahi|zarurat nahi|rakh do|band karo|call cut|call end|please cut|cut call|end call|disconnect)\b/.test(text)
  ) {
    return { outcome: "not_interested", reason: "Customer ended or declined the conversation" };
  }
  if (
    hasConversation &&
    (
      /\b(okay thank you bye|ok thank you bye|thanks bye|thank you bye|thank u bye|done thank you|that's all thank you|thats all thank you|that's all|thats all)\b/.test(text) ||
      /આભાર|ધન્યવાદ|બરાબર\s*આભાર|શુભ|बस\s*धन्यवाद|धन्यवाद/.test(String(transcript || ""))
    )
  ) {
    return { outcome: "completed", reason: "Customer thanked the agent and ended the conversation" };
  }
  return null;
}

function acknowledgementReply(transcript, brand) {
  if (!isWeakAcknowledgement(transcript)) return null;
  const text = normalizeSpeechText(transcript);
  if (/^thank/.test(text)) {
    return `You're welcome. Is there any pet medicine, food, grooming product, or healthcare item you need from ${brand}?`;
  }
  return "Sure. What pet-care product or medicine are you looking for today?";
}

function recentConversation(messages = []) {
  return messages
    .filter((message) => ["customer", "agent"].includes(message.role))
    .slice(-RECENT_MESSAGE_LIMIT)
    .map((message) => ({
      role: message.role === "agent" ? "assistant" : "customer",
      content: String(message.content || "").slice(0, 500),
      metadata: message.metadata || null,
    }));
}

function productSearchQuery(messages = [], transcript = "") {
  const recentCustomerSpeech = messages
    .filter((message) => message.role === "customer")
    .slice(-4)
    .map((message) => message.content)
    .join(" ");
  return [recentCustomerSpeech, transcript].filter(Boolean).join(" ");
}

function productSearchTerms(transcript) {
  const value = String(transcript || "").toLowerCase();
  const terms = new Set(
    value
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3),
  );

  if (/\b(dog|dogs|puppy)\b/.test(value) || /કૂત|ડોગ/.test(value)) terms.add("dog");
  if (/\b(cat|cats|kitten)\b/.test(value) || /બિલાડ/.test(value)) terms.add("cat");
  if (/\b(belt|collar|leash|harness)\b/.test(value) || /બેલ્ટ|પટ્ટો|પટ્ટી|કોલર/.test(value)) {
    ["belt", "collar", "leash", "harness"].forEach((term) => terms.add(term));
  }
  if (/\bmedicine|medicines|tablet|syrup|health\b/.test(value) || /દવા|મેડિસિન/.test(value)) {
    ["medicine", "health"].forEach((term) => terms.add(term));
  }
  if (/\bfood|feed|treat|treats\b/.test(value) || /ફૂડ|ખોરાક/.test(value)) {
    ["food", "treat"].forEach((term) => terms.add(term));
  }
  if (/\bshampoo|grooming|brush\b/.test(value) || /શેમ્પૂ|ગ્રૂમ/.test(value)) {
    ["shampoo", "grooming"].forEach((term) => terms.add(term));
  }

  return [...terms].slice(0, 10);
}

function wantsEmailInformation(transcript) {
  const value = String(transcript || "").toLowerCase();
  return (
    /\b(email|mail|e-mail|gmail)\b/.test(value) ||
    /ઈમેલ|ઇમેલ|મેલ|ईमेल|मेल/.test(String(transcript || ""))
  ) && (
    /\b(send|share|sent|mail|email|details|product|products|information|info)\b/.test(value) ||
    /મોકલ|મોકલો|શેર|વિગત|પ્રોડક્ટ|जानकारी|भेज|भेजो|उत्पाद/.test(String(transcript || ""))
  );
}

function wantsWhatsappInformation(transcript) {
  const value = normalizeSpeechText(transcript);
  return (
    /\b(whatsapp|whats app|watsapp|wa)\b/.test(value) ||
    /àªµà«‹àªŸà«àª¸àªàªª|àªµà«‹àªŸà«àª¸àªàªª|à¤µà¥à¤¹à¤¾à¤Ÿà¥à¤¸à¤à¤ª/.test(String(transcript || ""))
  ) && (
    /\b(send|share|sent|message|details|product|products|information|info)\b/.test(value) ||
    /àª®à«‹àª•àª²|àª®à«‹àª•àª²à«‹|àª¶à«‡àª°|àªµàª¿àª—àª¤|à¤­à¥‡à¤œ|à¤­à¥‡à¤œà¥‹/.test(String(transcript || ""))
  );
}

function wantsBothInformation(transcript) {
  const value = normalizeSpeechText(transcript);
  return wantsEmailInformation(transcript) && wantsWhatsappInformation(transcript) ||
    /\b(both|email and whatsapp|whatsapp and email)\b/.test(value);
}

function hasSuccessfulEmailAction(actions = []) {
  return actions.some((action) => action.type === "send_email_information" && action.status === "success");
}

function lastAgentState(conversation = []) {
  const lastAgent = [...conversation].reverse().find((message) => message.role === "assistant" && message.metadata);
  return lastAgent?.metadata?.voiceState || null;
}

function selectedProductsFromState(state) {
  if (Array.isArray(state?.selectedProducts) && state.selectedProducts.length) return state.selectedProducts;
  return state?.selectedProduct ? [state.selectedProduct] : [];
}

function pendingActionFromConversation(conversation = []) {
  return lastAgentState(conversation)?.pendingAction || null;
}

function confirmsEmailInformation(transcript, conversation = []) {
  if (!isPositiveAcknowledgement(transcript)) return false;
  const pendingAction = pendingActionFromConversation(conversation);
  if (pendingAction?.type === "SEND_PRODUCT_DETAILS" && pendingAction.channel === "email") return true;
  if (pendingAction?.type === "SEND_PRODUCT_DETAILS") return false;
  const previous = normalizeSpeechText(lastAssistantMessage(conversation));
  if (!previous) return false;
  if (/\bwhatsapp\s+or\s+email\b|\bemail\s+or\s+whatsapp\b/.test(previous)) return false;
  return (
    /\b(email|mail|e mail|gmail)\b/.test(previous) &&
    /\b(detail|details|information|info|product|products)\b/.test(previous) &&
    /\b(would you like|should i|shall i|can i|do you want)\b/.test(previous)
  );
}

function confirmsWhatsappInformation(transcript, conversation = []) {
  if (!isPositiveAcknowledgement(transcript)) return false;
  const pendingAction = pendingActionFromConversation(conversation);
  if (pendingAction?.type === "SEND_PRODUCT_DETAILS" && pendingAction.channel === "whatsapp") return true;
  if (pendingAction?.type === "SEND_PRODUCT_DETAILS") return false;
  const previous = normalizeSpeechText(lastAssistantMessage(conversation));
  if (!previous) return false;
  if (/\bwhatsapp\s+or\s+email\b|\bemail\s+or\s+whatsapp\b/.test(previous)) return false;
  return (
    /\b(whatsapp|whats app|watsapp)\b/.test(previous) &&
    /\b(detail|details|information|info|product|products)\b/.test(previous) &&
    /\b(would you like|should i|shall i|can i|do you want)\b/.test(previous)
  );
}

function declinesDeliveryInformation(transcript, conversation = []) {
  if (!isNegativeAcknowledgement(transcript)) return false;
  const pendingAction = pendingActionFromConversation(conversation);
  if (pendingAction?.type === "SEND_PRODUCT_DETAILS") return true;
  const previous = normalizeSpeechText(lastAssistantMessage(conversation));
  return /\b(email|mail|gmail|whatsapp|whats app)\b/.test(previous) &&
    /\b(detail|details|information|info|product|products)\b/.test(previous);
}

function asksForAnotherProduct(transcript, conversation = []) {
  if (!isPositiveAcknowledgement(transcript)) return false;
  return /\b(another|other|more)\b.*\b(product|item|option)\b/.test(normalizeSpeechText(lastAssistantMessage(conversation)));
}

function declinesAnotherProduct(transcript, conversation = []) {
  if (!isNegativeAcknowledgement(transcript)) return false;
  return /\b(another|other|more)\b.*\b(product|item|option)\b/.test(normalizeSpeechText(lastAssistantMessage(conversation)));
}

function extractEmailAddress(transcript) {
  return String(transcript || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || null;
}

function isAwaitingEmailAddress(conversation = []) {
  return lastAgentState(conversation)?.pendingAction?.awaitingEmailAddress === true;
}

function normalizeSelectedProduct(product = {}) {
  if (!product?.name) return null;
  return {
    id: product.id || null,
    name: product.name,
    price: product.price,
    mrp: product.mrp ?? product.salePrice,
    stock: product.stock,
    category: product.category?.name || product.category || null,
    description: product.description || null,
    petType: product.petType || null,
    prescriptionRequired: Boolean(product.prescriptionRequired),
    vetOnly: Boolean(product.vetOnly),
  };
}

function deliveryChannelsForTurn(transcript, conversation = []) {
  const pendingAction = pendingActionFromConversation(conversation);
  if (pendingAction?.awaitingEmailAddress && extractEmailAddress(transcript)) {
    return pendingAction.channel === "both" ? ["email", "whatsapp"] : [pendingAction.channel || "email"];
  }
  if (wantsBothInformation(transcript) || pendingAction?.channel === "both") return ["email", "whatsapp"];
  if (wantsEmailInformation(transcript) || confirmsEmailInformation(transcript, conversation)) return ["email"];
  if (wantsWhatsappInformation(transcript) || confirmsWhatsappInformation(transcript, conversation)) return ["whatsapp"];
  return [];
}

function voiceStateForAgentReply(message, products = [], previousState = null) {
  const normalizedMessage = normalizeSpeechText(message);
  const selectedProducts = products.map(normalizeSelectedProduct).filter(Boolean);
  const selectedProduct = selectedProducts[0] || previousState?.selectedProduct || null;
  const base = {
    conversationStage: previousState?.conversationStage || "DISCOVERING_NEED",
    selectedProduct,
    selectedProducts: selectedProducts.length ? selectedProducts : selectedProductsFromState(previousState),
    pendingAction: null,
  };

  if (selectedProduct && /\b(would you like|should i|shall i|can i|do you want)\b/.test(normalizedMessage)) {
    if (/\b(email|mail|gmail)\b/.test(normalizedMessage) && !/\bwhatsapp\b/.test(normalizedMessage)) {
      return {
        ...base,
        conversationStage: "AWAITING_DELIVERY_CONFIRMATION",
        pendingAction: { type: "SEND_PRODUCT_DETAILS", channel: "email", productId: selectedProduct.id },
      };
    }
    if (/\bwhatsapp\b/.test(normalizedMessage) && !/\b(email|mail|gmail)\b/.test(normalizedMessage)) {
      return {
        ...base,
        conversationStage: "AWAITING_DELIVERY_CONFIRMATION",
        pendingAction: { type: "SEND_PRODUCT_DETAILS", channel: "whatsapp", productId: selectedProduct.id },
      };
    }
    if (/\bwhatsapp\b/.test(normalizedMessage) && /\b(email|mail|gmail)\b/.test(normalizedMessage)) {
      return { ...base, conversationStage: "OFFERING_DELIVERY_CHANNEL" };
    }
  }

  if (selectedProduct) return { ...base, conversationStage: "PRODUCT_RECOMMENDED" };
  return base;
}

function logStateTransition(callId, from, to, pendingAction = null) {
  if (from === to && !pendingAction) return;
  console.log("VOICE_CONVERSATION_STATE", JSON.stringify({
    callId,
    from: from || null,
    to,
    pendingAction: pendingAction ? `${pendingAction.type}:${pendingAction.channel}` : null,
    productId: pendingAction?.productId || null,
  }));
}

function logPendingActionResolved(callId, transcript, pendingAction) {
  if (!pendingAction) return;
  console.log("VOICE_PENDING_ACTION_RESOLVED", JSON.stringify({
    callId,
    transcript,
    pendingAction: pendingAction.type,
    channel: pendingAction.channel,
    productId: pendingAction.productId || null,
  }));
}

function deliverySuccessMessage(channels, brand) {
  if (channels.length > 1) {
    return `Done. I've sent the product details to your email and WhatsApp. Thank you for speaking with ${brand}. Have a great day.`;
  }
  if (channels[0] === "whatsapp") {
    return `Done. I've sent the product details on WhatsApp. Thank you for speaking with ${brand}. Have a great day.`;
  }
  return `Done. I've sent the product details to your email. Thank you for speaking with ${brand}. Have a great day.`;
}

function deliveryFailureMessage(results, brand) {
  const email = results.find((result) => result.channel === "email");
  const whatsapp = results.find((result) => result.channel === "whatsapp");
  if (email?.ok && whatsapp && !whatsapp.ok) {
    return `I've sent the email, but I could not send WhatsApp right now. Thank you for speaking with ${brand}. Have a great day.`;
  }
  if (whatsapp?.ok && email && !email.ok) {
    return `I've sent it on WhatsApp, but I could not send the email right now. Thank you for speaking with ${brand}. Have a great day.`;
  }
  if (whatsapp && !whatsapp.ok && !email) {
    return "I could not send it on WhatsApp right now. Please confirm your number with our team.";
  }
  return "I could not send the email right now. Please confirm your email address with our team.";
}

async function searchCatalogProducts(transcript, db) {
  const terms = productSearchTerms(transcript);
  if (!terms.length || !db?.product) return [];
  const products = await db.product.findMany({
    where: {
      status: "Active",
      OR: terms.flatMap((term) => [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { petType: { contains: term, mode: "insensitive" } },
        { category: { name: { contains: term, mode: "insensitive" } } },
      ]),
    },
    include: { category: true },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take: 25,
  });
  const rankedProducts = preferRequestedProductType(products, terms);
  return rankedProducts
    .map((product) => ({ product, score: scoreProductMatch(product, terms) }))
    .sort((a, b) => b.score - a.score || Number(b.product.stock || 0) - Number(a.product.stock || 0))
    .slice(0, PRODUCT_RESULT_LIMIT)
    .map(({ product }) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    mrp: product.salePrice,
    stock: product.stock,
    category: product.category?.name || null,
    description: product.description || null,
    petType: product.petType || null,
    prescriptionRequired: product.prescriptionRequired,
    vetOnly: product.vetOnly,
  }));
}

function productText(product = {}) {
  return [
    product.name,
    product.description,
    product.category?.name,
    product.petType,
  ].join(" ").toLowerCase();
}

function preferRequestedProductType(products, terms) {
  if (!terms.includes("food") && !terms.includes("treat")) return products;
  const preferred = products.filter((product) =>
    /\b(food|feed|treat|treats|diet|kibble|nutrition)\b/.test(productText(product)));
  return preferred.length ? preferred : products;
}

function scoreProductMatch(product, terms) {
  const name = String(product.name || "").toLowerCase();
  const description = String(product.description || "").toLowerCase();
  const category = String(product.category?.name || "").toLowerCase();
  const petType = String(product.petType || "").toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (name.includes(term)) score += 8;
    if (description.includes(term)) score += 5;
    if (category.includes(term)) score += 4;
    if (petType.includes(term)) score += 2;
  }
  if (terms.some((term) => ["belt", "collar", "leash", "harness"].includes(term))) {
    if (/\b(belt|collar|leash|harness)\b/.test(name)) score += 20;
    if (/\b(belt|collar|leash|harness)\b/.test(category)) score += 12;
  }
  if (terms.some((term) => ["food", "feed", "treat"].includes(term))) {
    if (/\b(food|feed|treat|treats|diet|kibble|nutrition)\b/.test(name)) score += 24;
    if (/\b(food|feed|treat|treats|diet|nutrition)\b/.test(category)) score += 16;
  }
  return score;
}

async function respondToTurn({ callId, transcript, db, brandName }) {
  await aiCallingService.recordMessage(callId, { role: "customer", content: transcript }, db);
  const call = await aiCallingService.getCall(callId, db);
  const brand = String(brandName || getEmailBrand().name || "Store").trim() || "Store";
  const conversation = recentConversation(call.messages)
    .map((message) => ({ ...message, content: brandText(message.content, brand) }));
  const previousState = lastAgentState(conversation);
  const pendingAction = pendingActionFromConversation(conversation);
  if (isAwaitingEmailAddress(conversation)) {
    const email = extractEmailAddress(transcript);
    if (!email) {
      const message = "Please say a valid email address so I can send the product details.";
      await aiCallingService.recordMessage(callId, {
        role: "agent",
        content: message,
        metadata: {
          voiceState: {
            ...previousState,
            conversationStage: "AWAITING_EMAIL_ADDRESS",
            pendingAction,
          },
        },
      }, db);
      return { message };
    }
  }
  const endIntent = customerEndIntent(transcript, conversation);
  if (endIntent) {
    await updateLeadStatusIfNeeded(call, callId, endIntent.outcome, endIntent.reason, db);
    const message = endIntent.outcome === "do_not_call"
      ? `Okay, I will not call you again from ${brand}. Thank you.`
      : `Okay, thank you for your time. Have a good day from ${brand}.`;
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: message,
      metadata: { endCall: true, outcome: endIntent.outcome },
    }, db);
    return {
      message,
      endCall: true,
      outcome: endIntent.outcome,
      endReason: endIntent.reason,
    };
  }
  if (shouldTreatNegativeAsNotInterested(transcript, conversation)) {
    const reason = "Customer answered negatively";
    await updateLeadStatusIfNeeded(call, callId, "not_interested", reason, db);
    const message = `No problem. Thank you for your time. Have a good day from ${brand}.`;
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: message,
      metadata: { endCall: true, outcome: "not_interested" },
    }, db);
    return {
      message,
      endCall: true,
      outcome: "not_interested",
      endReason: reason,
    };
  }
  if (isInterestedCustomerSpeech(transcript)) {
    await updateLeadStatusIfNeeded(call, callId, "interested", "Customer answered positively or showed interest", db);
  }
  if (declinesAnotherProduct(transcript, conversation)) {
    const message = `Okay, thank you for speaking with ${brand}. Have a great day.`;
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: message,
      metadata: {
        endCall: true,
        outcome: "completed",
        voiceState: { ...previousState, conversationStage: "CLOSING", pendingAction: null },
      },
    }, db);
    return { message, endCall: true, outcome: "completed", endReason: "Customer declined another product" };
  }
  if (asksForAnotherProduct(transcript, conversation)) {
    const message = "Sure. What pet-care product or medicine are you looking for today?";
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: message,
      metadata: {
        contextualAcknowledgement: true,
        voiceState: { conversationStage: "DISCOVERING_NEED", pendingAction: null },
      },
    }, db);
    return { message };
  }
  if (declinesDeliveryInformation(transcript, conversation)) {
    const message = pendingAction?.channel === "email"
      ? "No problem. Would you prefer WhatsApp instead?"
      : `No problem. Thank you for speaking with ${brand}. Have a great day.`;
    const nextState = pendingAction?.channel === "email"
      ? {
          ...previousState,
          conversationStage: "AWAITING_DELIVERY_CONFIRMATION",
          pendingAction: {
            type: "SEND_PRODUCT_DETAILS",
            channel: "whatsapp",
            productId: pendingAction.productId || previousState?.selectedProduct?.id || null,
          },
        }
      : { ...previousState, conversationStage: "CLOSING", pendingAction: null };
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: message,
      metadata: {
        endCall: pendingAction?.channel !== "email",
        outcome: pendingAction?.channel !== "email" ? "completed" : undefined,
        voiceState: nextState,
      },
    }, db);
    return pendingAction?.channel === "email"
      ? { message }
      : { message, endCall: true, outcome: "completed", endReason: "Customer declined product details" };
  }
  const deliveryChannels = deliveryChannelsForTurn(transcript, conversation);
  if (deliveryChannels.length) {
    logPendingActionResolved(callId, transcript, pendingAction);
    const stateProducts = selectedProductsFromState(previousState);
    const products = stateProducts.length
      ? stateProducts
      : await searchCatalogProducts(productSearchQuery(call.messages, transcript), db);
    const suppliedEmail = extractEmailAddress(transcript);
    if (deliveryChannels.includes("email") && !(suppliedEmail || call.customer.email)) {
      const message = "Sure. What email address should I send the details to?";
      const nextState = {
        ...previousState,
        conversationStage: "AWAITING_EMAIL_ADDRESS",
        selectedProduct: products[0] || previousState?.selectedProduct || null,
        selectedProducts: products.length ? products : selectedProductsFromState(previousState),
        pendingAction: {
          type: "SEND_PRODUCT_DETAILS",
          channel: deliveryChannels.length > 1 ? "both" : "email",
          productId: products[0]?.id || previousState?.selectedProduct?.id || null,
          awaitingEmailAddress: true,
        },
      };
      logStateTransition(callId, previousState?.conversationStage, nextState.conversationStage, nextState.pendingAction);
      await aiCallingService.recordMessage(callId, {
        role: "agent",
        content: message,
        metadata: { voiceState: nextState },
      }, db);
      return { message };
    }
    if (deliveryChannels.length === 1 && deliveryChannels[0] === "email" && hasSuccessfulEmailAction(call.actions)) {
      const message = `I have already sent the product details to your email. Thank you for speaking with ${brand}. Have a good day.`;
      await aiCallingService.recordMessage(callId, {
        role: "agent",
        content: message,
        metadata: {
          emailAlreadySent: true,
          voiceState: { ...previousState, conversationStage: "CLOSING", pendingAction: null },
        },
      }, db);
      return {
        message,
        endCall: true,
        outcome: "information_sent",
        endReason: "Product details were already sent by email",
      };
    }

    logStateTransition(callId, previousState?.conversationStage, "SENDING_DETAILS", pendingAction);
    const results = await Promise.all(deliveryChannels.map(async (channel) => {
      try {
        const action = channel === "email"
          ? await aiCallingService.runAction(callId, "send_email_information", {
              email: suppliedEmail || call.customer.email || null,
              subject: `${brand} product details`,
              message: null,
              productQuery: productSearchQuery(call.messages, transcript),
              products,
            }, null, db)
          : await aiCallingService.runAction(callId, "send_whatsapp_information", {
              whatsappNumber: call.customer.whatsappNumber || call.customer.phone || null,
              message: null,
              productQuery: productSearchQuery(call.messages, transcript),
              products,
            }, null, db);
        return { channel, ok: true, action };
      } catch (error) {
        return { channel, ok: false, error };
      }
    }));
    const successes = results.filter((result) => result.ok);
    if (successes.length) {
      await aiCallingService.updateCustomerLeadStatus({
        customerId: call.customer.id,
        callId,
        status: "information_sent",
        reason: `Customer requested product details by ${successes.map((result) => result.channel).join(" and ")}`,
        user: null,
      }, db).catch(() => undefined);
      const sentChannels = successes.map((result) => result.channel);
      const message = successes.length === deliveryChannels.length
        ? deliverySuccessMessage(sentChannels, brand)
        : deliveryFailureMessage(results, brand);
      const nextState = { ...previousState, conversationStage: "CLOSING", pendingAction: null };
      logStateTransition(callId, "SENDING_DETAILS", "DETAILS_SENT", null);
      logStateTransition(callId, "DETAILS_SENT", "CLOSING", null);
      await aiCallingService.recordMessage(callId, {
        role: "agent",
        content: message,
        metadata: {
          emailSent: sentChannels.includes("email"),
          whatsappSent: sentChannels.includes("whatsapp"),
          productCount: products.length,
          voiceState: nextState,
        },
      }, db);
      return {
        message,
        endCall: true,
        outcome: "information_sent",
        endReason: `Customer requested product details by ${sentChannels.join(" and ")}`,
      };
    }
    const message = deliveryFailureMessage(results, brand);
    const nextState = { ...previousState, conversationStage: "DELIVERY_FAILED", pendingAction: null };
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: message,
      metadata: {
        emailSendFailed: deliveryChannels.includes("email"),
        whatsappSendFailed: deliveryChannels.includes("whatsapp"),
        error: results.map((result) => result.error?.message).filter(Boolean).join("; "),
        voiceState: nextState,
      },
    }, db);
    return { message };
  }
  const contextualAckMessage = contextualAcknowledgementReply(transcript, conversation, brand);
  if (contextualAckMessage) {
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: contextualAckMessage,
      metadata: { contextualAcknowledgement: true },
    }, db);
    return { message: contextualAckMessage };
  }
  const acknowledgementMessage = acknowledgementReply(transcript, brand);
  if (acknowledgementMessage) {
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: acknowledgementMessage,
      metadata: { weakAcknowledgement: true },
    }, db);
    return { message: acknowledgementMessage };
  }
  const products = await searchCatalogProducts(productSearchQuery(call.messages, transcript), db);
  const agentPrompt = brandText(call.agent.systemPrompt, brand);
  const agentLanguage = call.agent.language || "english";
  const languageLabel = agentLanguage.charAt(0).toUpperCase() + agentLanguage.slice(1);
  const campaign = call.campaign ? {
    id: call.campaign.id,
    name: brandText(call.campaign.name, brand),
    goal: brandText(call.campaign.goal, brand),
    informationTemplate: brandText(call.campaign.informationTemplate, brand),
  } : null;
  const openaiRequestStartedAt = Date.now();
  console.log("[OPENAI_VOICE_SEND]", JSON.stringify({
    callId,
    at: new Date(openaiRequestStartedAt).toISOString(),
    transcript,
  }));
  const response = await getClient().responses.create({
    model: MODEL,
    input: [
      {
        role: "system",
        content: [
          agentPrompt,
          "",
          "Live call speaking rules:",
          "- CRITICAL: The opening greeting and introduction have ALREADY been played to the customer before this turn. NEVER repeat the opening greeting, do NOT introduce yourself again, and do NOT ask 'is this a good time to speak' again.",
          "- If the customer agrees to talk, immediately ask what they need or how you can help.",
          "- Always return a short speakable phone reply. Do not return tool calls only.",
          "- Keep replies to one short sentence when possible; use two only when needed.",
          `- The active store name is ${brand}. Use this store name only; do not say Best Vet Care unless that is the active store name.`,
          "- Answer the customer's latest question first. Do not ignore it to repeat the campaign script.",
          "- Do not repeat the generic store introduction after the first greeting. If the customer asks a product question, answer that product question directly.",
          "- After answering, ask only one natural follow-up question if needed.",
          `- Speak primarily in ${languageLabel} for this store unless the customer clearly uses a different language. If the customer switches to another language, follow their lead.`,
          "- If the customer asks about price, availability, stock, prescription requirement, product type, or delivery, answer from Real catalog matches and campaign/store context only.",
          "- If a matching product is available, mention at most 1 or 2 product names plus useful known details such as price or stock.",
          "- If the customer asks a follow-up like 'price?', 'available?', or 'which one?', use the recent conversation to understand which product they mean.",
          "- If there is no exact catalog match, say you do not have an exact live match and offer to share related available product details.",
          "- If the customer is busy, asks for a later call, says not interested, or says do not call, acknowledge that request instead of continuing the sales pitch.",
          "- Do not end the call for short acknowledgements such as 'hmm', 'ok', 'yes', 'sure', 'thanks', or 'thank you'. Ask one brief follow-up question and wait.",
          "- Only end the call when the customer clearly says goodbye, asks to hang up, says they are not interested, asks not to be called, or has been silent until the configured timeout.",
          "- For medical/veterinary questions, give safe general guidance only and recommend a veterinarian for diagnosis, dosage, prescription, or urgent symptoms.",
          "- Do not claim the message has already been sent unless a backend send action succeeds.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `Active customer: ${JSON.stringify({
            id: call.customer.id,
            name: call.customer.name,
            email: call.customer.email,
            phone: call.customer.phone,
            whatsappNumber: call.customer.whatsappNumber,
            leadStatus: call.customer.leadStatus,
          })}`,
          `Active store: ${brand}`,
          `Campaign: ${JSON.stringify(campaign)}`,
          `Recent conversation: ${JSON.stringify(conversation)}`,
          `Real catalog matches: ${JSON.stringify(products)}`,
          `Latest customer speech: ${transcript}`,
          "Reply now with exactly what the phone agent should say next.",
        ].join("\n"),
      },
    ],
    max_output_tokens: 80,
  });
  let message = brandText(outputText(response), brand);
  console.log("[OPENAI_VOICE_ANSWER]", JSON.stringify({
    callId,
    at: new Date().toISOString(),
    elapsedMs: Date.now() - openaiRequestStartedAt,
    responseId: response.id || null,
    message,
  }));
  if (!message) {
    message = products.length
      ? `Yes, ${products[0].name} is available in our catalog. Should I share the details on WhatsApp or email?`
      : "I can help with pet medicines and pet-care products. Which product or pet issue are you asking about?";
  }
  if (message) {
    const voiceState = voiceStateForAgentReply(message, products, previousState);
    logStateTransition(callId, previousState?.conversationStage, voiceState.conversationStage, voiceState.pendingAction);
    await aiCallingService.recordMessage(callId, {
      role: "agent",
      content: message,
      metadata: { catalogMatches: products, voiceState },
    }, db);
  }
  return { message, rawResponseId: response.id };
}

module.exports = {
  _test: {
    acknowledgementReply,
    confirmsEmailInformation,
    confirmsWhatsappInformation,
    contextualAcknowledgementReply,
    customerEndIntent,
    asksForAnotherProduct,
    deliveryChannelsForTurn,
    declinesAnotherProduct,
    declinesDeliveryInformation,
    pendingActionFromConversation,
    preferRequestedProductType,
    voiceStateForAgentReply,
    wantsBothInformation,
    wantsEmailInformation,
    wantsWhatsappInformation,
  },
  respondToTurn,
  tools,
};
