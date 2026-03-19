export type LeadReplyNotificationPayload = {
  accountId: string;
  businessName: string;
  conversationId: string;
  customerPhone: string;
  latestMessage: string;
  timestamp: string;
};

export type LeadReplyNotificationResult = {
  notified: boolean;
  channels: Array<"email" | "sms">;
  skippedReason?:
    | "not_first_inbound_after_auto_text"
    | "notification_recently_sent"
    | "no_destinations"
    | "settings_not_found"
    | "delivery_failed";
};
