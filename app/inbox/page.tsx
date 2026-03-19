import { AppShell } from "@/components/app-shell";
import { InboxWorkspace } from "@/components/inbox-workspace";
import { getCurrentAccount, getCurrentUser } from "@/lib/account";
import { getInboxConversationDetail, getInboxConversations } from "@/lib/inbox/data";

export default async function InboxPage() {
  const [user, account] = await Promise.all([getCurrentUser(), getCurrentAccount()]);
  const userEmail = user?.email ?? "dispatch@yourshop.com";
  const conversations = account ? await getInboxConversations(account.id) : [];
  const initialConversationId = conversations[0]?.id;
  const initialDetail = account && initialConversationId ? await getInboxConversationDetail(account.id, initialConversationId) : null;

  return (
    <AppShell
      title="Inbox"
      subtitle="Manage customer text threads recovered from missed calls and keep dispatch moving."
      userEmail={userEmail}
    >
      <InboxWorkspace initialConversations={conversations} initialDetail={initialDetail} />
    </AppShell>
  );
}
