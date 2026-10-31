import styles from "./royal-corners.module.css";

export function RoyalCorners() {
  return (
    <div className={styles.frame} aria-hidden="true">
      {[0, 1, 2, 3].map((corner) => (
        <svg
          key={corner}
          viewBox="0 0 72 72"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 65V24C5 13.5 13.5 5 24 5h41" strokeWidth=".85" />
          <path
            d="M11 58V26c0-8.3 6.7-15 15-15h32"
            strokeWidth=".55"
            opacity=".6"
          />
          <path
            d="M18 18c15-2 27 7 29 22-15 2-27-7-29-22Zm0 0c1 13 12 25 25 29"
            strokeWidth=".75"
          />
          <path
            d="M24 12c4 7 6 15 5 22M12 24c7 4 15 6 22 5M44 44l9 9"
            strokeWidth=".6"
            opacity=".75"
          />
          <path
            d="m18 14 4 4-4 4-4-4Zm35 36 3 3-3 3-3-3Z"
            fill="currentColor"
            stroke="none"
          />
          <path d="M5 54v11h11M54 5h11v11" strokeWidth="1.15" />
        </svg>
      ))}
    </div>
  );
}
