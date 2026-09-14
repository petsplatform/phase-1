import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bot, Headphones, HeartPulse, Loader2, MessageCircle, RotateCcw, Send, ShoppingCart, Sparkles, Stethoscope, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { petgptApi } from "../../api/petgptApi";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

const SESSION_KEY = "petgpt_session_id";
const HISTORY_KEY = "petgpt_messages";

const starterMessages = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hi, I'm your Pet Health & Shopping Assistant. Tell me what's happening with your pet, or tell me what you're looking for.",
    createdAt: new Date().toISOString(),
  },
];

const formatTime = (value) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));

const emergencyPattern = /\b(chok|can't breathe|cant breathe|difficulty breathing|collapse|collapsed|unresponsive|seizure|poison|toxic|vomiting blood|blood in vomit|blood in stool|bloody stool|swallowed something)\b/i;
const symptomPattern = /\b(vomit|vomiting|diarrhea|diarrhoea|loose motion|loose motions|stool|poop|blood|not eating|weak|letharg|pain|scratch|itch|rash|skin)\b/i;
const medicationPattern = /\b(medicine|medication|tablet|dose|dosage|antibiotic|painkiller|what should i give)\b/i;
const orderPattern = /\b(order|orders|tracking|track|shipment|delivery status)\b/i;

function buildOfflinePetGPTResponse(text) {
  if (emergencyPattern.test(text)) {
    return {
      message: "This can be serious and should not be managed only through an online chatbot. Please contact a veterinarian or emergency veterinary service as soon as possible.",
      intent: "EMERGENCY_HEALTH",
      riskLevel: "EMERGENCY",
      shouldRecommendVet: true,
      vetUrgency: "EMERGENCY",
      vetEscalationReason: "Emergency warning sign reported",
    };
  }

  if (symptomPattern.test(text) || medicationPattern.test(text)) {
    const mentionsDog = /\b(dog|puppy)\b/i.test(text);
    const mentionsCat = /\b(cat|kitten)\b/i.test(text);
    const species = mentionsDog ? "dog" : mentionsCat ? "cat" : "pet";
    return {
      message: medicationPattern.test(text)
        ? `I would not recommend giving medicine without knowing the cause and your ${species}'s health context. How old is your ${species}, approximately how much does your ${species} weigh, and how long has this been happening?`
        : `I'm sorry your ${species} is not feeling well. How old is your ${species}, and approximately how much does your ${species} weigh?`,
      intent: medicationPattern.test(text) ? "MEDICATION_QUESTION" : "SYMPTOM_HEALTH",
      riskLevel: "MEDIUM",
      shouldRecommendVet: false,
    };
  }

  if (orderPattern.test(text)) {
    return {
      message: "I could not reach the order service from this browser session. Please refresh and try again, or use the Track Order page.",
      intent: "ORDER_QUESTION",
      riskLevel: "LOW",
    };
  }

  return {
    message: "I could not reach PetGPT from this browser session. Please check that the backend is running on port 5000 and try again.",
    intent: "UNKNOWN",
    riskLevel: "LOW",
  };
}

function getSessionId() {
  const stored = window.localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const next = `web_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(SESSION_KEY, next);
  return next;
}

function readMessages() {
  try {
    const stored = window.localStorage.getItem(HISTORY_KEY);
    const parsed = stored ? JSON.parse(stored) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : starterMessages;
  } catch {
    return starterMessages;
  }
}

const ProductCard = ({ product, onAdd, onView }) => {
  const selectedVariant = product.selectedSize || product.variant || null;
  const canAdd = product.inventory?.isInStock && (!product.hasVariants || Boolean(product.variantId || selectedVariant?.id));

  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-[#ead9b7] bg-white p-3">
      <button type="button" onClick={() => onView(product)} className="overflow-hidden rounded-md border border-[#f0e2c7] bg-[#fff8eb]">
        <img
          src={product.image || "/images/img_product_item_image.png"}
          alt={product.name}
          className="h-[72px] w-[72px] object-cover"
        />
      </button>
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onView(product)}
          className="line-clamp-2 text-left text-sm font-bold text-[#06285c] hover:text-[#d9a522]"
        >
          {product.name}
        </button>
        <div className="mt-1 flex items-center gap-2 text-sm">
          <span className="font-bold text-[#06285c]">${Number(product.price || 0).toFixed(2)}</span>
          {product.oldPrice > 0 ? <span className="text-xs text-slate-400 line-through">${Number(product.oldPrice).toFixed(2)}</span> : null}
        </div>
        {selectedVariant ? (
          <div className="mt-1 space-y-0.5 text-xs font-semibold text-slate-500">
            <p>{selectedVariant.label || selectedVariant.weightRange || selectedVariant.size}</p>
            {selectedVariant.dose || selectedVariant.packSize ? (
              <p>{[selectedVariant.dose, selectedVariant.packSize ? `${selectedVariant.packSize} pack` : null].filter(Boolean).join(" · ")}</p>
            ) : null}
            {selectedVariant.sku ? <p>SKU: {selectedVariant.sku}</p> : null}
          </div>
        ) : null}
        {product.reason ? (
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">{product.reason}</p>
        ) : null}
        {product.prescriptionRequired ? (
          <p className="mt-1 rounded-md bg-[#fff4dc] px-2 py-1 text-xs font-bold text-[#8a6418]">
            Prescription required at checkout
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onView(product)}
            className="rounded-md border border-[#17345f] px-3 py-1.5 text-xs font-semibold text-[#17345f] hover:bg-[#f7eed9]"
          >
            View Product
          </button>
          {canAdd ? (
            <button
              type="button"
              onClick={() => onAdd(product)}
              className="inline-flex items-center gap-1 rounded-md bg-[#17345f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f2749]"
            >
              <ShoppingCart size={13} />
              Add
            </button>
          ) : (
            <span className="rounded-md bg-[#fff4dc] px-3 py-1.5 text-xs font-semibold text-[#8a6418]">
              {product.hasVariants && !selectedVariant ? "Choose options" : "Unavailable"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const riskStyles = {
  EMERGENCY: "border-red-200 bg-red-50 text-red-800",
  HIGH: "border-orange-200 bg-orange-50 text-orange-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const RiskBanner = ({ riskLevel, shouldRecommendVet, reason }) => {
  if (!shouldRecommendVet || !riskLevel || riskLevel === "LOW") return null;
  return (
    <div className={`mt-3 flex gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${riskStyles[riskLevel] || riskStyles.MEDIUM}`}>
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <span>{shouldRecommendVet ? reason || "Veterinary attention may be needed." : "PetGPT is asking a few safety questions first."}</span>
    </div>
  );
};

const PetContext = ({ pet, health }) => {
  const details = [
    pet?.name,
    pet?.species,
    pet?.breed,
    pet?.age,
    pet?.weight,
    health?.energyLevel === true ? "energy: normal" : health?.energyLevel === false ? "energy: low" : null,
    health?.appetite === true ? "eating normally" : health?.appetite === false ? "not eating" : null,
    health?.waterIntake === true ? "drinking normally" : health?.waterIntake === false ? "not drinking" : null,
  ].filter(Boolean);
  const uniqueDetails = [...new Set(details)];
  if (!uniqueDetails.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#d9dee8] bg-[#f8f9fb] px-3 py-2 text-xs font-semibold text-[#17345f]">
      <HeartPulse size={14} />
      {uniqueDetails.map((detail) => (
        <span key={detail} className="rounded-md bg-white px-2 py-1 shadow-sm">{detail}</span>
      ))}
    </div>
  );
};

const ConsultantCard = ({ message, loading, error, onContact }) => (
  <div className="mt-3 rounded-lg border border-[#17233c] bg-white p-4 text-[#06285c] shadow-sm">
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8f9fb] text-[#17345f] ring-1 ring-[#d9dee8]">
        <Headphones size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold">Need more help?</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          We couldn't find a suitable product in our store for your pet's current needs.
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
          Our pet care team can help.
        </p>
        {message.consultantSummary ? (
          <div className="mt-3 whitespace-pre-line rounded-md border border-[#e6ebf2] bg-[#f8f9fb] px-3 py-2 text-xs font-medium leading-5 text-slate-600">
            Here's a quick summary you can share with our consultant:
            {"\n"}
            {message.consultantSummary}
          </div>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
            Sorry, I couldn't open the consultant contact option. Please use our regular Contact page.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onContact(message)}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#0b1324] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#17345f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Headphones size={15} />}
          Contact Our Consultant
        </button>
      </div>
    </div>
  </div>
);

const PetGPTWidget = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState(readMessages);
  const [loading, setLoading] = useState(false);
  const [consultantOpening, setConsultantOpening] = useState({});
  const [consultantErrors, setConsultantErrors] = useState({});
  const listRef = useRef(null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    if (open) {
      window.setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  }, [messages, open]);

  const clearConversation = () => {
    const nextSession = `web_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, nextSession);
    window.localStorage.removeItem(HISTORY_KEY);
    setSessionId(nextSession);
    setMessages(starterMessages);
    setInput("");
  };

  const sendMessage = async (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((items) => [...items, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const clientMessageId =
        window.crypto?.randomUUID?.() || `client_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const response = await petgptApi.chat({
        message: trimmed,
        conversationId: sessionId,
        sessionId,
        clientMessageId,
      });
      if (response?.conversationId && response.conversationId !== sessionId) {
        window.localStorage.setItem(SESSION_KEY, response.conversationId);
        setSessionId(response.conversationId);
      }
      const assistantMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          text: response.message,
          type: response.type || "message",
          mode: response.mode,
          assessmentComplete: Boolean(response.assessmentComplete),
          readyForProductSearch: Boolean(response.readyForProductSearch),
          products: response.type === "product_recommendation" && response.recommendationReady ? response.products || [] : [],
          pet: response.pet || response.conversationState?.pet,
          health: response.conversationState?.health,
          intent: response.intent,
          riskLevel: response.riskLevel,
          shouldRecommendVet: Boolean(response.shouldRecommendVet),
          vetUrgency: response.vetUrgency,
          vetEscalationReason: response.vetEscalationReason,
          actions: response.actions || [],
          showConsultantCTA: Boolean(response.showConsultantCTA),
          consultantContactRoute: response.consultantContactRoute || "/contact",
          consultantSummary: response.consultantSummary || "",
          assessmentStatus: response.assessmentStatus || null,
          productSearchCompleted: Boolean(response.productSearchCompleted),
          recommendationReady: response.type === "product_recommendation" && Boolean(response.recommendationReady),
          conversationStage: response.conversationStage,
          missingFields: response.missingFields || response.missingInformation || [],
          createdAt: new Date().toISOString(),
          error: response.type === "error",
        };
      setMessages((items) => {
        const clearedItems = response.type === "product_recommendation"
          ? items
          : items.map((item) => item.role === "assistant" ? { ...item, products: [], recommendationReady: false } : item);
        return [...clearedItems, assistantMessage];
      });
    } catch (error) {
      const fallback = buildOfflinePetGPTResponse(trimmed);
      setMessages((items) => [
        ...items,
        {
          id: `assistant_error_${Date.now()}`,
          role: "assistant",
          text: error.response?.data?.message || fallback.message,
          pet: fallback.pet,
          intent: fallback.intent,
          riskLevel: fallback.riskLevel,
          shouldRecommendVet: Boolean(fallback.shouldRecommendVet),
          vetUrgency: fallback.vetUrgency,
          vetEscalationReason: fallback.vetEscalationReason,
          createdAt: new Date().toISOString(),
          error: !fallback.intent || fallback.intent === "UNKNOWN",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    const result = addToCart({ ...product, quantity: 1 });
    if (result.outOfStock) {
      showToast("This product is out of stock", "warning");
      return;
    }
    showToast("Added to cart");
  };

  const handleViewProduct = (product) => {
    setOpen(false);
    navigate(`/product/${product.slug || product.id}`);
  };

  const openVetEscalation = (message) => {
    window.dispatchEvent(new CustomEvent("petcare-open-support", {
      detail: {
        source: "PETGPT",
        subject: message?.riskLevel === "EMERGENCY" ? "Emergency Pet Health" : "Consult a Vet",
        priority: message?.riskLevel === "EMERGENCY" ? "URGENT" : "HIGH",
        metadata: {
          petgptSessionId: sessionId,
          riskLevel: message?.riskLevel,
          vetUrgency: message?.vetUrgency,
          reason: message?.vetEscalationReason,
          issueSummary: messages.slice(-6).map((item) => `${item.role}: ${item.text}`).join("\n"),
        },
      },
    }));
    showToast(message?.riskLevel === "EMERGENCY" ? "Opening urgent support handoff" : "Opening vet consultation handoff");
  };

  const openConsultantReferral = (message) => {
    setConsultantOpening((items) => ({ ...items, [message.id]: true }));
    setConsultantErrors((items) => ({ ...items, [message.id]: false }));
    try {
      window.dispatchEvent(new CustomEvent("petcare-open-support", {
        detail: {
          autoCreate: true,
          source: "PETGPT",
          subject: "Pet Care Consultant",
          priority: "NORMAL",
          initialMessage: [
            "PetGPT consultant handoff",
            "",
            message.consultantSummary || messages.slice(-6).map((item) => `${item.role}: ${item.text}`).join("\n"),
          ].join("\n"),
          metadata: {
            petgptSessionId: sessionId,
            assessmentStatus: "referred_to_consultant",
            riskLevel: message?.riskLevel,
            issueSummary: message.consultantSummary || messages.slice(-6).map((item) => `${item.role}: ${item.text}`).join("\n"),
          },
        },
      }));
      showToast("Opening pet care consultant handoff");
    } catch {
      setConsultantErrors((items) => ({ ...items, [message.id]: true }));
      navigate(message.consultantContactRoute || "/contact");
    } finally {
      window.setTimeout(() => {
        setConsultantOpening((items) => ({ ...items, [message.id]: false }));
      }, 700);
    }
  };

  return (
    <div className="fixed bottom-[88px] right-3 z-[9998] font-sans md:bottom-5 md:right-5">
      {open ? (
        <section className="flex h-[calc(100vh-112px)] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-[#d9dee8] bg-[#f5f6f8] shadow-[0_24px_70px_rgba(6,20,44,0.32)] md:h-[min(560px,calc(100vh-40px))] md:w-[min(800px,calc(100vw-48px))]">
          <header className="flex items-center justify-between border-b border-[#d9dee8] bg-[#f8f9fb] px-7 py-5 max-sm:px-4 max-sm:py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#17345f] shadow-sm ring-1 ring-[#d9dee8]">
                <Bot size={21} />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-[#06285c]">Pet Assistant</h2>
                <p className="text-xs font-medium text-slate-500">Health and shopping help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearConversation}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-[#17345f]"
                aria-label="Clear pet assistant conversation"
                title="Clear conversation"
              >
                <RotateCcw size={17} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-[#17345f]"
                aria-label="Close pet assistant"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-5 overflow-y-auto px-7 py-7 max-sm:px-4 max-sm:py-4">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "ml-auto max-w-[58%] max-sm:max-w-[86%]" : "mr-auto max-w-[78%] max-sm:max-w-[92%]"}>
                <div
                  className={`rounded-2xl px-5 py-4 text-[15px] leading-6 shadow-sm max-sm:px-4 max-sm:py-3 max-sm:text-sm ${
                    message.role === "user"
                      ? "rounded-br-md bg-[#0b1324] text-white"
                      : message.error
                        ? "rounded-bl-sm bg-red-50 text-red-700"
                        : "rounded-bl-md bg-white text-[#06285c]"
                  }`}
                >
                  {message.text}
                </div>
                <div className={`mt-1 text-[11px] text-slate-400 ${message.role === "user" ? "text-right" : "text-left"}`}>
                  {formatTime(message.createdAt)}
                </div>
                {message.role === "assistant" ? (
                  <>
                    <RiskBanner
                      riskLevel={message.riskLevel}
                      shouldRecommendVet={message.shouldRecommendVet}
                      reason={message.vetEscalationReason}
                    />
                    <PetContext pet={message.pet} health={message.health} />
                    {message.shouldRecommendVet ? (
                      <button
                        type="button"
                        onClick={() => openVetEscalation(message)}
                        className={`mt-3 inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold text-white ${
                          message.riskLevel === "EMERGENCY" ? "bg-red-700 hover:bg-red-800" : "bg-[#17345f] hover:bg-[#0f2749]"
                        }`}
                      >
                        <Stethoscope size={15} />
                        {message.riskLevel === "EMERGENCY" ? "Emergency Veterinary Care" : "Consult a Vet"}
                      </button>
                    ) : null}
                    {message.type === "consultant_referral" && message.showConsultantCTA ? (
                      <ConsultantCard
                        message={message}
                        loading={Boolean(consultantOpening[message.id])}
                        error={Boolean(consultantErrors[message.id])}
                        onContact={openConsultantReferral}
                      />
                    ) : null}
                  </>
                ) : null}
                {message.type === "product_recommendation" && message.recommendationReady && message.products?.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 max-md:grid-cols-1">
                    {message.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={handleAddToCart}
                        onView={handleViewProduct}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading ? (
              <div className="mr-auto flex max-w-[78%] items-center gap-2 rounded-2xl rounded-bl-md bg-white px-5 py-4 text-sm font-semibold text-[#06285c] shadow-sm max-sm:max-w-[92%]">
                <Loader2 size={16} className="animate-spin" />
                Pet Assistant is typing
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#d9dee8] bg-[#f5f6f8] px-5 py-5 max-sm:px-3 max-sm:py-3">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-3 rounded-full border border-[#17233c] bg-white px-4 py-2 shadow-sm"
            >
              <Sparkles size={19} className="shrink-0 text-[#656bff]" />
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask about symptoms, food, products, or orders"
                className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm text-[#06285c] outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8b335] text-[#06285c] transition hover:bg-[#f0c24a] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex h-12 items-center gap-2 rounded-full bg-[#17345f] px-4 text-sm font-bold text-white shadow-[0_12px_30px_rgba(6,40,92,0.28)] hover:bg-[#0f2749] sm:px-5"
          aria-label="Open pet assistant"
        >
          <MessageCircle size={20} />
          <span>Pet Assistant</span>
          <Sparkles size={16} className="text-[#e8b335]" />
        </button>
      )}
    </div>
  );
};

export default PetGPTWidget;
