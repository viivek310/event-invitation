import styles from "./scroll-cue.module.css";
import { RoyalArrow, RoyalMark } from "./royal-icons";

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
      role="note"
      aria-label={label}
      data-scroll-cue
    >
      <div className={styles.capsule}>
        <RoyalMark className={styles.ornament} />
        <span className={styles.text}>{text}</span>
        <RoyalMark className={styles.ornament} />
      </div>
      <span className={styles.arrowContainer} aria-hidden="true">
        <RoyalArrow direction="down" className={styles.arrow} />
      </span>
    </div>
  );
}
