import { DM_Sans, Manrope } from "next/font/google";

// Shared by the member and beneficiary dashboards (next/font must be called
// at module scope, so the instances live here and are imported by layouts).
export const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
