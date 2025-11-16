import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "bg-green-500/20 text-green-400 border-green-500/30": variant === "default",
          "bg-gray-500/20 text-gray-400 border-gray-500/30": variant === "secondary",
          "bg-red-500/20 text-red-400 border-red-500/30": variant === "destructive",
          "border-white/20 text-white": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

