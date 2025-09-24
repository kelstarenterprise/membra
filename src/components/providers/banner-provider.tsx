"use client";

import * as React from "react";
import { Banner, type BannerProps } from "@/components/ui/banner";

type BannerVariant = "default" | "success" | "destructive" | "warning" | "info";

interface BannerData {
  id: string;
  variant?: BannerVariant;
  title?: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  actions?: React.ReactNode;
}

interface BannerContextType {
  banners: BannerData[];
  showBanner: (banner: Omit<BannerData, "id">) => string;
  dismissBanner: (id: string) => void;
  clearAllBanners: () => void;
  success: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
}

const BannerContext = React.createContext<BannerContextType | null>(null);

let bannerIdCounter = 0;

function generateBannerId(): string {
  bannerIdCounter += 1;
  return `banner-${bannerIdCounter}`;
}

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const [banners, setBanners] = React.useState<BannerData[]>([]);

  const showBanner = React.useCallback((bannerData: Omit<BannerData, "id">): string => {
    const id = generateBannerId();
    const banner: BannerData = {
      id,
      duration: 5000, // Default 5 seconds
      dismissible: true,
      ...bannerData,
    };

    setBanners((prev) => [...prev, banner]);

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
    <BannerContext.Provider value={value}>
      {children}
    </BannerContext.Provider>
  );
}

// Note: Global banner container removed - banners now display within individual forms

export function useBanner(): BannerContextType {
  const context = React.useContext(BannerContext);
  
  if (!context) {
    throw new Error("useBanner must be used within a BannerProvider");
  }
  
  return context;
}

// Utility functions for easy banner usage
export const bannerUtils = {
  success: (title: string, description?: string, duration?: number) => {
    // This will be called from components that have access to the context
    return { variant: "success" as const, title, description, duration };
  },

  error: (title: string, description?: string, duration?: number) => {
    return { variant: "destructive" as const, title, description, duration };
  },

  warning: (title: string, description?: string, duration?: number) => {
    return { variant: "warning" as const, title, description, duration };
  },

  info: (title: string, description?: string, duration?: number) => {
    return { variant: "info" as const, title, description, duration };
  },
};

export type { BannerData, BannerVariant, BannerContextType };