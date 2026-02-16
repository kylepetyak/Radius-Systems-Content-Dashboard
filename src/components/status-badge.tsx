const statusConfig = {
  to_film: { label: "To Film", color: "#f59e0b", bg: "#451a03", ring: "#92400e" },
  filming: { label: "Filming", color: "#3b82f6", bg: "#172554", ring: "#1e40af" },
  in_review: { label: "In Review", color: "#a78bfa", bg: "#2e1065", ring: "#6d28d9" },
  published: { label: "Published", color: "#34d399", bg: "#022c22", ring: "#065f46" },
};

export type ContentStatus = keyof typeof statusConfig;

export { statusConfig };

export function StatusBadge({ status }: { status: ContentStatus }) {
  const s = statusConfig[status];
  return (
    <span
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.ring}` }}
      className="px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5"
    >
      <span style={{ background: s.color }} className="w-1.5 h-1.5 rounded-full" />
      {s.label}
    </span>
  );
}
