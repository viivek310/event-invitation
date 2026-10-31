import { InvitationEditor } from "@/components/invitation-editor";
import { requirePageAccount } from "@/server/auth";
import { ownedInvitation } from "@/server/invitations";
export default async function CustomerInvitation({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePageAccount(); const { id } = await params;
  await ownedInvitation(id, actor);
  return <InvitationEditor id={id} customer />;
}
