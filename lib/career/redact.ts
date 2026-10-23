// The career quiz asks children for a sentence or two in their own words. A child
// may type their name, school, phone number or social media name without
// thinking. Before ANY of that text is sent to the AI provider it is cleaned:
// contact details and links are removed, and so are the child's own names and
// the words in `extraTerms` (for example their school). What the child actually
// typed is still saved, unchanged, in their own account.

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const LINK = /(https?:\/\/|www\.)\S+/gi;
const DOMAIN = /\b[a-z0-9-]+\.(com|ng|org|net|co|io|me|app|info|biz|xyz)\b/gi;
const HANDLE = /(^|\s)@[a-z0-9._]{3,}/gi;
const PHONE = /(\+?\d[\s().-]?){7,}/g;
const APP_NAME = /\b(whatsapp|telegram|instagram|snapchat|tiktok|signal|facebook)\b/gi;

// Replaces every occurrence of `term` (any letter case) without building a regular
// expression from text a child or admin typed.
function removeTerm(text: string, term: string): string {
  const lowerTerm = term.toLowerCase();
  let out = "";
  let from = 0;
  for (;;) {
    const at = text.toLowerCase().indexOf(lowerTerm, from);
    if (at === -1) return out + text.slice(from);
    out += text.slice(from, at) + "[removed]";
    from = at + term.length;
  }
}

export function redactReflection(text: string, personalTerms: (string | null | undefined)[] = []): string {
  let out = text
    .replace(EMAIL, "[removed]")
    .replace(LINK, "[removed]")
    .replace(DOMAIN, "[removed]")
    .replace(HANDLE, "$1[removed]")
    .replace(PHONE, "[removed] ")
    .replace(APP_NAME, "[removed]");
  for (const term of personalTerms) {
    const t = (term ?? "").trim();
    if (t.length < 2) continue;
    out = removeTerm(out, t);
  }
  return out.replace(/(\[removed\][\s,.;:]*){2,}/g, "[removed] ").replace(/ {2,}/g, " ").trim();
}
