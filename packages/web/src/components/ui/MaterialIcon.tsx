interface MaterialIconProps {
  icon: string;
  className?: string;
  filled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses: Record<NonNullable<MaterialIconProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function MaterialIcon({
  icon,
  className = "",
  filled = false,
  size = "md",
}: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${sizeClasses[size]} ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {icon}
    </span>
  );
}
