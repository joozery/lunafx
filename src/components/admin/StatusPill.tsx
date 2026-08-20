const STATUS_MAP: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  pending:   { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-400",   label: "รอดำเนินการ" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "สำเร็จ" },
  failed:    { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     label: "ล้มเหลว" },
  active:    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "ใช้งาน" },
  suspended: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     label: "ระงับ" },
  cancelled: { bg: "bg-gray-100",   text: "text-gray-600",    border: "border-gray-200",    dot: "bg-gray-400",    label: "ยกเลิก" },
  approved:  { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500",    label: "อนุมัติ" },
  rejected:  { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     label: "ปฏิเสธ" },
};

export function StatusPill({ status }: { status?: string }) {
  const s = status ?? "unknown";
  const style = STATUS_MAP[s] ?? {
    bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400", label: s,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
