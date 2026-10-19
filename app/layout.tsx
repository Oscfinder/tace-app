import type { Metadata } from "next";
import { headers } from "next/headers";
import { Quicksand } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${quicksand.variable} h-full antialiased`}>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <Toaster>{children}</Toaster>
        </TooltipProvider>
      </body>
    </html>
  );
}
