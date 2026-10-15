import { dmSans, manrope } from "@/lib/dashboard-fonts";

// Theme wrapper only. The code-of-conduct gate and the navigation live in the
// (app) group below, so the code-of-conduct screen itself shows no menu and
// nothing else is reachable until it is accepted.
export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`member-theme ${manrope.variable} ${dmSans.variable} min-h-screen bg-m-bg`}
    >
      {children}
    </div>
  );
}
