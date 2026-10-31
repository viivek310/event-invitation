import Link from "next/link";
import { Brand } from "./brand";
import { Icon } from "./icon";

export function PublicHeader() {
  return (
    <header className="public-header wrap">
      <Brand />
      <nav aria-label="Main navigation">
        <Link href="/templates">Browse invitations</Link>
        <Link href="/#how-it-works">How it works</Link>
        <Link className="button outline small-button" href="/login">
          Customer login <Icon name="external" size={14} />
        </Link>
      </nav>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className="public-footer wrap">
      <div>
        <Brand />
        <p>Thoughtful invitations. Meaningful celebrations.</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/templates">Invitations</Link>
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/contact">Contact studio</Link>
        <Link href="/login">Sign in</Link>
      </nav>
      <span>INVITATION STUDIO · 2026</span>
    </footer>
  );
}
