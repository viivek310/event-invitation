const structure = `src/
  app/
    templates/[templateSlug]/   Public invitation previews
    invite/[slug]/              Reserved customer links
    admin/                      Local development workspace
      invitations/              Customer invitations & RSVP management
      templates/                Template library & sandbox
    preview/royal-wedding/      Full-page design review
  templates/
    foundation/
      definition.ts             Metadata + fictional content
      renderer.tsx              The invitation component
    royal-wedding/
      definition.ts             Metadata & section schema
      renderer.tsx              The invitation component
      invitation.tsx            Royal Wedding interactive scenes
      date-scene.tsx            Scroll-driven date roll & countdown
      events-sequence.tsx       Ceremony sequences & navigation
      rsvp-review.tsx           RSVP design review
    registry.ts                 Template definitions
    renderers.ts                Executable template components
    types.ts                    Shared content and props`;

export default function ProjectSetup() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A clear foundation</p>
          <h1>
            Project setup<span className="brand-dot">.</span>
          </h1>
          <p>Where things live, what works now, and what we’ll build next.</p>
        </div>
        <span className="tag green">Next.js · App Router</span>
      </div>
      <div className="detail-grid">
        <section className="panel padded-panel">
          <h2>The template directory</h2>
          <p className="small">
            Each design owns its component and example data. Public previews use
            the actual template with fictional names.
          </p>
          <pre className="code-block">{structure}</pre>
        </section>
        <section className="panel padded-panel">
          <h2>Adding a template</h2>
          <ol className="section-list instructions">
            <li>
              Add a directory under <code>src/templates/</code>.
            </li>
            <li>
              Define the ID, metadata, sections, and dummy content in{" "}
              <code>definition.ts</code>.
            </li>
            <li>
              Build the invitation in <code>renderer.tsx</code>, accepting the
              shared template props.
            </li>
            <li>
              Register the definition and renderer in their respective registry
              files.
            </li>
            <li>
              Use status <code>preview</code> when implemented. Its public link
              becomes <code>/templates/your-template-id</code>.
            </li>
          </ol>
          <p className="notice">
            Royal Wedding stays planned until we finish discussing its design.
            No production publishing controls are enabled.
          </p>
        </section>
      </div>
      <section className="panel padded-panel roadmap-panel">
        <h2>Development roadmap</h2>
        <div className="roadmap-grid">
          <div>
            <span className="tag green">Done</span>
            <h3>The app foundation</h3>
            <p>
              Public catalog, working invitation previews, typed registry, and
              local admin workspace.
            </p>
          </div>
          <div>
            <span className="tag green">Done</span>
            <h3>Royal Wedding design</h3>
            <p>
              Complete sealed envelope, Ganeshji blessing, couple folio, date
              slot reel, ceremony cards, and family closing.
            </p>
          </div>
          <div>
            <span className="tag warm">Now</span>
            <h3>Customer workflow</h3>
            <p>
              Interactive invitations management, offline cash collection,
              custom slugs, and RSVP guest list tracking with CSV exports.
            </p>
          </div>
          <div>
            <span className="tag">Next</span>
            <h3>Persistence & Database</h3>
            <p>
              Connect PostgreSQL in Docker, customer login, password setup, and
              permanent database-backed publication.
            </p>
          </div>
        </div>
      </section>
      <p className="small">
        Next.js runs on the host. There is currently no database, file database,
        localStorage persistence, or deployment configuration.
      </p>
    </>
  );
}
