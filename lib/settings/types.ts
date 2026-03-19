export type OfficeHoursEntry = {
  isOpen: boolean;
  open: string;
  close: string;
};

export type OfficeHoursJson = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  OfficeHoursEntry
>;

export type SettingsPayload = {
  businessInfo: {
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    timezone: string;
  };
  officeHours: OfficeHoursJson;
  templates: {
    missedCall: string;
    afterHours: string;
    optOutConfirmation: string;
  };
  notifications: {
    notifyEmail: string;
    notifySmsNumber: string;
  };
  plan: {
    name: string;
    usageSummary: string;
  };
};
