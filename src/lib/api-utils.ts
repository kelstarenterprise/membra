import { toast } from "@/components/providers/toast-provider";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export class ApiException extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiException";
  }
}

/**
 * Generic API request handler with toast notifications
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {},
  showToasts: boolean = true
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}`;
      
      if (showToasts) {
        toast({
          title: "Request Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      throw new ApiException(errorMessage, response.status, data.code);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : "Network error occurred";
    
    if (showToasts) {
      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    throw new ApiException(errorMessage, 0, "NETWORK_ERROR");
  }
}

/**
 * API CRUD operations with built-in toast notifications
 */
export const api = {
  /**
   * GET request
   */
  async get<T>(url: string, showToasts: boolean = false): Promise<T> {
    return apiRequest<T>(url, { method: "GET" }, showToasts);
  },

  /**
   * POST request with success toast
   */
  async post<T>(
    url: string,
    data: unknown,
    successMessage?: string,
    showToasts: boolean = true
  ): Promise<T> {
    const result = await apiRequest<T>(
      url,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      showToasts
    );

    if (showToasts && successMessage) {
      toast({
        title: "Success",
        description: successMessage,
        variant: "success",
      });
    }

    return result;
  },

  /**
   * PUT request with success toast
   */
  async put<T>(
    url: string,
    data: unknown,
    successMessage?: string,
    showToasts: boolean = true
  ): Promise<T> {
    const result = await apiRequest<T>(
      url,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      showToasts
    );

    if (showToasts && successMessage) {
      toast({
        title: "Success",
        description: successMessage,
        variant: "success",
      });
    }

    return result;
  },

  /**
   * PATCH request with success toast
   */
  async patch<T>(
    url: string,
    data: unknown,
    successMessage?: string,
    showToasts: boolean = true
  ): Promise<T> {
    const result = await apiRequest<T>(
      url,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      showToasts
    );

    if (showToasts && successMessage) {
      toast({
        title: "Success",
        description: successMessage,
        variant: "success",
      });
    }

    return result;
  },

  /**
   * DELETE request with success toast
   */
  async delete<T>(
    url: string,
    successMessage?: string,
    showToasts: boolean = true
  ): Promise<T> {
    const result = await apiRequest<T>(
      url,
      { method: "DELETE" },
      showToasts
    );

    if (showToasts && successMessage) {
      toast({
        title: "Success",
        description: successMessage,
        variant: "success",
      });
    }

    return result;
  },
};

/**
 * Utility functions for common toast patterns
 */
export const toastUtils = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "success",
    });
  },

  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  },

  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "warning",
    });
  },

  info: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "info",
    });
  },

  loading: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "default",
      duration: 0, // Don't auto-dismiss
    });
  },
};