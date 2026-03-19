export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export type StatCard = {
  label: string;
  value: string;
  change: string;
};

export type InboxConversation = {
  id: string;
  caller: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  status: "new" | "active" | "closed";
};

export type Lead = {
  id: string;
  name: string;
  service: string;
  neighborhood: string;
  source: string;
  responseTime: string;
  status: "hot" | "follow-up" | "won";
};

export type SettingsSection = {
  title: string;
  summary: string;
  items: string[];
};
