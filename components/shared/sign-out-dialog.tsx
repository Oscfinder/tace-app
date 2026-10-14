"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function SignOutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center sm:text-center">
          <span className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-[#FDECEC] text-tace-red">
            <LogOut className="size-5" />
          </span>
          <DialogTitle>Sign out?</DialogTitle>
          <DialogDescription>
            Do you want to sign out of your TACE account?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-center">
          <Button
            variant="outline"
            className="h-11 flex-1 sm:flex-none sm:px-6"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-11 flex-1 bg-tace-red text-white hover:bg-tace-red/90 sm:flex-none sm:px-6"
            disabled={pending}
            onClick={() => startTransition(() => signOut())}
          >
            {pending ? "Signing out..." : "Yes, sign out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
