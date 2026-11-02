import { NotFoundState } from "@/components/shared/not-found-state";

// Inside a dashboard, "not found" leads back to sign-in, which sends a signed-in
// person straight to the right dashboard for their role.
export default function DashboardNotFound() {
  return <NotFoundState homeHref="/login" homeLabel="Back to my dashboard" />;
}
