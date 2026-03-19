"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { LeadDetail, LeadListItem, LeadStatusFilter } from "@/lib/leads/types";

type LeadsWorkspaceProps = {
  initialLeads: LeadListItem[];
};

const STATUS_FILTERS: LeadStatusFilter[] = ["all", "new", "contacted", "booked", "closed-lost"];
const STATUS_OPTIONS: Array<LeadDetail["status"]> = ["new", "contacted", "booked", "closed-lost"];
const URGENCY_OPTIONS: Array<LeadDetail["urgency"]> = ["emergency", "same_day", "standard"];

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function filterLeads(leads: LeadListItem[], status: LeadStatusFilter, phoneQuery: string) {
  const normalizedQuery = phoneQuery.trim().toLowerCase();

  return leads
    .filter((lead) => (status === "all" ? true : lead.status === status))
    .filter((lead) => (normalizedQuery ? lead.customerPhone.toLowerCase().includes(normalizedQuery) : true))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function LeadsWorkspace({ initialLeads }: LeadsWorkspaceProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initialLeads[0]?.id ?? null);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(initialLeads[0] ?? null);
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>("all");
  const [phoneQuery, setPhoneQuery] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<LeadDetail | null>(initialLeads[0] ?? null);

  const visibleLeads = filterLeads(leads, statusFilter, phoneQuery);

  useEffect(() => {
    if (!selectedLeadId) {
      setSelectedLead(null);
      setDraft(null);
      return;
    }

    if (selectedLead?.id === selectedLeadId) {
      return;
    }

    let cancelled = false;
    setIsLoadingDetail(true);
    setSaveError(null);

    void fetch(`/api/leads/${selectedLeadId}`, {
      method: "GET",
      credentials: "include"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load lead.");
        }

        return (await response.json()) as LeadDetail;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setSelectedLead(payload);
        setDraft(payload);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setSaveError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedLead?.id, selectedLeadId]);

  useEffect(() => {
    if (!visibleLeads.length) {
      setSelectedLeadId(null);
      return;
    }

    if (!selectedLeadId || !visibleLeads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(visibleLeads[0].id);
    }
  }, [selectedLeadId, visibleLeads]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/leads/update", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          leadId: draft.id,
          customerName: draft.customerName,
          issueType: draft.issueType,
          address: draft.address,
          urgency: draft.urgency,
          callbackPreference: draft.callbackPreference,
          status: draft.status,
          notes: draft.notes
        })
      });

      const payload = (await response.json()) as LeadDetail & { error?: string };
      if (!response.ok || payload.error) {
        throw new Error(payload.error ?? "Failed to update lead.");
      }

      setSelectedLead(payload);
      setDraft(payload);
      setLeads((current) =>
        current
          .map((lead) => (lead.id === payload.id ? payload : lead))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update lead.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="leads-layout">
      <section className="panel leads-table-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Pipeline</p>
            <h2>Recovered leads</h2>
          </div>
          <div className="header-card">{visibleLeads.length} shown</div>
        </div>

        <div className="leads-toolbar">
          <div className="leads-filter-row">
            {STATUS_FILTERS.map((filterValue) => (
              <button
                key={filterValue}
                type="button"
                className={`filter-chip${statusFilter === filterValue ? " is-active" : ""}`}
                onClick={() => setStatusFilter(filterValue)}
              >
                {filterValue}
              </button>
            ))}
          </div>
          <label className="search-input">
            <span className="sr-only">Search by phone number</span>
            <input
              type="search"
              placeholder="Search by phone number"
              value={phoneQuery}
              onChange={(event) => setPhoneQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="table-shell leads-table-shell">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Issue</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className={lead.id === selectedLeadId ? "is-selected-row" : ""}
                  onClick={() => setSelectedLeadId(lead.id)}
                >
                  <td>
                    <strong>{lead.customerName}</strong>
                    <span>{lead.address ?? "Address pending"}</span>
                  </td>
                  <td>{lead.customerPhone}</td>
                  <td>{lead.issueType ?? "General inquiry"}</td>
                  <td>
                    <span className={`pill pill--${lead.urgency}`}>{lead.urgency.replace("_", " ")}</span>
                  </td>
                  <td>
                    <span className={`pill pill--${lead.status}`}>{lead.status}</span>
                  </td>
                  <td>{formatTimestamp(lead.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleLeads.length === 0 ? <p className="empty-state">No leads match the current filters.</p> : null}
        </div>
      </section>

      <aside className={`panel lead-drawer${selectedLeadId ? " is-open" : ""}`}>
        {draft ? (
          <form className="lead-drawer__form" onSubmit={handleSave}>
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Lead details</p>
                <h2>{draft.customerName}</h2>
                <p>{draft.customerPhone}</p>
              </div>
              <button type="button" className="drawer-close" onClick={() => setSelectedLeadId(null)}>
                Close
              </button>
            </div>

            {isLoadingDetail ? <p className="empty-state">Loading lead...</p> : null}

            <div className="lead-form-grid">
              <label>
                Customer name
                <input
                  value={draft.customerName}
                  onChange={(event) => setDraft({ ...draft, customerName: event.target.value })}
                />
              </label>
              <label>
                Issue type
                <input
                  value={draft.issueType ?? ""}
                  onChange={(event) => setDraft({ ...draft, issueType: event.target.value || null })}
                />
              </label>
              <label>
                Address
                <input
                  value={draft.address ?? ""}
                  onChange={(event) => setDraft({ ...draft, address: event.target.value || null })}
                />
              </label>
              <label>
                Urgency
                <select
                  value={draft.urgency}
                  onChange={(event) =>
                    setDraft({ ...draft, urgency: event.target.value as LeadDetail["urgency"] })
                  }
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Callback preference
                <input
                  value={draft.callbackPreference ?? ""}
                  onChange={(event) =>
                    setDraft({ ...draft, callbackPreference: event.target.value || null })
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as LeadDetail["status"] })
                  }
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lead-form-grid__full">
                Notes
                <textarea
                  rows={6}
                  value={draft.notes ?? ""}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value || null })}
                />
              </label>
            </div>

            <div className="lead-drawer__footer">
              {saveError ? <p className="form-message">{saveError}</p> : <small>Updated {formatTimestamp(draft.updatedAt)}</small>}
              <button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save lead"}
              </button>
            </div>
          </form>
        ) : (
          <div className="empty-thread">
            <p className="eyebrow">Lead details</p>
            <h2>Select a lead</h2>
            <p className="empty-state">Choose a lead from the table to review and edit its details.</p>
          </div>
        )}
      </aside>
    </section>
  );
}
