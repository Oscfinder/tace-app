// Anything a person typed (a name, a reason, a purpose) must be escaped before
// it goes into an email's HTML, or a name like <a href="...">click</a> becomes
// a live link in a message sent from the foundation's own address.
export function escapeHtml(value: string | null | undefined): string {
  return (value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
