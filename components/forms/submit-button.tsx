import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({
  loading,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { loading?: boolean }) {
  return (
    <Button disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
