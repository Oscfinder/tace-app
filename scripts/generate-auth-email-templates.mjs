// Writes the Supabase auth email templates (confirm sign-up, reset password) into
// docs/email-templates/ from lib/email/templates.ts, so the pasted copy always
// matches the code. Run after changing those two templates:
//   node scripts/generate-auth-email-templates.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { allSamples } = await import(pathToFileURL(path.join(root, "lib/email/templates.ts")).href);
const out = path.join(root, "docs/email-templates");
fs.mkdirSync(out, { recursive: true });

for (const s of allSamples({ siteUrl: "{{ .SiteURL }}", supportEmail: undefined })) {
  if (s.key !== "confirmSignup" && s.key !== "resetPassword") continue;
  const name = s.key === "confirmSignup" ? "confirm-signup" : "reset-password";
  fs.writeFileSync(path.join(out, `${name}.html`), s.email.html);
  fs.writeFileSync(path.join(out, `${name}.subject.txt`), s.email.subject + "\n");
  console.log("wrote", name);
}
