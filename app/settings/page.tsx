import { AppShell } from "@/components/app-shell";
import { SettingsWorkspace } from "@/components/settings-workspace";
import { getCurrentAccount, getCurrentUser } from "@/lib/account";
import { getSettingsData } from "@/lib/settings/data";

export default async function SettingsPage() {
  const [user, account] = await Promise.all([getCurrentUser(), getCurrentAccount()]);
  const userEmail = user?.email ?? "dispatch@yourshop.com";
  const settings = account ? await getSettingsData(account.id) : null;

  return (
    <AppShell
      title="Settings"
      subtitle="Control your text-back automation, team access, and booking workflow."
      userEmail={userEmail}
    >
      {settings ? (
        <SettingsWorkspace initialSettings={settings} />
      ) : (
        <section className="panel">
          <p className="empty-state">No account settings found.</p>
        </section>
      )}
    </AppShell>
  );
}
