import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/templates/registry";
import { TemplateSandbox } from "@/components/template-sandbox";

export default async function SandboxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const template = getTemplate((await params).id);
  if (!template) notFound();
  return (
    <>
      <Link
        className="text-link back-link"
        href={`/admin/templates/${template.id}`}
      >
        ← Template details
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Local preview sandbox</p>
          <h1>
            {template.name}
            <span className="brand-dot">.</span>
          </h1>
          <p>
            Try example names and content using the same invitation renderer.
          </p>
        </div>
        <span className="tag warm">Not saved</span>
      </div>
      <TemplateSandbox template={template} />
    </>
  );
}
