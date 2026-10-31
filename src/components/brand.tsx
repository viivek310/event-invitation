import Link from "next/link";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Invitation Studio home">
      <span className="brand-mark" aria-hidden="true">
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18v13H3zM3 6l9 7 9-7M8 3h8" />
        </svg>
      </span>
      <span>
        Invitation<span className="brand-light">Studio</span>
      </span>
    </Link>
  );
}
