import Image from "next/image";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getMentorContext } from "@/lib/mentor/queries";
import { CODE_OF_CONDUCT, CODE_OF_CONDUCT_IS_DRAFT } from "@/lib/mentoring/code-of-conduct";
import { CodeOfConductForm } from "@/components/mentor/code-of-conduct-form";

export const metadata = { title: "Mentor code of conduct | TACE Foundation" };

// Deliberately outside the (app) group: no menu, and it is the only mentor
// page a mentor can open until they have accepted.
export default async function CodeOfConductPage() {
  const ctx = await getMentorContext();
  if (!ctx) redirect("/login");
  if (ctx.codeAcceptedAt) redirect("/dashboard/mentor");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2.5">
        <Image
          src="/images/tace-icon.png"
          alt=""
          width={96}
          height={96}
          priority
          className="size-10 object-contain"
        />
        <span className="m-head text-base font-extrabold text-m-ink">TACE Foundation</span>
      </div>

      <section className="rounded-[22px] border border-m-line bg-white p-6 shadow-m-card sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e5f6ff] text-m-blue">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="m-head mt-4 text-[26px] font-extrabold tracking-[-0.8px] text-m-ink">
          Mentor code of conduct
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-m-muted">
          Welcome, {ctx.fullName.split(" ")[0]}. Before you work with a child, please read and agree
          to the rules that keep every child safe. You can&apos;t use the mentor area until you do.
        </p>
        {CODE_OF_CONDUCT_IS_DRAFT ? (
          <p className="mt-3 inline-block rounded-lg bg-[#fff4dc] px-3 py-1.5 text-xs font-semibold text-[#8a5d00]">
            Draft wording, pending legal review
          </p>
        ) : null}

        <ol className="mt-6 flex flex-col gap-3">
          {CODE_OF_CONDUCT.map((rule, i) => (
            <li key={rule.title} className="flex gap-3 rounded-2xl bg-[#f6f9fd] p-4">
              <span className="m-head grid size-8 shrink-0 place-items-center rounded-full bg-m-blue text-sm font-extrabold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="m-head text-[16px] font-extrabold text-m-ink">{rule.title}</h2>
                <p className="mt-0.5 text-[15px] leading-relaxed text-[#4d6584]">{rule.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-7 border-t border-[#eff3f7] pt-6">
          <CodeOfConductForm fullName={ctx.fullName} />
        </div>
      </section>
    </main>
  );
}
