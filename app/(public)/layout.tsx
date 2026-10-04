import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { StickyDonate } from "@/components/public/sticky-donate";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <StickyDonate />
    </>
  );
}
