import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicTemplate } from "@/server/catalog";
import { templateRenderers } from "@/templates/renderers";
import { PreviewStudio } from "@/components/preview-studio";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ templateSlug: string }>; searchParams: Promise<{ canvas?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const template = await publicTemplate((await params).templateSlug);
  return { title: template ? `${template.name} — Preview` : "Preview unavailable", robots: { index:false,follow:false } };
}
export default async function TemplatePreview({ params, searchParams }: Props) {
  const template = await publicTemplate((await params).templateSlug);
  if (!template) notFound();
  const Renderer = templateRenderers[template.id];
  if (!Renderer) notFound();
  if ((await searchParams).canvas === "1") return <main id="main-content" className="invitation-canvas"><Renderer content={template.demo} mode="demo" /></main>;
  return <PreviewStudio templateId={template.id} name={template.name} />;
}