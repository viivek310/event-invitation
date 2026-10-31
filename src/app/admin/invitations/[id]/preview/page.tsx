import { SavedInvitationPreview } from "@/components/saved-invitation-preview";
export default async function Preview({ params }: { params: Promise<{ id: string }> }) { return <SavedInvitationPreview id={(await params).id} admin />; }
