/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import { Headphones, Loader2, MessageCircle, Send, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supportApi } from "../../api/supportApi";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const topics = ["Order Issue", "Payment Issue", "Delivery Issue", "Return/Refund", "Product Question", "Account Issue", "Other"];

const formatTime = (value) => {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
};

const buildClientId = () => window.crypto?.randomUUID?.() || `support_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function mergeMessage(items, message) {
  const existingIndex = items.findIndex(
    (item) =>
      item.id === message.id ||
      (message.clientMessageId && item.clientMessageId === message.clientMessageId),
  );
  if (existingIndex === -1) return [...items, message];
  return items.map((item, index) => (index === existingIndex ? { ...item, ...message, pending: false } : item));
}

function messageTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function normalizeMessages(items) {
  return [...items]
    .sort((a, b) => messageTime(a.createdAt) - messageTime(b.createdAt))
    .filter((message, index, sorted) => {
      const previous = sorted[index - 1];
      if (!previous) return true;
      const sameAccidentalEcho =
        previous.senderType === message.senderType &&
        previous.messageType === message.messageType &&
        previous.message === message.message &&
        Math.abs(messageTime(message.createdAt) - messageTime(previous.createdAt)) < 2500;
      return !sameAccidentalEcho;
    });
}

export default function SupportChatWidget() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("Order Issue");
  const [streamState, setStreamState] = useState("idle");
  const [rating, setRating] = useState(0);
  const listRef = useRef(null);
  const streamRef = useRef(null);
  const sendingRef = useRef(false);
  const pendingContextRef = useRef({});

  const unreadCount = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.customerUnread || 0), 0),
    [conversations],
  );

  async function loadConversations() {
    if (!isLoggedIn) return;
    try {
      const data = await supportApi.listConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      setConversations([]);
    }
  }

  async function ensureConversation(context = {}, options = {}) {
    if (!isLoggedIn) {
      showToast("Please login to chat with customer support", "warning");
      navigate("/login");
      return null;
    }
    const { createIfMissing = true, initialMessage = null } = options;
    if (createIfMissing) setLoading(true);
    try {
      const existing = conversations.find((item) => !["RESOLVED", "CLOSED"].includes(item.status));
      const data = existing && !context.forceNew
        ? await supportApi.getConversation(existing.id)
        : !createIfMissing
          ? null
        : await supportApi.createConversation({
            subject: context.subject || subject,
            source: context.source || "WEBSITE",
            orderId: context.orderId || null,
            productId: context.productId || null,
            metadata: context.metadata || null,
            initialMessage,
          });
      if (!data) return null;
      setConversation(data);
      setMessages(normalizeMessages(data.messages || []));
      supportApi.markRead(data.id).catch(() => {});
      loadConversations();
      return data;
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to open support chat", "error");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();
  }, [isLoggedIn]);

  useEffect(() => {
    const openHandler = (event) => {
      setOpen(true);
      const detail = event.detail || {};
      pendingContextRef.current = detail;
      if (detail.subject) setSubject(detail.subject);
      window.setTimeout(() => ensureConversation(detail, {
        createIfMissing: Boolean(detail.autoCreate),
        initialMessage: detail.initialMessage || null,
      }), 0);
    };
    window.addEventListener("petcare-open-support", openHandler);
    return () => window.removeEventListener("petcare-open-support", openHandler);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    window.setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  }, [messages, open]);

  useEffect(() => {
    streamRef.current?.close?.();
    setStreamState("idle");
    if (!conversation?.id || !open) return;

    const stream = new EventSource(supportApi.streamUrl(conversation.id));
    streamRef.current = stream;
    stream.onopen = () => setStreamState("connected");
    stream.onerror = () => setStreamState("reconnecting");
    stream.addEventListener("support:message_new", (event) => {
      const payload = JSON.parse(event.data || "{}");
      if (payload.conversationId !== conversation.id || !payload.message) return;
      if (payload.message.messageType === "INTERNAL_NOTE") return;
      setMessages((items) => normalizeMessages(mergeMessage(items, payload.message)));
      supportApi.markRead(conversation.id).catch(() => {});
      loadConversations();
    });
    stream.addEventListener("support:conversation_status", (event) => {
      const payload = JSON.parse(event.data || "{}");
      if (payload.conversation?.id === conversation.id) setConversation(payload.conversation);
    });
    return () => stream.close();
  }, [conversation?.id, open]);

  const handleOpen = () => {
    setOpen(true);
    pendingContextRef.current = {};
    ensureConversation({}, { createIfMissing: false });
  };

  const sendMessage = async (text = input, context = {}) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;
    sendingRef.current = true;
    const createContext = { ...pendingContextRef.current, ...context };
    const existingSummary = conversations.find((item) => !["RESOLVED", "CLOSED"].includes(item.status));
    const active = conversation || (await ensureConversation(createContext, {
      createIfMissing: !existingSummary,
      initialMessage: existingSummary ? null : trimmed,
    }));
    if (!active) {
      sendingRef.current = false;
      return;
    }
    if (!conversation && !existingSummary) {
      pendingContextRef.current = {};
      setInput("");
      setSending(false);
      sendingRef.current = false;
      return;
    }

    const clientMessageId = buildClientId();
    const optimistic = {
      id: `local_${Date.now()}`,
      conversationId: active.id,
      senderType: "CUSTOMER",
      messageType: "TEXT",
      message: trimmed,
      clientMessageId,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((items) => normalizeMessages(mergeMessage(items, optimistic)));
    setInput("");
    setSending(true);
    try {
      const saved = await supportApi.sendMessage(active.id, {
        message: trimmed,
        clientMessageId,
      });
      setMessages((items) => normalizeMessages(mergeMessage(items, saved)));
      loadConversations();
    } catch (error) {
      setMessages((items) => items.filter((item) => item.id !== optimistic.id));
      showToast(error.response?.data?.message || "Message could not be sent", "error");
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  };

  const submitRating = async (value) => {
    if (!conversation?.id) return;
    setRating(value);
    try {
      await supportApi.rate(conversation.id, { rating: value });
      showToast("Thanks for rating your support experience");
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to save rating", "error");
    }
  };

  return (
    <div className="fixed bottom-[88px] left-3 z-[9997] font-sans md:bottom-5 md:left-5">
      {open ? (
        <section className="flex h-[calc(100vh-112px)] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-[#d9dee8] bg-[#f8fafc] shadow-[0_24px_70px_rgba(6,20,44,0.26)] md:h-[min(610px,calc(100vh-40px))]">
          <header className="flex items-center justify-between border-b border-[#d9dee8] bg-white px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17345f] text-white">
                <Headphones size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-extrabold text-[#06285c]">24/7 Customer Support</h2>
                <p className="text-xs font-semibold text-emerald-600">
                  {streamState === "reconnecting" ? "Reconnecting..." : "Support available"}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Close support chat">
              <X size={18} />
            </button>
          </header>

          <div className="border-b border-[#e6ebf2] bg-white px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {topics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setSubject(topic);
                    sendMessage(
                      topic === "Order Issue" ? "I need help with my order." : `I need help with ${topic.toLowerCase()}.`,
                      { subject: topic },
                    );
                  }}
                  className="shrink-0 rounded-full border border-[#d9dee8] px-3 py-1.5 text-xs font-bold text-[#17345f] hover:border-[#17345f]"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm font-semibold text-slate-500">
                <Loader2 size={16} className="animate-spin" /> Opening support
              </div>
            ) : messages.length ? (
              messages.map((message) => {
                const fromCustomer = message.senderType === "CUSTOMER";
                const system = message.senderType === "SYSTEM";
                return (
                  <div key={message.id} className={system ? "mx-auto max-w-[90%] text-center" : fromCustomer ? "ml-auto max-w-[82%]" : "mr-auto max-w-[82%]"}>
                    <div className={system ? "rounded-full bg-[#edf2f7] px-3 py-2 text-xs font-semibold text-slate-500" : `rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${fromCustomer ? "rounded-br-md bg-[#17345f] text-white" : "rounded-bl-md bg-white text-[#06285c]"}`}>
                      {message.message}
                    </div>
                    {!system ? (
                      <div className={`mt-1 text-[11px] text-slate-400 ${fromCustomer ? "text-right" : "text-left"}`}>
                        {formatTime(message.createdAt)} {message.pending ? "Sending" : ""}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg bg-white p-4 text-sm font-semibold text-[#06285c] shadow-sm">
                Hi! How can we help you today?
              </div>
            )}
          </div>

          {conversation && ["RESOLVED", "CLOSED"].includes(conversation.status) ? (
            <div className="border-t border-[#d9dee8] bg-white px-4 py-3">
              <p className="mb-2 text-sm font-bold text-[#06285c]">How was your support experience?</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button key={value} type="button" onClick={() => submitRating(value)} className={value <= rating ? "text-[#e8b335]" : "text-slate-300"} aria-label={`Rate ${value} stars`}>
                    <Star size={22} fill="currentColor" />
                  </button>
                ))}
                <button type="button" onClick={() => supportApi.reopen(conversation.id).then(setConversation)} className="ml-auto rounded-md border border-[#17345f] px-3 py-1.5 text-xs font-bold text-[#17345f]">
                  Reopen
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="border-t border-[#d9dee8] bg-white p-3"
            >
              <div className="flex items-end gap-2 rounded-lg border border-[#d9dee8] bg-white px-3 py-2 focus-within:border-[#17345f]">
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
                  placeholder="Type your message..."
                  className="max-h-24 min-h-10 flex-1 resize-none border-0 bg-transparent py-2 text-sm text-[#06285c] outline-none placeholder:text-slate-400"
                />
                <button type="submit" disabled={sending || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8b335] text-[#06285c] disabled:opacity-50" aria-label="Send support message">
                  {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="group relative flex h-12 items-center gap-2 rounded-full bg-[#e8b335] px-4 text-sm font-bold text-[#06285c] shadow-[0_12px_30px_rgba(6,40,92,0.18)] hover:bg-[#f0c24a] sm:px-5"
          aria-label="Open customer support"
        >
          <MessageCircle size={20} />
          <span>Need Help?</span>
          {unreadCount ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white">
              {unreadCount}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
