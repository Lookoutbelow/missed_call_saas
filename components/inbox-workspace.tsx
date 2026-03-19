"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { InboxConversationDetail, InboxConversationListItem, InboxMessage } from "@/lib/inbox/types";

type InboxWorkspaceProps = {
  initialConversations: InboxConversationListItem[];
  initialDetail: InboxConversationDetail | null;
};

type PendingMessage = InboxMessage & {
  pending?: boolean;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "No messages yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function deliveryLabel(status: PendingMessage["deliveryStatus"], pending?: boolean) {
  if (pending) {
    return "Sending...";
  }

  switch (status) {
    case "failed":
      return "Failed";
    case "sent":
      return "Sent";
    case "delivered":
      return "Delivered";
    case "received":
      return "Received";
    default:
      return "Queued";
  }
}

function updateConversationList(
  conversations: InboxConversationListItem[],
  conversationId: string,
  patch: Partial<InboxConversationListItem>
) {
  return conversations
    .map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            ...patch
          }
        : conversation
    )
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
}

export function InboxWorkspace({ initialConversations, initialDetail }: InboxWorkspaceProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialDetail?.conversation.id ?? initialConversations[0]?.id ?? null);
  const [detail, setDetail] = useState<InboxConversationDetail | null>(initialDetail);
  const [isLoading, setIsLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    if (detail?.conversation.id === selectedConversationId) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setSendError(null);

    void fetch(`/api/inbox/conversations/${selectedConversationId}`, {
      method: "GET",
      credentials: "include"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load conversation.");
        }

        return (await response.json()) as InboxConversationDetail;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setDetail(payload);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setSendError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detail?.conversation.id, selectedConversationId]);

  const displayedMessages = detail?.messages ?? [];

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId || !composer.trim() || !detail) {
      return;
    }

    const body = composer.trim();
    const optimisticSentAt = new Date().toISOString();
    const optimisticMessage: PendingMessage = {
      id: `temp-${optimisticSentAt}`,
      body,
      direction: "outbound",
      senderType: "team_member",
      sentAt: optimisticSentAt,
      deliveryStatus: "queued",
      pending: true
    };

    const previousDetail = detail;
    const previousConversations = conversations;
    let preserveFailedMessage = false;

    setComposer("");
    setSendError(null);
    setIsSending(true);

    setDetail({
      ...detail,
      conversation: {
        ...detail.conversation,
        latestMessagePreview: body,
        lastMessageAt: optimisticSentAt
      },
      messages: [...detail.messages, optimisticMessage]
    });
    setConversations((current) =>
      updateConversationList(current, selectedConversationId, {
        latestMessagePreview: body,
        lastMessageAt: optimisticSentAt
      })
    );

    try {
      const response = await fetch("/api/inbox/reply", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          conversationId: selectedConversationId,
          body
        })
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: InboxMessage;
        latestMessageAt?: string;
        error?: string;
      };

      if (!response.ok) {
        if (payload.message) {
          preserveFailedMessage = true;
          setConversations(previousConversations);
          setDetail((current) =>
            current && current.conversation.id === selectedConversationId
              ? {
                ...current,
                conversation: previousDetail.conversation,
                  messages: current.messages
                    .filter((message) => message.id !== optimisticMessage.id)
                    .concat(payload.message)
                }
              : current
          );
        } else {
          setDetail(previousDetail);
          setConversations(previousConversations);
        }

        setComposer(body);
        throw new Error(payload.error ?? "Failed to send reply.");
      }

      if (!payload.message || !payload.latestMessageAt) {
        throw new Error("Failed to send reply.");
      }

      setDetail((current) =>
        current && current.conversation.id === selectedConversationId
          ? {
              ...current,
              conversation: {
                ...current.conversation,
                latestMessagePreview: payload.message.body,
                lastMessageAt: payload.latestMessageAt
              },
              messages: current.messages
                .filter((message) => message.id !== optimisticMessage.id)
                .concat(payload.message)
            }
          : current
      );
      setConversations((current) =>
        updateConversationList(current, selectedConversationId, {
          latestMessagePreview: payload.message.body,
          lastMessageAt: payload.latestMessageAt
        })
      );
      router.refresh();
    } catch (error) {
      if (!preserveFailedMessage) {
        setDetail(previousDetail);
        setConversations(previousConversations);
      }
      setComposer(body);
      setSendError(error instanceof Error ? error.message : "Failed to send reply.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="inbox-layout">
      <aside className="panel inbox-sidebar">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Conversations</p>
            <h2>Customer threads</h2>
          </div>
          <div className="header-card">{conversations.length} active</div>
        </div>
        <div className="inbox-conversation-list">
          {conversations.length === 0 ? (
            <p className="empty-state">No conversations yet.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-list-item${conversation.id === selectedConversationId ? " is-active" : ""}`}
                onClick={() => setSelectedConversationId(conversation.id)}
              >
                <div className="conversation-list-topline">
                  <strong>{conversation.contactName ?? conversation.contactPhone}</strong>
                  <span className={`pill pill--${conversation.status}`}>{conversation.status}</span>
                </div>
                <p>{conversation.latestMessagePreview ?? "No messages yet"}</p>
                <small>{formatTimestamp(conversation.lastMessageAt)}</small>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="panel inbox-thread-panel">
        {detail ? (
          <>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Thread</p>
                <h2>{detail.conversation.contactName ?? detail.conversation.contactPhone}</h2>
                <p>{detail.conversation.contactPhone}</p>
              </div>
              <div className="thread-meta">
                <span className={`pill pill--${detail.conversation.status}`}>{detail.conversation.status}</span>
                <small>{formatTimestamp(detail.conversation.lastMessageAt)}</small>
              </div>
            </div>

            <div className="message-thread">
              {isLoading ? <p className="empty-state">Loading thread...</p> : null}
              {!isLoading && displayedMessages.length === 0 ? <p className="empty-state">No messages yet.</p> : null}
              {!isLoading
                ? displayedMessages.map((message) => (
                    <article
                      key={message.id}
                      className={`message-bubble message-bubble--${message.direction}${message.pending ? " is-pending" : ""}${
                        message.deliveryStatus === "failed" ? " is-failed" : ""
                      }`}
                    >
                      <p>{message.body}</p>
                      <small>{formatTimestamp(message.sentAt)} · {deliveryLabel(message.deliveryStatus, message.pending)}</small>
                    </article>
                  ))
                : null}
            </div>

            <form className="reply-composer" onSubmit={handleSend}>
              <textarea
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder={detail.replyState.canReply ? "Reply to the customer..." : detail.replyState.reason ?? "Reply unavailable"}
                rows={3}
                disabled={isSending || !detail.replyState.canReply}
              />
              <div className="reply-composer__footer">
                <div>
                  {detail.replyState.reason ? <p className="form-message">{detail.replyState.reason}</p> : null}
                  {sendError ? <p className="form-message">{sendError}</p> : null}
                </div>
                <button type="submit" disabled={isSending || !composer.trim() || !detail.replyState.canReply}>
                  {isSending ? "Sending..." : "Send SMS"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="empty-thread">
            <p className="eyebrow">Inbox</p>
            <h2>Select a conversation</h2>
            <p className="empty-state">Choose a thread to view the full message history and lead details.</p>
          </div>
        )}
      </section>

      <aside className="panel inbox-lead-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Lead summary</p>
            <h2>Opportunity details</h2>
          </div>
        </div>
        {detail ? (
          <dl className="lead-summary">
            <div>
              <dt>Customer number</dt>
              <dd>{detail.lead.customerPhone ?? detail.conversation.contactPhone}</dd>
            </div>
            <div>
              <dt>Issue type</dt>
              <dd>{detail.lead.issueType ?? "Unclassified"}</dd>
            </div>
            <div>
              <dt>Urgency</dt>
              <dd>{detail.lead.urgency ?? "Unknown"}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{detail.lead.address ?? "Not captured yet"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{detail.lead.status ?? "Open"}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{detail.lead.notes ?? "No notes yet."}</dd>
            </div>
          </dl>
        ) : (
          <p className="empty-state">Lead details appear when a conversation is selected.</p>
        )}
      </aside>
    </section>
  );
}
