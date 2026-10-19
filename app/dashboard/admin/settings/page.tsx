import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/guards";
import { getFoundationSettings } from "@/lib/site-settings";
import {
  FoundationForm,
  InviteAdminForm,
  PhotoCleanupButton,
  ResetTwoFactorButton,
} from "@/components/admin/settings/settings-forms";

const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";

export default async function SettingsPage() {
  const supabase = await createClient();
  const me = (await getSession())?.user.id;
  const [settings, { data: admins }] = await Promise.all([
    getFoundationSettings(),
    supabase
      .from("profiles")
      .select("id, full_name, email, status, created_at")
      .eq("role", "admin")
      .order("created_at"),
  ]);
  const adminList = admins ?? [];

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">Settings</h1>
        <p className="mt-1 text-sm text-tace-gray">
          Foundation details, administrators and housekeeping.
        </p>
      </div>

      <section className={card} aria-labelledby="found-h">
        <h2 id="found-h" className="font-heading text-base font-semibold text-tace-navy">
          Foundation details
        </h2>
        <p className="mt-1 mb-4 text-sm text-tace-gray">
          These are public. The donate page and the sponsor bank card both read
          them from here. Never enter a password or an API key.
        </p>
        <FoundationForm initial={settings} />
      </section>

      <section className={card} aria-labelledby="admins-h">
        <h2 id="admins-h" className="font-heading text-base font-semibold text-tace-navy">
          Administrators
        </h2>
        <ul className="mt-3 divide-y divide-[#f1f3f6]">
          {adminList.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <span>
                <b className="text-tace-navy">{a.full_name}</b>
                <span className="ml-2 text-tace-gray">{a.email}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-xs font-semibold text-tace-gray capitalize">{a.status}</span>
                {a.id !== me ? <ResetTwoFactorButton profileId={a.id} name={a.full_name} /> : null}
              </span>
            </li>
          ))}
        </ul>
        {adminList.length < 2 ? (
          <p role="status" className="mt-3 rounded-lg bg-[#fff5d9] px-4 py-3 text-sm text-[#7a5a00]">
            Only one administrator exists. Invite a second one so access is not
            tied to a single person.
          </p>
        ) : null}
        <h3 className="mt-5 mb-3 text-sm font-bold text-tace-navy">Invite an administrator</h3>
        <InviteAdminForm />
      </section>

      <section className={card} aria-labelledby="clean-h">
        <h2 id="clean-h" className="font-heading text-base font-semibold text-tace-navy">
          Unused application photos
        </h2>
        <p className="mt-1 mb-4 text-sm text-tace-gray">
          Photos uploaded to an application that was never submitted are removed
          automatically every night once they are more than 7 days old. You can
          also run it now.
        </p>
        <PhotoCleanupButton />
      </section>
    </div>
  );
}
