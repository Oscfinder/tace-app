import { Check, X } from "lucide-react";
import { calculateAge } from "@/lib/age";
import type { ApplicationRow } from "@/lib/admin/applications";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-6">
      <h2 className="font-heading text-base font-semibold text-tace-navy">
        {title}
      </h2>
      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Item({
  label,
  value,
  full,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <div className="text-xs font-semibold uppercase tracking-wide text-tace-gray/70">
        {label}
      </div>
      <div className="mt-0.5 text-sm text-tace-navy">
        {value === null || value === undefined || value === "" ? (
          <span className="text-tace-gray/50">—</span>
        ) : (
          value
        )}
      </div>
    </div>
  );
}

function ListValue({ items }: { items: string[] | null }) {
  if (!items || items.length === 0) return null;
  return <>{items.join(", ")}</>;
}

function ConsentRow({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <Check className="size-4 shrink-0 text-tace-green" />
      ) : (
        <X className="size-4 shrink-0 text-tace-red" />
      )}
      <span className={checked ? "text-tace-navy" : "text-tace-gray"}>
        {label}
      </span>
    </div>
  );
}

const APPLICANT_TYPE_LABELS: Record<string, string> = {
  self: "Self (the child/young adult is applying directly)",
  guardian: "Guardian applying on the child's behalf",
  organisation: "Organisation referral",
};

export function ApplicationDetailSections({
  application: a,
}: {
  application: ApplicationRow;
}) {
  return (
    <div className="flex flex-col gap-5">
      <Section title="Who's Applying">
        <Item
          label="Applicant Type"
          value={
            a.applicant_type
              ? (APPLICANT_TYPE_LABELS[a.applicant_type] ?? a.applicant_type)
              : null
          }
          full
        />
      </Section>

      <Section title="Child's Personal Info">
        <Item label="First Name" value={a.child_first_name} />
        <Item label="Last Name" value={a.child_last_name} />
        <Item
          label="Date of Birth"
          value={`${new Date(a.child_dob).toLocaleDateString("en-GB")} (${calculateAge(a.child_dob)} yrs)`}
        />
        <Item label="Gender" value={a.child_gender} />
        <Item label="Nationality" value={a.child_nationality} />
        <Item label="State" value={a.child_state} />
        <Item label="Address" value={a.child_address} full />
        <Item label="Phone" value={a.child_phone} />
        <Item label="Email" value={a.child_email} />
      </Section>

      {a.applicant_type === "guardian" ? (
        <Section title="Guardian Info">
          <Item label="Name" value={a.guardian_name} />
          <Item label="Relationship" value={a.guardian_relationship} />
          <Item label="Phone" value={a.guardian_phone} />
          <Item label="Email" value={a.guardian_email} />
          <Item label="Occupation" value={a.guardian_occupation} />
          <Item label="Address" value={a.guardian_address} full />
        </Section>
      ) : null}

      {a.applicant_type === "organisation" ? (
        <Section title="Organisation Info">
          <Item label="Organisation Name" value={a.org_name} />
          <Item label="Contact Name" value={a.org_contact_name} />
          <Item label="Contact Role" value={a.org_contact_role} />
          <Item label="Phone" value={a.org_phone} />
          <Item label="Email" value={a.org_email} />
          <Item label="Identification" value={a.org_identification} full />
        </Section>
      ) : null}

      <Section title="Educational Background">
        <Item label="Education Status" value={a.edu_status} />
        <Item label="School Name" value={a.school_name} />
        <Item label="Class Level" value={a.class_level} />
        <Item label="School Address" value={a.school_address} />
        <Item label="Academic Performance" value={a.academic_performance} full />
        <Item
          label="Learning Difficulties"
          value={a.learning_difficulties}
          full
        />
      </Section>

      <Section title="Family & Household">
        <Item label="Living Situation" value={a.living_situation} />
        <Item label="Siblings Count" value={a.siblings_count} />
        <Item label="Household Income" value={a.household_income} />
        <Item label="Challenges" value={<ListValue items={a.challenges} />} full />
      </Section>

      <Section title="Support Needed">
        <Item
          label="Support Types"
          value={<ListValue items={a.support_types} />}
          full
        />
        <Item label="Description" value={a.support_description} full />
      </Section>

      <Section title="Interests & Aspirations">
        <Item label="Interests" value={a.interests} />
        <Item label="Aspirations" value={a.aspirations} />
        <Item label="Subjects / Skills" value={a.subjects_skills} />
        <Item label="Talents" value={a.talents} />
      </Section>

      <Section title="Health Information">
        <Item label="Health Conditions" value={a.health_conditions} full />
        <Item label="Disabilities" value={a.disabilities} full />
        <Item label="Current Treatment" value={a.current_treatment} full />
      </Section>

      <Section title="Consent & Declaration">
        <div className="sm:col-span-2 flex flex-col gap-2">
          <ConsentRow
            label="Consent to share information"
            checked={a.consent_information}
          />
          <ConsentRow
            label="Consent to be contacted"
            checked={a.consent_contact}
          />
          <ConsentRow
            label="Consent to assessment"
            checked={a.consent_assessment}
          />
          <ConsentRow
            label="Acknowledges no guarantee of support"
            checked={a.consent_no_guarantee}
          />
          <ConsentRow
            label="Consent to photography/publicity"
            checked={a.consent_photography}
          />
        </div>
        <Item label="Declarant Name" value={a.declarant_name} />
        <Item
          label="Declared At"
          value={
            a.declared_at ? new Date(a.declared_at).toLocaleString("en-GB") : null
          }
        />
      </Section>
    </div>
  );
}
