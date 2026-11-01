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
          <path d="M6 66V25C6 14.5 14.5 6 25 6h41" strokeWidth="1.1" />
          <path d="M12 58V27c0-8.3 6.7-15 15-15h31" strokeWidth=".65" opacity=".5" />
          <path d="M19 48V30c0-6.1 4.9-11 11-11h18" strokeWidth=".8" opacity=".7" />
          <path d="M22 22h18M22 22v18m1-17 19 19m-18-18 19 8m-19-8 8 19"
            strokeWidth=".65" opacity=".65" />
          <path d="m22 16 6 6-6 6-6-6Z" strokeWidth=".9" />
          <path d="m22 20 2 2-2 2-2-2Z" fill="currentColor" stroke="none" />
          <path d="M6 53v13h13M53 6h13v13" strokeWidth="1.3" />
          <path d="m46 43 3 3-3 3-3-3Z" strokeWidth=".7" opacity=".7" />
        </svg>
      ))}
    </div>
  );
}
