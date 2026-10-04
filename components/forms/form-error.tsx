export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-tace-red/30 bg-tace-red/10 px-3 py-2 text-sm text-tace-red"
    >
      {message}
    </div>
  );
}
