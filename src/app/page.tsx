import Link from "next/link";
import { PublicHeader, PublicFooter } from "@/components/public-shell";
import { TemplateCard } from "@/components/template-card";
import { publicCatalog } from "@/server/catalog";
import { Showcase } from "@/components/showcase";
import { Icon } from "@/components/icon";

export const dynamic = "force-dynamic";
export default async function Home() {
  const templateRegistry = await publicCatalog();
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="hero-badge">
              <span className="status-dot" /> A better way to invite
            </span>
            <h1>
              Your celebration.
              <br />
              One beautiful <span>link.</span>
            </h1>
            <p className="hero-description">
              An invitation that feels like you. Discover a design, explore the
              experience, and give your favourite people something special to
              open.
            </p>
            <div className="button-row">
              <Link className="button primary" href="/templates">
                Find your invitation <Icon name="arrow" size={17} />
              </Link>
              <Link
                className="button outline"
                href="/templates"
              >
                Explore a preview <Icon name="external" size={15} />
              </Link>
            </div>
            <div className="hero-footnote">
              <span>
                <Icon name="check" size={14} /> Opens on any device
              </span>
              <span>
                <Icon name="check" size={14} /> No guest signup
              </span>
            </div>
          </div>
          <Showcase />
        </section>
        <section
          className="value-strip wrap"
          aria-label="The invitation experience"
        >
          <div>
            <Icon name="layers" />
            <span>Distinctive designs</span>
            <p>A style for your celebration.</p>
          </div>
          <div>
            <Icon name="phone" />
            <span>Made for mobile</span>
            <p>Beautiful on the screen in their hand.</p>
          </div>
          <div>
            <Icon name="external" />
            <span>Simply share a link</span>
            <p>Easy to open. Easy to pass along.</p>
          </div>
        </section>
        <section className="wrap collection-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE INVITATION COLLECTION</p>
              <h2>Find the one that feels like you.</h2>
              <p>Open an invitation and explore it with sample details.</p>
            </div>
            <Link className="button outline" href="/templates">
              Browse collection <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="template-grid">
            {templateRegistry.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
            <div className="collection-note-card">
              <span className="note-icon">
                <Icon name="layers" size={25} />
              </span>
              <h3>
                Different celebrations.
                <br />
                Different expressions.
              </h3>
              <p>
                Our collection is growing. Every invitation gets its own visual
                world, while the experience stays easy to use.
              </p>
              <span className="small-label">
                MORE DESIGNS, THOUGHTFULLY MADE
              </span>
            </div>
          </div>
        </section>
        <section className="how-section wrap" id="how-it-works">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FROM FIRST LOOK TO FIRST GUEST</p>
              <h2>A simpler way to share your day.</h2>
            </div>
            <p className="section-note">
              A personal service, from choosing a design to sharing your
              invitation.
            </p>
          </div>
          <div className="steps">
            <div>
              <span>01</span>
              <h3>Explore the collection</h3>
              <p>
                Open a preview and see the full invitation before choosing your
                design.
              </p>
            </div>
            <div>
              <span>02</span>
              <h3>Make it your own</h3>
              <p>
                Share your names, dates, and celebration details with us. We
                take care of the invitation.
              </p>
            </div>
            <div>
              <span>03</span>
              <h3>Send something special</h3>
              <p>
                Once your invitation is ready and activated, send your unique
                link to the people who matter.
              </p>
            </div>
          </div>
        </section>
        <section className="contact-band wrap">
          <div>
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>
              Give your good news
              <br />a beautiful beginning.
            </h2>
          </div>
          <Link className="button primary" href="/templates">
            Explore invitations <Icon name="arrow" size={17} />
          </Link>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
