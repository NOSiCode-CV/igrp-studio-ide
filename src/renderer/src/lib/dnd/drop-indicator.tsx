"use client"

import { cn } from "@renderer/lib/utils"

interface DropIndicatorProps {
  position: "top" | "bottom" | "left" | "right"
  isActive: boolean
  className?: string
}

export function DropIndicator({ position, isActive, className }: DropIndicatorProps) {
  return (
    <div
      className={cn(
        "absolute transition-all",
        {
          // Vertical positions
          "-top-1 left-0 right-0 h-1": position === "top",
          "-bottom-1 left-0 right-0 h-1": position === "bottom",
          // Horizontal positions
          "-left-1 top-0 bottom-0 w-1": position === "left",
          "-right-1 top-0 bottom-0 w-1": position === "right",
        },
        isActive ? "scale-100" : position === "left" || position === "right" ? "scale-x-0" : "scale-y-0",
        "flex items-center justify-center",
        className,
      )}
    >
      <div
        className={cn(
          "bg-primary rounded-full shadow-[0_0_4px_2px_rgba(var(--primary)_/_0.25)]",
          position === "left" || position === "right" ? "w-1 h-full" : "h-1 w-full",
        )}
      />
    </div>
  )
}

