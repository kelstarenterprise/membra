"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Base typography with improved spacing and purple color
        "block text-sm font-semibold leading-6 text-primary",
        "select-none mb-2",
        
        // Dark mode support
        "dark:text-primary",
        
        // Disabled states
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        
        className
      )}
      {...props}
    />
  )
}

export { Label }
