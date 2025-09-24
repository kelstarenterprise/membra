"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const bannerVariants = cva(
  "relative w-full border-l-4 p-4 shadow-sm transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: 
          "bg-blue-50 border-l-blue-400 text-blue-800 dark:bg-blue-900/20 dark:border-l-blue-400 dark:text-blue-200",
        success:
          "bg-green-50 border-l-green-400 text-green-800 dark:bg-green-900/20 dark:border-l-green-400 dark:text-green-200",
        destructive:
          "bg-red-50 border-l-red-400 text-red-800 dark:bg-red-900/20 dark:border-l-red-400 dark:text-red-200",
        warning:
          "bg-amber-50 border-l-amber-400 text-amber-800 dark:bg-amber-900/20 dark:border-l-amber-400 dark:text-amber-200",
        info: 
          "bg-blue-50 border-l-blue-400 text-blue-800 dark:bg-blue-900/20 dark:border-l-blue-400 dark:text-blue-200",
      },
      size: {
        sm: "p-3 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Icon component for different banner types
const BannerIcon: React.FC<{ variant?: string; className?: string }> = ({ 
  variant, 
  className 
}) => {
  const iconClassName = cn("h-5 w-5 shrink-0", className);
  
  switch (variant) {
    case "success":
      return <CheckCircle className={cn(iconClassName, "text-green-600 dark:text-green-400")} />;
    case "destructive":
      return <XCircle className={cn(iconClassName, "text-red-600 dark:text-red-400")} />;
    case "warning":
      return <AlertCircle className={cn(iconClassName, "text-amber-600 dark:text-amber-400")} />;
    case "info":
      return <Info className={cn(iconClassName, "text-blue-600 dark:text-blue-400")} />;
    default:
      return <Info className={cn(iconClassName, "text-blue-600 dark:text-blue-400")} />;
  }
};

interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ 
    className, 
    variant, 
    size, 
    title, 
    description, 
    dismissible = true, 
    onDismiss, 
    icon,
    actions,
    children,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(bannerVariants({ variant, size }), className)}
        role="alert"
        {...props}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="shrink-0">
            {icon || <BannerIcon variant={variant || "default"} />}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-semibold text-sm leading-5 mb-1">
                {title}
              </h3>
            )}
            
            {description && (
              <p className="text-sm opacity-90 leading-5 mb-2">
                {description}
              </p>
            )}
            
            {children && (
              <div className="text-sm">
                {children}
              </div>
            )}
            
            {/* Actions */}
            {actions && (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions}
              </div>
            )}
          </div>
          
          {/* Dismiss button */}
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className={cn(
                "shrink-0 rounded-md p-1.5 inline-flex items-center justify-center",
                "hover:bg-black/5 dark:hover:bg-white/5",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current",
                "transition-colors duration-200"
              )}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Banner.displayName = "Banner";

// Convenience components for different banner types
const BannerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-sm leading-5", className)}
    {...props}
  />
));
BannerTitle.displayName = "BannerTitle";

const BannerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm opacity-90 leading-5", className)}
    {...props}
  />
));
BannerDescription.displayName = "BannerDescription";

const BannerActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-wrap gap-2", className)}
    {...props}
  />
));
BannerActions.displayName = "BannerActions";

export {
  Banner,
  BannerTitle,
  BannerDescription,
  BannerActions,
  BannerIcon,
  bannerVariants,
  type BannerProps,
};