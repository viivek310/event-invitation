import styles from "./scroll-cue.module.css";

export interface ScrollCueProps {
  label?: string;
  text?: string;
  className?: string;
}

export function ScrollCue({
  label = "Scroll to continue",
  text = "Scroll to continue",
  className,
}: ScrollCueProps) {
  return (
    <div
      className={`${styles.cue} ${className ?? ""}`.trim()}
      role="status"
      aria-label={label}
      data-scroll-cue
    >
      <div className={styles.capsule}>
        <span className={styles.ornament} aria-hidden="true">
          ✦
        </span>
        <span className={styles.text}>{text}</span>
        <span className={styles.ornament} aria-hidden="true">
          ✦
        </span>
      </div>
      <span className={styles.arrowContainer} aria-hidden="true">
        <svg
          className={styles.arrow}
          viewBox="0 0 16 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 2.5v11m-4-4L8 13.5l4-4"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
