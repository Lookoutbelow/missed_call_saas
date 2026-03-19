import { AppShell } from "@/components/app-shell";
import { getCurrentUserEmail } from "@/lib/current-user";
import { dashboardStats, inboxConversations, leads } from "@/lib/data";

export default async function DashboardPage() {
  const userEmail = await getCurrentUserEmail();

  return (
    <AppShell
      title="Recovered revenue at a glance"
      subtitle="Track missed calls, live text conversations, and high-intent plumbing leads in one operating view."
      userEmail={userEmail}
    >
      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <article key={stat.label} className="panel stat-card">
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.change}</span>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Live inbox</p>
              <h2>Newest conversations</h2>
            </div>
          </div>
          <div className="stack-list">
            {inboxConversations.map((conversation) => (
              <div key={conversation.id} className="list-row">
                <div>
                  <strong>{conversation.caller}</strong>
                  <p>{conversation.lastMessage}</p>
                </div>
                <div className={`pill pill--${conversation.status}`}>{conversation.timestamp}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Dispatch queue</p>
              <h2>Best leads to call now</h2>
            </div>
          </div>
          <div className="stack-list">
            {leads.map((lead) => (
              <div key={lead.id} className="list-row">
                <div>
                  <strong>{lead.name}</strong>
                  <p>
                    {lead.service} · {lead.neighborhood}
                  </p>
                </div>
                <div className={`pill pill--${lead.status}`}>{lead.responseTime}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
