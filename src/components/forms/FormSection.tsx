import React from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function FormSection({
  title,
  subtitle,
  children,
  className,
  titleClassName,
  contentClassName,
  collapsible = false,
  defaultCollapsed = false,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && (
            <div 
              className={cn(
                "flex items-center justify-between",
                collapsible && "cursor-pointer",
                titleClassName
              )}
              onClick={handleToggle}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              {collapsible && (
                <svg
                  className={cn(
                    "h-5 w-5 text-gray-500 transition-transform duration-200",
                    isCollapsed && "rotate-180"
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </div>
          )}
          
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          
          {/* Divider line */}
          <div className="pt-2">
            <div className="border-b border-gray-200 dark:border-gray-700" />
          </div>
        </div>
      )}
      
      {/* Content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed && collapsible
            ? "max-h-0 overflow-hidden opacity-0"
            : "max-h-none opacity-100",
          contentClassName
        )}
      >
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface FormContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function FormContainer({ 
  children, 
  className, 
  maxWidth = "2xl" 
}: FormContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg", 
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full"
  };

  return (
    <div className={cn(
      "mx-auto w-full space-y-8 p-6",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right" | "between";
  sticky?: boolean;
}

export function FormActions({ 
  children, 
  className, 
  align = "left",
  sticky = false 
}: FormActionsProps) {
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between"
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 pt-6 mt-8 border-t border-gray-200 dark:border-gray-700",
        alignClasses[align],
        sticky && "sticky bottom-0 bg-white dark:bg-gray-900 pb-6 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}