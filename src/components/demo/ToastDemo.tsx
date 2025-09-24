"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

export function ToastDemo() {
  const { success, error, warning, info, toast } = useToast();

  const showSuccessToast = () => {
    success(
      "Success! 🎉",
      "Your changes have been saved successfully."
    );
  };

  const showErrorToast = () => {
    error(
      "Error occurred! ❌",
      "Something went wrong. Please try again."
    );
  };

  const showWarningToast = () => {
    warning(
      "Warning! ⚠️",
      "This action cannot be undone. Please proceed with caution."
    );
  };

  const showInfoToast = () => {
    info(
      "Information ℹ️",
      "This is an informational message for your reference."
    );
  };

  const showDefaultToast = () => {
    toast({
      title: "Default toast",
      description: "This is a default toast notification.",
    });
  };

  const showCustomToast = () => {
    toast({
      title: "Custom Duration",
      description: "This toast will stay for 10 seconds.",
      duration: 10000,
    });
  };

  return (
    <div className="space-y-4 p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Toast Notifications Demo</h2>
      <div className="grid gap-3">
        <Button onClick={showSuccessToast} variant="default">
          Show Success Toast
        </Button>
        <Button onClick={showErrorToast} variant="destructive">
          Show Error Toast
        </Button>
        <Button onClick={showWarningToast} variant="outline">
          Show Warning Toast
        </Button>
        <Button onClick={showInfoToast} variant="secondary">
          Show Info Toast
        </Button>
        <Button onClick={showDefaultToast} variant="ghost">
          Show Default Toast
        </Button>
        <Button onClick={showCustomToast} variant="outline">
          Show Custom Duration Toast
        </Button>
      </div>
    </div>
  );
}