import type { CSSProperties } from "react";

type IconName =
  | "arrow"
  | "grid"
  | "home"
  | "mail"
  | "settings"
  | "external"
  | "code"
  | "check"
  | "search"
  | "copy"
  | "monitor"
  | "phone"
  | "layers"
  | "chevron"
  | "clock"
  | "shield";
const paths: Record<IconName, string> = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  mail: "M3 5h18v14H3zM3 5l9 8 9-8",
  settings: "M4 7h16M4 17h16M8 4v6m8 4v6",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16",
  check: "m5 12 4 4L19 6",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  copy: "M8 8h13v13H8zM16 8V3H3v13h5",
  monitor: "M2 3h20v14H2zM8 21h8m-4-4v4",
  phone:
    "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1m3 17h4",
  layers: "m12 2 10 6-10 6L2 8zM2 12l10 6 10-6M2 16l10 6 10-6",
  chevron: "m9 5 7 7-7 7",
  clock: "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2",
  shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6zM8 12l3 3 5-6",
};
export function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
