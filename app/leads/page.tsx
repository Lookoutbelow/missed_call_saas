import { AppShell } from "@/components/app-shell";
import { LeadsWorkspace } from "@/components/leads-workspace";
import { getCurrentAccount, getCurrentUser } from "@/lib/account";
import { getLeads } from "@/lib/leads/data";

export default async function LeadsPage() {
  const [user, account] = await Promise.all([getCurrentUser(), getCurrentAccount()]);
  const userEmail = user?.email ?? "dispatch@yourshop.com";
  const leads = account ? await getLeads(account.id) : [];

  return (
    <AppShell
      title="Leads"
      subtitle="Qualify recovered missed-call opportunities and move the best jobs into dispatch."
      userEmail={userEmail}
    >
      <LeadsWorkspace initialLeads={leads} />
    </AppShell>
  );
}
