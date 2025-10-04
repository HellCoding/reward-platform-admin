"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
            checked ? "bg-blue-600" : "bg-gray-200",
            "focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2",
            className
          )}
        >
          <div
            className={cn(
              "absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ease-in-out shadow-md",
              checked ? "translate-x-5" : "translate-x-0"
            )}
          />
        </div>
      </label>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
