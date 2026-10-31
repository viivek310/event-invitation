import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="centered-page">
      <span className="ornament" aria-hidden="true">
        ✧
      </span>
      <p className="eyebrow">404 · Not available</p>
      <h1>This page isn’t here.</h1>
      <p>The link may be incorrect, or the invitation is not available.</p>
      <Link className="button primary" href="/templates">
        Explore the collection <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
