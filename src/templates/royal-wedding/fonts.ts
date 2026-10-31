import { Cormorant_Garamond, Manrope } from "next/font/google";

export const royalDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--royal-display",
});
export const royalBody = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--royal-body",
});
