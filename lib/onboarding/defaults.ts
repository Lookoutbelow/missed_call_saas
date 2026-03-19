import type { OfficeHoursJson } from "@/lib/settings/types";

export const DEFAULT_OFFICE_HOURS: OfficeHoursJson = {
  monday: { isOpen: true, open: "08:00", close: "17:00" },
  tuesday: { isOpen: true, open: "08:00", close: "17:00" },
  wednesday: { isOpen: true, open: "08:00", close: "17:00" },
  thursday: { isOpen: true, open: "08:00", close: "17:00" },
  friday: { isOpen: true, open: "08:00", close: "17:00" },
  saturday: { isOpen: false, open: "09:00", close: "13:00" },
  sunday: { isOpen: false, open: "09:00", close: "13:00" }
};

export const DEFAULT_TEMPLATES = [
  {
    name: "Missed call template",
    template_type: "missed_call",
    body: "Sorry we missed your call. Thanks for reaching out to {{business_name}}. Reply with the issue and we'll get back to you ASAP."
  },
  {
    name: "After-hours template",
    template_type: "after_hours",
    body: "Thanks for contacting {{business_name}} after hours. Reply with your plumbing issue and we'll follow up first thing when the office opens."
  },
  {
    name: "Opt-out confirmation template",
    template_type: "opt_out_confirmation",
    body: "You have been unsubscribed from {{business_name}} text updates. Reply START to opt back in."
  }
] as const;
