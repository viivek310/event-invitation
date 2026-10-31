import Link from "next/link";
import { TemplateArtwork } from "./template-artwork";
import { Icon } from "./icon";

export function Showcase() {
  return (
    <div className="showcase">
      <div className="showcase-window">
        <div className="showcase-window-bar">
          <span className="window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>
            <Icon name="shield" size={10} /> invitationstudio / preview
          </span>
          <Icon name="external" size={11} />
        </div>
        <div className="showcase-content">
          <div className="showcase-heading">
            <span className="mini-label">
              YOUR INVITATION, BEAUTIFULLY SHARED
            </span>
            <span className="showcase-live">
              <span className="status-dot" /> Sample preview
            </span>
          </div>
          <div className="showcase-art">
            <TemplateArtwork />
          </div>
          <div className="showcase-bottom">
            <div>
              <strong>Aarav & Meera</strong>
              <span>21 February 2027 · Jaipur</span>
            </div>
            <Link
              href="/templates"
              aria-label="Open the sample invitation"
            >
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </div>
      <div className="showcase-floating">
        <span className="floating-icon">
          <Icon name="mail" size={20} />
        </span>
        <div>
          <strong>One link. All your people.</strong>
          <span>Made to open on any device.</span>
        </div>
        <Icon name="check" size={16} />
      </div>
      <span className="showcase-note">
        An invitation experience, not another attachment.
      </span>
    </div>
  );
}
