import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { isAvailable } from "@/server/invitations";
import { royalContentSchema } from "@/server/validation";
import RoyalWeddingRenderer from "@/templates/royal-wedding/renderer";
export const dynamic = "force-dynamic";
export const metadata = { title: "Wedding invitation", robots: { index:false,follow:false } };
export default async function PurchasedInvitation({ params }: { params: Promise<{ slug:string }> }) {
  const invitation = await db.invitation.findUnique({ where:{slug:(await params).slug},include:{owner:{select:{suspended:true}}} });
  if (!invitation || !isAvailable(invitation) || invitation.owner.suspended || invitation.templateId !== "royal-wedding") notFound();
  const content = royalContentSchema.safeParse(invitation.published);
  if (!content.success) notFound();
  const sections = invitation.publishedSections.filter(section => section !== "rsvp" || invitation.rsvpEnabled);
  return <main id="main-content"><RoyalWeddingRenderer content={content.data} mode="live" sections={sections} live={invitation.rsvpEnabled && (!invitation.rsvpDeadline || invitation.rsvpDeadline > new Date()) ? {slug:invitation.slug,partyLimit:invitation.partyLimit,dietaryEnabled:invitation.dietaryEnabled,accommodationEnabled:invitation.accommodationEnabled}:undefined}/></main>;
}