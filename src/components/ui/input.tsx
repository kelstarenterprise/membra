import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles with improved spacing
        "flex h-10 w-full rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm",
        "transition-all duration-200 ease-in-out",
        
        // Placeholder and text colors
        "placeholder:text-blue-400 text-blue-900",
        
        // Focus states with modern ring
        "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
        
        // Dark mode support
        "dark:border-blue-600 dark:bg-blue-900/20 dark:text-blue-100 dark:placeholder:text-blue-400",
        "dark:focus:border-blue-400 dark:focus:ring-blue-400/20",
        
        // Error states
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        "dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20",
        
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-blue-50",
        "dark:disabled:bg-blue-900/10",
        
        // File input styles
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-blue-900",
        "dark:file:text-blue-100",
        
        // Selection colors
        "selection:bg-blue-500 selection:text-white",
        
        // Shadow for depth
        "shadow-sm hover:shadow-md transition-shadow",
        
        className
      )}
      {...props}
    />
  )
}

export { Input }
