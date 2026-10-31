import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLocalDevelopment } from "@/lib/dev-workspace";
import { RoyalOpeningPreview } from "@/templates/royal-wedding/opening/opening-preview";

export const metadata = {
  title: "Royal Wedding — Complete design review",
  robots: { index: false, follow: false },
};

export default async function InProgressPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireLocalDevelopment();
  if ((await params).id !== "royal-wedding") notFound();
  return (
    <>
      <Link
        className="text-link back-link"
        href="/admin/templates/royal-wedding"
      >
        ← Royal Wedding details
      </Link>
      <div className="page-heading">
        <div>
          <span className="page-kicker">ROYAL PATRIKA · DESIGN REVIEW</span>
          <h1>Royal Wedding invitation</h1>
          <p>
            The complete celebration, from the first seal to the family’s final invitation.
          </p>
        </div>
        <span className="tag warm">Local review only</span>
      </div>
      <RoyalOpeningPreview />
    </>
  );
}
