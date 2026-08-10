const STATUS_MAP = {
  open: { label: '영업중', dot: 'bg-status-open', text: 'text-status-open', bg: 'bg-status-open/10' },
  closed: { label: '휴무', dot: 'bg-status-closed', text: 'text-status-closed', bg: 'bg-status-closed/10' },
  soldout: { label: '재료소진', dot: 'bg-status-soldout', text: 'text-status-soldout', bg: 'bg-status-soldout/10' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.open
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
