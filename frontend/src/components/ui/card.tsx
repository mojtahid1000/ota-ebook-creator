import { HTMLAttributes } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  hoverable?: boolean;
}

export function Card({
  selected,
  hoverable = true,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl border p-6 transition-all duration-200",
        hoverable && "hover:shadow-md cursor-pointer",
        selected
          ? "border-ota-orange ring-2 ring-ota-orange/20 shadow-md"
          : "border-slate-200 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
