import { requireLocalDevelopment } from "@/lib/dev-workspace";
import { FullPageRoyalPreview } from "@/templates/royal-wedding/full-page-preview";

export const metadata = {
  title: "Aarav & Meera — Royal Wedding Preview",
  robots: { index: false, follow: false },
};

export default async function RoyalWeddingPreviewPage() {
  await requireLocalDevelopment();
  return <FullPageRoyalPreview />;
}
