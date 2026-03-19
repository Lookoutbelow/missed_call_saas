import type { InboxConversation, Lead, NavItem, SettingsSection, StatCard } from "@/lib/types";

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", description: "Ops snapshot" },
  { href: "/inbox", label: "Inbox", description: "Live text threads" },
  { href: "/leads", label: "Leads", description: "New opportunities" },
  { href: "/settings", label: "Settings", description: "Routing and team" }
];

export const dashboardStats: StatCard[] = [
  { label: "Missed calls today", value: "18", change: "+12% vs. last Friday" },
  { label: "Text-back rate", value: "89%", change: "Avg first reply in 46 sec" },
  { label: "Booked jobs", value: "7", change: "$4.2k pipeline recovered" }
];

export const inboxConversations: InboxConversation[] = [
  {
    id: "conv_1",
    caller: "Jordan Keller",
    phone: "(561) 555-0139",
    lastMessage: "Can someone check a leaking water heater this afternoon?",
    timestamp: "2 min ago",
    status: "new"
  },
  {
    id: "conv_2",
    caller: "Marisol Grant",
    phone: "(561) 555-0190",
    lastMessage: "Thanks. I sent the gate code and photos of the cleanout.",
    timestamp: "14 min ago",
    status: "active"
  },
  {
    id: "conv_3",
    caller: "Carter Shaw",
    phone: "(561) 555-0177",
    lastMessage: "Booked for Monday. Please text when the tech is on the way.",
    timestamp: "42 min ago",
    status: "closed"
  }
];

export const leads: Lead[] = [
  {
    id: "lead_1",
    name: "Highland Estates HOA",
    service: "Sewer line backup",
    neighborhood: "Wellington",
    source: "Missed call text-back",
    responseTime: "31 sec",
    status: "hot"
  },
  {
    id: "lead_2",
    name: "Anna Brooks",
    service: "Tankless install quote",
    neighborhood: "Jupiter",
    source: "Voicemail recovery",
    responseTime: "1 min 12 sec",
    status: "follow-up"
  },
  {
    id: "lead_3",
    name: "Milo's Pizza",
    service: "Grease trap emergency",
    neighborhood: "West Palm Beach",
    source: "After-hours missed call",
    responseTime: "19 sec",
    status: "won"
  }
];

export const settingsSections: SettingsSection[] = [
  {
    title: "Text-back automation",
    summary: "Define the first message a missed caller receives and the routing rules behind it.",
    items: [
      "Business-hours and after-hours response templates",
      "Escalation keywords for emergencies",
      "Dispatch handoff timing"
    ]
  },
  {
    title: "Team notifications",
    summary: "Control which dispatchers or plumbers receive new lead alerts.",
    items: [
      "Round-robin assignment",
      "SMS and email notification preferences",
      "Role-based dashboard access"
    ]
  },
  {
    title: "Booking preferences",
    summary: "Configure how recovered calls become booked jobs in your workflow.",
    items: [
      "Lead qualification checklist",
      "Service area filters",
      "CRM field mappings"
    ]
  }
];
