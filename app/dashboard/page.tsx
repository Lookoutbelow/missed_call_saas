import { AppShell } from "@/components/app-shell";
import { getCurrentUserEmail } from "@/lib/current-user";

const dashboardStats = [
  { label: "Missed calls today", value: "18", change: "+12% vs. last Friday" },
  { label: "Text-back rate", value: "89%", change: "Avg first reply in 46 sec" },
  { label: "Booked jobs", value: "7", change: "$4.2k pipeline recovered" }
];

const inboxConversations = [
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
] as const;

const leads = [
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
] as const;

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
