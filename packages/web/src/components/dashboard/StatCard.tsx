import { MaterialIcon } from "../ui/MaterialIcon.js";

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export function StatCard({
  label,
  value,
  icon,
  color = "text-on-surface",
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-surface-container-low p-4 border border-outline-variant/10">
      <span className="font-label text-on-surface-variant text-[0.6rem] uppercase tracking-widest block mb-2">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className={`font-headline font-black text-2xl ${color}`}>
          {value}
        </span>
        {icon && (
          <MaterialIcon icon={icon} size="sm" className={color} />
        )}
        {subtitle && (
          <span className="font-label text-on-surface-variant text-[0.55rem] uppercase tracking-widest">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
