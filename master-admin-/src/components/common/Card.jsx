import { motion } from "framer-motion";

export default function Card({
  children,
  className = "",
  hover = false,
  padding = "p-5",
}) {
  return (
    <motion.div
      whileHover={
        hover ? { y: -2, boxShadow: "0 14px 36px rgba(23,52,95,0.12)" } : {}
      }
      transition={{ duration: 0.2 }}
      className={`bg-[var(--card-bg)] rounded-xl border ${padding} ${className}`}
      style={{
        borderColor: "var(--border-color)",
        boxShadow: "var(--admin-shadow)",
      }}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "var(--primary)",
  trend,
}) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 16px 38px rgba(23,52,95,0.12)" }}
      transition={{ duration: 0.2 }}
      className="bg-[var(--card-bg)] rounded-xl border p-4 sm:p-5 flex items-start justify-between cursor-default h-full min-w-0"
      style={{
        borderColor: "var(--border-color)",
        boxShadow: "var(--admin-shadow)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium mb-1 truncate">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-display font-bold text-[var(--text-primary)] truncate">
          {value}
        </p>
        {sub && <p className="text-xs text-[var(--text-soft)] mt-1 truncate">{sub}</p>}
        {trend && (
          <p
            className={`text-xs font-medium mt-1 ${trend > 0 ? "text-emerald-600" : "text-red-500"}`}
          >
            {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% this month
          </p>
        )}
      </div>
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ml-3"
        style={{ background: `${color}18` }}
      >
        <Icon size={19} style={{ color }} />
      </div>
    </motion.div>
  );
}
