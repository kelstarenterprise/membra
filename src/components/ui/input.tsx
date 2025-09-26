import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles with improved spacing
        "flex h-10 w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm",
        "transition-all duration-200 ease-in-out",
        
        // Placeholder and text colors
        "placeholder:text-muted-foreground text-foreground",
        
        // Focus states with modern ring
        "focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none",
        
        // Dark mode support
        "dark:border-border dark:bg-input dark:text-foreground dark:placeholder:text-muted-foreground",
        "dark:focus:border-ring dark:focus:ring-ring/20",
        
        // Error states
        "aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500/20",
        "dark:aria-invalid:border-red-400 dark:aria-invalid:ring-red-400/20",
        
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        "dark:disabled:bg-muted",
        
        // File input styles
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "dark:file:text-foreground",
        
        // Selection colors
        "selection:bg-accent selection:text-accent-foreground",
        
        // Shadow for depth
        "shadow-sm hover:shadow-md transition-shadow",
        
        className
      )}
      {...props}
    />
  )
}

export { Input }
