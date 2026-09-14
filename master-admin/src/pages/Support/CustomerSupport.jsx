/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Headphones,
  Loader2,
  MessageSquare,
  NotebookPen,
  RefreshCw,
  Send,
  UserCheck,
} from "lucide-react";
import {
  adminApi,
  getAdminStoreKey,
  getAdminToken,
  getAdminUser,
} from "../../lib/api";
import { showToast } from "../../lib/toast";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const statuses = [
  "OPEN",
  "WAITING_FOR_AGENT",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];
const priorities = ["LOW", "NORMAL", "HIGH", "URGENT"];
const SUPPORT_STATS_EVENT = "admin-support-stats-change";

const formatTime = (value) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const clientId = () =>
  window.crypto?.randomUUID?.() ||
  `admin_support_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function streamUrl() {
  const params = new URLSearchParams({ token: getAdminToken() || "" });
  const storeKey = getAdminStoreKey();
  if (storeKey) params.set("storeKey", storeKey);
  return `${API_BASE_URL}/admin/support/stream?${params.toString()}`;
}

function mergeMessage(items, message) {
  const existingIndex = items.findIndex(
    (item) =>
      item.id === message.id ||
      (message.clientMessageId &&
        item.clientMessageId === message.clientMessageId),
  );
  if (existingIndex === -1) return [...items, message];
  return items.map((item, index) =>
    index === existingIndex ? { ...item, ...message } : item,
  );
}

export default function CustomerSupport() {
  const admin = getAdminUser();
  const [filters, setFilters] = useState({ status: "", priority: "", q: "" });
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [activeId, setActiveId] = useState("");
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const listRef = useRef(null);
  const activeIdRef = useRef("");

  const activeMessages = active?.messages || [];
  const activePreview = useMemo(
    () => active || items.find((item) => item.id === activeId),
    [active, activeId, items],
  );

  const loadInbox = async (nextFilters = filters) => {
    setLoading(true);
    try {
      const data = await adminApi.supportConversations(nextFilters);
      setItems(data.items || []);
      setStats(data.stats || {});
      window.dispatchEvent(
        new CustomEvent(SUPPORT_STATS_EVENT, { detail: data.stats || {} }),
      );
      if (!activeId && data.items?.[0]) setActiveId(data.items[0].id);
    } catch (error) {
      showToast({
        type: "error",
        title: "Support",
        message: error.message || "Unable to load support inbox",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id) => {
    if (!id) return;
    try {
      const data = await adminApi.supportConversation(id);
      setActive(data);
      adminApi.markSupportRead(id).catch(() => {});
    } catch (error) {
      showToast({
        type: "error",
        title: "Support",
        message: error.message || "Unable to load conversation",
      });
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    loadConversation(activeId);
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (!listRef.current) return;
    window.setTimeout(
      () =>
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        }),
      50,
    );
  }, [activeMessages.length]);

  useEffect(() => {
    const stream = new EventSource(streamUrl());
    stream.addEventListener("support:message_new", (event) => {
      const payload = JSON.parse(event.data || "{}");
      loadInbox(filters);
      if (payload.conversationId === activeIdRef.current && payload.message) {
        setActive((current) =>
          current
            ? {
                ...current,
                messages: mergeMessage(current.messages || [], payload.message),
              }
            : current,
        );
        adminApi.markSupportRead(payload.conversationId).catch(() => {});
      }
    });
    stream.addEventListener("support:conversation_created", () => loadInbox());
    stream.addEventListener("support:conversation_status", () => loadInbox());
    stream.addEventListener("support:conversation_assigned", () => loadInbox());
    stream.addEventListener("support:internal_note", (event) => {
      const payload = JSON.parse(event.data || "{}");
      if (payload.conversationId === activeIdRef.current && payload.message) {
        setActive((current) =>
          current
            ? {
                ...current,
                messages: mergeMessage(current.messages || [], payload.message),
              }
            : current,
        );
      }
    });
    return () => stream.close();
  }, [activeId]);

  const applyFilters = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    loadInbox(next);
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !activeId) return;
    setSaving(true);
    try {
      const message = await adminApi.sendSupportMessage(activeId, {
        message: text,
        clientMessageId: clientId(),
      });
      setActive((current) =>
        current
          ? {
              ...current,
              messages: mergeMessage(current.messages || [], message),
            }
          : current,
      );
      setReply("");
      loadInbox();
    } catch (error) {
      showToast({
        type: "error",
        title: "Support",
        message: error.message || "Unable to send reply",
      });
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    const text = note.trim();
    if (!text || !activeId) return;
    setSaving(true);
    try {
      const message = await adminApi.addSupportInternalNote(activeId, text);
      setActive((current) =>
        current
          ? {
              ...current,
              messages: mergeMessage(current.messages || [], message),
            }
          : current,
      );
      setNote("");
    } catch (error) {
      showToast({
        type: "error",
        title: "Support",
        message: error.message || "Unable to add note",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (body) => {
    if (!activeId) return;
    try {
      const data = await adminApi.updateSupportStatus(activeId, body);
      setActive((current) => ({ ...(current || {}), ...data }));
      loadInbox();
    } catch (error) {
      showToast({
        type: "error",
        title: "Support",
        message: error.message || "Unable to update conversation",
      });
    }
  };

  const assignToMe = async () => {
    if (!activeId) return;
    try {
      const data = await adminApi.assignSupportConversation(
        activeId,
        admin?.id || admin?.userId,
      );
      setActive((current) => ({ ...(current || {}), ...data }));
      loadInbox();
    } catch (error) {
      showToast({
        type: "error",
        title: "Support",
        message: error.message || "Unable to assign conversation",
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-3 overflow-visible xl:h-[calc(100vh-9rem)] xl:min-h-[620px] xl:gap-4 xl:overflow-hidden">
      <div className="shrink-0 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-display font-bold text-[var(--text-primary)] sm:text-2xl">
            Customer Support
          </h1>
          <p className="text-xs text-[var(--text-muted)] sm:text-sm">
            Live customer conversations, assignment, notes, and resolution
            tracking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadInbox()}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-4 text-sm font-bold text-[var(--primary)]"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="shrink-0 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6 xl:gap-3">
        {[
          ["Open", stats.open || 0],
          ["Waiting", stats.waiting || 0],
          ["Assigned", stats.assigned || 0],
          ["Urgent", stats.urgent || 0],
          ["Resolved", stats.resolved || 0],
          ["Online Agents", stats.onlineAgents || 0],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-[var(--border-color)] bg-white p-3 shadow-sm sm:p-4"
          >
            <p className="text-xs font-bold uppercase text-[var(--text-soft)]">
              {label}
            </p>
            <p className="mt-1 text-xl font-display font-bold text-[var(--text-primary)] sm:text-2xl">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 overflow-visible xl:grid-cols-[380px_minmax(0,1fr)] xl:gap-4 xl:overflow-hidden">
        <aside className="flex h-[360px] min-h-0 flex-col overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm sm:h-[420px] xl:h-auto">
          <div className="shrink-0 grid gap-2 border-b border-[var(--border-color)] p-3">
            <input
              value={filters.q}
              onChange={(event) =>
                setFilters((current) => ({ ...current, q: event.target.value }))
              }
              onKeyDown={(event) => event.key === "Enter" && loadInbox()}
              placeholder="Search customer, email, order, message"
              className="h-10 rounded-lg border border-[var(--border-color)] px-3 text-sm outline-none focus:border-[var(--primary)]"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={filters.status}
                onChange={(event) =>
                  applyFilters({ status: event.target.value })
                }
                className="h-10 rounded-lg border border-[var(--border-color)] px-2 text-sm"
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={filters.priority}
                onChange={(event) =>
                  applyFilters({ priority: event.target.value })
                }
                className="h-10 rounded-lg border border-[var(--border-color)] px-2 text-sm"
              >
                <option value="">All priority</option>
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 p-5 text-sm font-semibold text-[var(--text-muted)]">
                <Loader2 size={16} className="animate-spin" /> Loading inbox
              </div>
            ) : items.length ? (
              items.map((item) => {
                const last = item.messages?.[0];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveId(item.id)}
                    className={`w-full border-b border-[var(--border-color)] p-3 text-left transition hover:bg-[var(--bg-soft)] sm:p-4 ${activeId === item.id ? "bg-[var(--bg-soft)]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                          {item.customer?.name || "Customer"}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">
                          {item.subject || item.id}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.priority === "URGENT" ? "bg-red-100 text-red-700" : "bg-[var(--bg-soft)] text-[var(--primary)]"}`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs font-medium text-[var(--text-muted)]">
                      {last?.message || "No messages yet"}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[var(--text-soft)]">
                      <span>{item.status}</span>
                      <span>{formatTime(item.lastMessageAt)}</span>
                    </div>
                    {item.agentUnread ? (
                      <span className="mt-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {item.agentUnread} unread
                      </span>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm font-semibold text-[var(--text-muted)]">
                No conversations found.
              </div>
            )}
          </div>
        </aside>

        <section className="flex h-[calc(100vh-6rem)] min-h-[640px] min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--border-color)] bg-white shadow-sm sm:h-[calc(100vh-7rem)] sm:min-h-[700px] xl:h-auto xl:min-h-0">
          {activePreview ? (
            <>
              <header className="shrink-0 flex flex-col gap-2 border-b border-[var(--border-color)] p-3 sm:gap-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Headphones size={20} className="text-[var(--primary)]" />
                    <h2 className="truncate text-base font-bold text-[var(--text-primary)] sm:text-lg">
                      {activePreview.customer?.name || "Customer"}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                    {activePreview.customer?.email}{" "}
                    {activePreview.customer?.phone
                      ? `- ${activePreview.customer.phone}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--text-soft)]">
                    {activePreview.id}{" "}
                    {activePreview.order
                      ? `- Order ${activePreview.order.id} (${activePreview.order.orderStatus})`
                      : ""}{" "}
                    {activePreview.product
                      ? `- ${activePreview.product.name}`
                      : ""}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={assignToMe}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] px-3 text-xs font-bold text-[var(--primary)] sm:h-10"
                  >
                    <UserCheck size={15} /> Assign to me
                  </button>
                  <select
                    value={activePreview.priority || "NORMAL"}
                    onChange={(event) =>
                      updateStatus({
                        status: activePreview.status,
                        priority: event.target.value,
                      })
                    }
                    className="h-9 rounded-lg border border-[var(--border-color)] px-2 text-xs font-bold sm:h-10"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <select
                    value={activePreview.status || "OPEN"}
                    onChange={(event) =>
                      updateStatus({ status: event.target.value })
                    }
                    className="h-9 rounded-lg border border-[var(--border-color)] px-2 text-xs font-bold sm:h-10"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </header>

              <div
                ref={listRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8fafc] p-3 sm:space-y-4 sm:p-4"
              >
                {activeMessages.map((message) => {
                  const fromAgent = message.senderType === "AGENT";
                  const noteMessage = message.messageType === "INTERNAL_NOTE";
                  const system = message.senderType === "SYSTEM";
                  return (
                    <div
                      key={message.id}
                      className={
                        system || noteMessage
                          ? "mx-auto max-w-[92%] text-center sm:max-w-[80%]"
                          : fromAgent
                            ? "ml-auto max-w-[88%] sm:max-w-[72%]"
                            : "mr-auto max-w-[88%] sm:max-w-[72%]"
                      }
                    >
                      <div
                        className={
                          noteMessage
                            ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 sm:px-4 sm:py-3"
                            : system
                              ? "rounded-full bg-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                              : `rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm sm:px-4 sm:py-3 ${fromAgent ? "rounded-br-md bg-[var(--primary)] text-white" : "rounded-bl-md bg-white text-[var(--text-primary)]"}`
                        }
                      >
                        {noteMessage ? "Internal note: " : ""}
                        {message.message}
                      </div>
                      {!system ? (
                        <p
                          className={`mt-1 text-[11px] text-[var(--text-soft)] ${fromAgent ? "text-right" : "text-left"}`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="shrink-0 grid gap-2 border-t border-[var(--border-color)] p-2 sm:gap-3 sm:p-4">
                <div className="flex gap-2">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendReply();
                      }
                    }}
                    rows={1}
                    placeholder="Type reply..."
                    className="min-h-10 flex-1 resize-none rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)] sm:min-h-12"
                  />
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={saving || !reply.trim()}
                    className="flex w-11 items-center justify-center rounded-lg bg-[var(--primary)] text-white disabled:opacity-50 sm:w-12"
                    aria-label="Send reply"
                  >
                    {saving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add internal note..."
                    className="h-9 flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm outline-none focus:border-amber-400 sm:h-10"
                  />
                  <button
                    type="button"
                    onClick={addNote}
                    disabled={saving || !note.trim()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-300 px-3 text-xs font-bold text-amber-800 disabled:opacity-50 sm:h-10"
                  >
                    <NotebookPen size={15} /> Note
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center text-[var(--text-muted)]">
              <MessageSquare size={36} />
              <p className="text-sm font-semibold">
                Select a conversation to start supporting customers.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
