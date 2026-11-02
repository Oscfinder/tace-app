import type { Metadata } from "next";
import { headers } from "next/headers";
import { Quicksand } from "next/font/google";
import localFont from "next/font/local";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// General Sans (Fontshare, free for commercial use under the ITF Free Font
// License), served from our own server: no render-blocking request to another
// site, and no visitor IP address sent to a third party. See app/fonts/README.md.
const generalSans = localFont({
  variable: "--font-general-sans",
  display: "swap",
  src: [
    { path: "./fonts/general-sans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/general-sans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/general-sans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/general-sans-700.woff2", weight: "700", style: "normal" },
  ],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "TACE Welfare Foundation",
  description: "Guiding Children Toward Independence",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Reading the request headers makes every page render per request, which the
  // Content-Security-Policy needs: its script nonce is different on each load,
  // so a page built ahead of time (with no nonce) would have its scripts blocked.
  await headers();
  return (
    <html lang="en" className={`${quicksand.variable} ${generalSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </body>
    </html>
  );
}
