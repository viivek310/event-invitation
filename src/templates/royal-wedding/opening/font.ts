import localFont from "next/font/local";

export const royalGujarati = localFont({
  src: "./fonts/NotoSerifGujarati.ttf",
  weight: "100 900",
  style: "normal",
  display: "swap",
  preload: true,
  fallback: ["Nirmala UI", "serif"],
});
