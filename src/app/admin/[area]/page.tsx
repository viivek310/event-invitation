import { notFound } from "next/navigation";
import { StudioWorkspace } from "@/components/studio-workspace";
export default async function AdminArea({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!["customers","coupons","sales","settings","audit"].includes(area)) notFound();
  return <StudioWorkspace area={area} />;
}
