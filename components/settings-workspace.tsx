"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { OfficeHoursJson, SettingsPayload } from "@/lib/settings/types";

type SettingsWorkspaceProps = {
  initialSettings: SettingsPayload;
};

const DAYS: Array<keyof OfficeHoursJson> = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix"
];

function validateSettings(settings: SettingsPayload) {
  const errors: Record<string, string> = {};

  if (!settings.businessInfo.businessName.trim()) {
    errors.businessName = "Business name is required.";
  }
  if (!settings.businessInfo.ownerName.trim()) {
    errors.ownerName = "Owner name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.businessInfo.email.trim())) {
    errors.email = "Enter a valid email.";
  }
  if (!/^[0-9+()\-\s]{7,}$/.test(settings.businessInfo.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (settings.notifications.notifyEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.notifications.notifyEmail.trim())) {
    errors.notifyEmail = "Notify email is invalid.";
  }
  if (settings.notifications.notifySmsNumber.trim() && !/^[0-9+()\-\s]{7,}$/.test(settings.notifications.notifySmsNumber.trim())) {
    errors.notifySmsNumber = "Notify SMS number is invalid.";
  }
  if (!settings.templates.missedCall.trim()) {
    errors.missedCallTemplate = "Missed call template is required.";
  }
  if (!settings.templates.afterHours.trim()) {
    errors.afterHoursTemplate = "After-hours template is required.";
  }
  if (!settings.templates.optOutConfirmation.trim()) {
    errors.optOutTemplate = "Opt-out confirmation template is required.";
  }

  for (const day of DAYS) {
    const entry = settings.officeHours[day];
    if (entry.isOpen && (!entry.open || !entry.close || entry.open >= entry.close)) {
      errors[`officeHours.${day}`] = "Opening time must be before closing time.";
    }
  }

  return errors;
}

export function SettingsWorkspace({ initialSettings }: SettingsWorkspaceProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const errors = useMemo(() => validateSettings(settings), [settings]);

  function updateOfficeHours(day: keyof OfficeHoursJson, field: "isOpen" | "open" | "close", value: boolean | string) {
    setSettings((current) => ({
      ...current,
      officeHours: {
        ...current.officeHours,
        [day]: {
          ...current.officeHours[day],
          [field]: value
        }
      }
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);

    if (Object.keys(errors).length > 0) {
      setSaveError("Fix the highlighted fields before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Failed to save settings.");
      }

      setSaveSuccess("Settings saved.");
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="settings-workspace" onSubmit={handleSave}>
      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Business info</p>
            <h2>Company profile</h2>
          </div>
        </div>
        <div className="settings-grid-form">
          <label>
            Business name
            <input
              value={settings.businessInfo.businessName}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  businessInfo: { ...settings.businessInfo, businessName: event.target.value }
                })
              }
            />
            {errors.businessName ? <small className="field-error">{errors.businessName}</small> : null}
          </label>
          <label>
            Owner name
            <input
              value={settings.businessInfo.ownerName}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  businessInfo: { ...settings.businessInfo, ownerName: event.target.value }
                })
              }
            />
            {errors.ownerName ? <small className="field-error">{errors.ownerName}</small> : null}
          </label>
          <label>
            Email
            <input
              type="email"
              value={settings.businessInfo.email}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  businessInfo: { ...settings.businessInfo, email: event.target.value }
                })
              }
            />
            {errors.email ? <small className="field-error">{errors.email}</small> : null}
          </label>
          <label>
            Phone
            <input
              value={settings.businessInfo.phone}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  businessInfo: { ...settings.businessInfo, phone: event.target.value }
                })
              }
            />
            {errors.phone ? <small className="field-error">{errors.phone}</small> : null}
          </label>
          <label>
            Timezone
            <select
              value={settings.businessInfo.timezone}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  businessInfo: { ...settings.businessInfo, timezone: event.target.value }
                })
              }
            >
              {TIMEZONES.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Office hours</p>
            <h2>Schedule</h2>
          </div>
        </div>
        <div className="office-hours-grid">
          {DAYS.map((day) => (
            <div key={day} className="office-hours-row">
              <div className="office-hours-day">
                <strong>{day}</strong>
                <label className="office-hours-toggle">
                  <input
                    type="checkbox"
                    checked={settings.officeHours[day].isOpen}
                    onChange={(event) => updateOfficeHours(day, "isOpen", event.target.checked)}
                  />
                  <span>{settings.officeHours[day].isOpen ? "Open" : "Closed"}</span>
                </label>
              </div>
              <div className="office-hours-times">
                <input
                  type="time"
                  value={settings.officeHours[day].open}
                  disabled={!settings.officeHours[day].isOpen}
                  onChange={(event) => updateOfficeHours(day, "open", event.target.value)}
                />
                <input
                  type="time"
                  value={settings.officeHours[day].close}
                  disabled={!settings.officeHours[day].isOpen}
                  onChange={(event) => updateOfficeHours(day, "close", event.target.value)}
                />
              </div>
              {errors[`officeHours.${day}`] ? <small className="field-error">{errors[`officeHours.${day}`]}</small> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="panel settings-section">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Templates</p>
            <h2>Messaging copy</h2>
          </div>
        </div>
        <div className="settings-stack">
          <label>
            Missed call template
            <textarea
              rows={4}
              value={settings.templates.missedCall}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  templates: { ...settings.templates, missedCall: event.target.value }
                })
              }
            />
            {errors.missedCallTemplate ? <small className="field-error">{errors.missedCallTemplate}</small> : null}
          </label>
          <label>
            After-hours template
            <textarea
              rows={4}
              value={settings.templates.afterHours}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  templates: { ...settings.templates, afterHours: event.target.value }
                })
              }
            />
            {errors.afterHoursTemplate ? <small className="field-error">{errors.afterHoursTemplate}</small> : null}
          </label>
          <label>
            Opt-out confirmation template
            <textarea
              rows={3}
              value={settings.templates.optOutConfirmation}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  templates: { ...settings.templates, optOutConfirmation: event.target.value }
                })
              }
            />
            {errors.optOutTemplate ? <small className="field-error">{errors.optOutTemplate}</small> : null}
          </label>
        </div>
      </section>

      <section className="settings-bottom-grid">
        <section className="panel settings-section">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Notifications</p>
              <h2>Alert destinations</h2>
            </div>
          </div>
          <div className="settings-grid-form">
            <label>
              Notify email
              <input
                type="email"
                value={settings.notifications.notifyEmail}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, notifyEmail: event.target.value }
                  })
                }
              />
              {errors.notifyEmail ? <small className="field-error">{errors.notifyEmail}</small> : null}
            </label>
            <label>
              Notify SMS number
              <input
                value={settings.notifications.notifySmsNumber}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, notifySmsNumber: event.target.value }
                  })
                }
              />
              {errors.notifySmsNumber ? <small className="field-error">{errors.notifySmsNumber}</small> : null}
            </label>
          </div>
        </section>

        <section className="panel settings-section">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Plan info</p>
              <h2>Subscription</h2>
            </div>
          </div>
          <div className="plan-card">
            <strong>{settings.plan.name}</strong>
            <p>{settings.plan.usageSummary}</p>
          </div>
        </section>
      </section>

      <div className="settings-footer">
        <div>
          {saveError ? <p className="form-message">{saveError}</p> : null}
          {saveSuccess ? <p className="success-message">{saveSuccess}</p> : null}
        </div>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}
