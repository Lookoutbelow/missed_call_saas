export type LeadStatusFilter = "all" | "new" | "contacted" | "booked" | "closed-lost";

export type LeadListItem = {
  id: string;
  customerName: string;
  customerPhone: string;
  issueType: string | null;
  address: string | null;
  urgency: "emergency" | "same_day" | "standard";
  callbackPreference: string | null;
  status: "new" | "contacted" | "booked" | "closed-lost";
  notes: string | null;
  updatedAt: string;
};

export type LeadDetail = LeadListItem;
