"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { COMMITTEE_PREFERENCES, TRUSTEE_ROLES } from "@/lib/validations/auth";
import {
  activateMember,
  deactivateMember,
  updateMemberAssignment,
} from "@/lib/admin/members-actions";
import type { MemberRow } from "@/lib/admin/members";

type MemberType = "trustee" | "member";

export function MemberAssignmentPanel({ member }: { member: MemberRow }) {
  const router = useRouter();
  const [memberType, setMemberType] = useState<MemberType>(
    (member.member_type as MemberType) ?? "member",
  );
  const [committee, setCommittee] = useState(member.committee ?? "");
  const [trusteeRole, setTrusteeRole] = useState(member.trustee_role ?? "");
  const [submitting, setSubmitting] = useState<
    "activate" | "save" | "deactivate" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const assignment = {
    profileId: member.id,
    memberType,
    committee: committee || null,
    trusteeRole: trusteeRole || null,
  };

  async function handleActivate() {
    setSubmitting("activate");
    setError(null);
    const result = await activateMember(assignment);
    setSubmitting(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Member activated", type: "success" });
    router.refresh();
  }

  async function handleSave() {
    setSubmitting("save");
    setError(null);
    const result = await updateMemberAssignment(assignment);
    setSubmitting(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Changes saved", type: "success" });
    router.refresh();
  }

  async function handleDeactivate() {
    setSubmitting("deactivate");
    setError(null);
    const result = await deactivateMember(member.id);
    setSubmitting(null);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Member deactivated", type: "success" });
    router.refresh();
  }

  const isActive = member.status === "active";

  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
      <h2 className="font-heading text-base font-semibold text-tace-navy">
        {isActive ? "Committee & Role" : "Activation"}
      </h2>

      <div className="mt-4 flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Member Type
          </label>
          <Select
            value={memberType}
            onValueChange={(v) => v && setMemberType(v as MemberType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="trustee">Trustee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
            Committee
          </label>
          <Select
            value={committee}
            onValueChange={(v) => setCommittee(v ?? "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a committee" />
            </SelectTrigger>
            <SelectContent>
              {COMMITTEE_PREFERENCES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {memberType === "trustee" ? (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-tace-gray">
              Trustee Role
            </label>
            <Select
              value={trusteeRole}
              onValueChange={(v) => setTrusteeRole(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a trustee role" />
              </SelectTrigger>
              <SelectContent>
                {TRUSTEE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {error ? <p className="text-sm text-tace-red">{error}</p> : null}

        <div className="mt-1 flex flex-wrap gap-2.5">
          {isActive ? (
            <>
              <Button onClick={handleSave} disabled={submitting !== null}>
                {submitting === "save" ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={submitting !== null}
                className="border-tace-red/30 text-tace-red hover:bg-tace-red/10"
              >
                {submitting === "deactivate" ? "Deactivating..." : "Deactivate"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={submitting !== null}
              className="bg-tace-green text-white hover:bg-tace-green/90"
            >
              {submitting === "activate" ? "Activating..." : "Activate"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
