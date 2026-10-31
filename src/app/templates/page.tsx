import { PublicHeader, PublicFooter } from "@/components/public-shell";
import { CatalogBrowser } from "@/components/catalog-browser";
import { publicCatalog } from "@/server/catalog";

export const metadata = { title: "Browse invitations" };
export const dynamic = "force-dynamic";
export default async function TemplatesPage() {
  const templateRegistry = await publicCatalog();
  return (
    <>
      <PublicHeader />
      <main id="main-content" className="wrap catalog-page">
        <div className="catalog-intro">
          <span className="eyebrow">THE COLLECTION</span>
          <h1>
            Made for your kind
            <br />
            of celebration.
          </h1>
          <p className="lead">
            A first look at the invitations in our studio.
            <br />
            Open a preview and experience a design with sample names and
            details.
          </p>
        </div>
        <CatalogBrowser templates={templateRegistry} />
        <div className="collection-endnote">
          <span className="status-dot" /> Every preview is the invitation
          itself, filled with fictional details.
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
