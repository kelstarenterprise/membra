"use client";

import * as React from "react";
import { Banner, type BannerProps } from "@/components/ui/banner";
import { cn } from "@/lib/utils";

export interface FormBannerData {
  id: string;
  variant?: "default" | "success" | "destructive" | "warning" | "info";
  title?: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  actions?: React.ReactNode;
}

interface FormBannerContextType {
  banners: FormBannerData[];
  showBanner: (banner: Omit<FormBannerData, "id">) => string;
  dismissBanner: (id: string) => void;
  clearAllBanners: () => void;
  success: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
}

const FormBannerContext = React.createContext<FormBannerContextType | null>(null);

let formBannerIdCounter = 0;

function generateFormBannerId(): string {
  formBannerIdCounter += 1;
  return `form-banner-${formBannerIdCounter}`;
}

// Form Banner Provider - to be used within individual forms
export function FormBannerProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = React.useState<FormBannerData[]>([]);

  const showBanner = React.useCallback((bannerData: Omit<FormBannerData, "id">): string => {
    const id = generateFormBannerId();
    const banner: FormBannerData = {
      id,
      duration: 5000, // Default 5 seconds
      dismissible: true,
      ...bannerData,
    };

    setBanners((prev) => [banner, ...prev].slice(0, 3)); // Limit to 3 banners per form

    // Auto-dismiss if duration is specified
    if (banner.duration && banner.duration > 0) {
      setTimeout(() => {
        setBanners((prev) => prev.filter((b) => b.id !== id));
      }, banner.duration);
    }

    return id;
  }, []);

  const dismissBanner = React.useCallback((id: string) => {
    setBanners((prev) => prev.filter((banner) => banner.id !== id));
  }, []);

  const clearAllBanners = React.useCallback(() => {
    setBanners([]);
  }, []);

  const success = React.useCallback(
    (title: string, description?: string, duration: number = 5000): string => {
      return showBanner({
        variant: "success",
        title,
        description,
        duration,
      });
    },
    [showBanner]
  );

  const error = React.useCallback(
    (title: string, description?: string, duration: number = 8000): string => {
      return showBanner({
        variant: "destructive",
        title,
        description,
        duration,
      });
    },
    [showBanner]
  );

  const warning = React.useCallback(
    (title: string, description?: string, duration: number = 7000): string => {
      return showBanner({
        variant: "warning",
        title,
        description,
        duration,
      });
    },
    [showBanner]
  );

  const info = React.useCallback(
    (title: string, description?: string, duration: number = 5000): string => {
      return showBanner({
        variant: "info",
        title,
        description,
        duration,
      });
    },
    [showBanner]
  );

  const value = React.useMemo(
    () => ({
      banners,
      showBanner,
      dismissBanner,
      clearAllBanners,
      success,
      error,
      warning,
      info,
    }),
    [banners, showBanner, dismissBanner, clearAllBanners, success, error, warning, info]
  );

  return (
    <FormBannerContext.Provider value={value}>
      {children}
    </FormBannerContext.Provider>
  );
}

// Hook to use form banner context
export function useFormBanner(): FormBannerContextType {
  const context = React.useContext(FormBannerContext);
  
  if (!context) {
    throw new Error("useFormBanner must be used within a FormBannerProvider");
  }
  
  return context;
}

// Form Banner Container - displays banners within a form
export function FormBannerContainer({ className }: { className?: string }) {
  const { banners, dismissBanner } = useFormBanner();

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2 mb-6", className)}>
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="animate-in slide-in-from-top duration-300 ease-out"
        >
          <Banner
            variant={banner.variant}
            title={banner.title}
            description={banner.description}
            dismissible={banner.dismissible}
            onDismiss={() => dismissBanner(banner.id)}
            actions={banner.actions}
          />
        </div>
      ))}
    </div>
  );
}

// Form with Banner - A wrapper component that provides banner functionality to forms
interface FormWithBannerProps {
  children: React.ReactNode;
  className?: string;
}

export function FormWithBanner({ children, className }: FormWithBannerProps) {
  return (
    <FormBannerProvider>
      <div className={className}>
        <FormBannerContainer />
        {children}
      </div>
    </FormBannerProvider>
  );
}

// Simplified hook for components that just need to show banners
export function useFormBannerActions() {
  const { success, error, warning, info, showBanner, clearAllBanners } = useFormBanner();
  
  return {
    success,
    error,
    warning,
    info,
    showBanner,
    clearAllBanners,
  };
}