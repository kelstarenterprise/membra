"use client";

import { Button } from "@/components/ui/button";
import { useBanner } from "@/components/providers/banner-provider";

export function BannerDemo() {
  const { success, error, warning, info, showBanner, clearAllBanners } = useBanner();

  const showSuccessBanner = () => {
    success(
      "Success! 🎉",
      "Your changes have been saved successfully."
    );
  };

  const showErrorBanner = () => {
    error(
      "Error occurred! ❌",
      "Something went wrong. Please try again."
    );
  };

  const showWarningBanner = () => {
    warning(
      "Warning! ⚠️",
      "This action cannot be undone. Please proceed with caution."
    );
  };

  const showInfoBanner = () => {
    info(
      "Information ℹ️",
      "This is an informational message for your reference."
    );
  };

  const showDefaultBanner = () => {
    showBanner({
      title: "Default banner",
      description: "This is a default banner notification.",
    });
  };

  const showCustomBanner = () => {
    showBanner({
      variant: "success",
      title: "Custom Duration",
      description: "This banner will stay for 10 seconds.",
      duration: 10000,
    });
  };

  const showPersistentBanner = () => {
    showBanner({
      variant: "warning",
      title: "Persistent Banner",
      description: "This banner will stay until dismissed.",
      duration: 0,
      dismissible: true,
    });
  };

  return (
    <div className="space-y-4 p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Banner Notifications Demo</h2>
      <p className="text-sm text-gray-600 mb-4">
        Banners appear at the top of the page and automatically dismiss after a few seconds.
      </p>
      
      <div className="grid gap-3">
        <Button onClick={showSuccessBanner} variant="default">
          Show Success Banner
        </Button>
        <Button onClick={showErrorBanner} variant="destructive">
          Show Error Banner
        </Button>
        <Button onClick={showWarningBanner} variant="outline">
          Show Warning Banner
        </Button>
        <Button onClick={showInfoBanner} variant="secondary">
          Show Info Banner
        </Button>
        <Button onClick={showDefaultBanner} variant="ghost">
          Show Default Banner
        </Button>
        <Button onClick={showCustomBanner} variant="outline">
          Show Custom Duration Banner
        </Button>
        <Button onClick={showPersistentBanner} variant="outline">
          Show Persistent Banner
        </Button>
        <Button 
          onClick={clearAllBanners} 
          variant="destructive" 
          size="sm"
          className="mt-4"
        >
          Clear All Banners
        </Button>
      </div>
    </div>
  );
}