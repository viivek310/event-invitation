import { requirePageAccount } from "@/server/auth";
import { ownedInvitation } from "@/server/invitations";
import { royalContentSchema } from "@/server/validation";
import RoyalWeddingRenderer from "@/templates/royal-wedding/renderer";
export async function SavedInvitationPreview({ id, admin = false }: { id: string; admin?: boolean }) {
  const actor = await requirePageAccount(admin ? "ADMIN" : undefined);
  const invitation = await ownedInvitation(id, actor);
  const content = royalContentSchema.parse(invitation.draft);
  return <><aside className="notice"><p>Private saved-draft preview. RSVP submissions are disabled. This is not the public invitation link.</p></aside><RoyalWeddingRenderer content={content} mode="preview" sections={invitation.sections} /></>;
}
