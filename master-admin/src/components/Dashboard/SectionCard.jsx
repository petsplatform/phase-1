export default function SectionCard({ title, icon: Icon, iconColor = 'var(--primary)', children, badge }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-color)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="px-4 sm:px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex min-w-0 items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}15` }}>
            <Icon size={14} style={{ color: iconColor }} />
          </div>
          <h3 className="font-display font-semibold text-gray-800 text-sm truncate">{title}</h3>
        </div>
        {badge !== undefined && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: iconColor }}>
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
