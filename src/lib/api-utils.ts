// Note: This utility is now designed to work without direct banner context
// Components should use useBanner() hook directly for better context management

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
 * Generic API request handler
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
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
      throw new ApiException(errorMessage, response.status, data.code);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : "Network error occurred";
    throw new ApiException(errorMessage, 0, "NETWORK_ERROR");
  }
}

/**
 * API CRUD operations
 */
export const api = {
  /**
   * GET request
   */
  async get<T>(url: string): Promise<T> {
    return apiRequest<T>(url, { method: "GET" });
  },

  /**
   * POST request
   */
  async post<T>(url: string, data: unknown): Promise<T> {
    return apiRequest<T>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * PUT request
   */
  async put<T>(url: string, data: unknown): Promise<T> {
    return apiRequest<T>(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * PATCH request
   */
  async patch<T>(url: string, data: unknown): Promise<T> {
    return apiRequest<T>(url, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    return apiRequest<T>(url, { method: "DELETE" });
  },
};

/**
 * Utility functions for common banner patterns
 * Note: These return banner configuration objects.
 * Use useBanner() hook in components for actual banner display.
 */
export const bannerUtils = {
  success: (title: string, description?: string, duration?: number) => ({
    variant: "success" as const,
    title,
    description,
    duration: duration || 5000,
  }),

  error: (title: string, description?: string, duration?: number) => ({
    variant: "destructive" as const,
    title,
    description,
    duration: duration || 8000,
  }),

  warning: (title: string, description?: string, duration?: number) => ({
    variant: "warning" as const,
    title,
    description,
    duration: duration || 7000,
  }),

  info: (title: string, description?: string, duration?: number) => ({
    variant: "info" as const,
    title,
    description,
    duration: duration || 5000,
  }),

  loading: (title: string, description?: string) => ({
    variant: "default" as const,
    title,
    description,
    duration: 0, // Don't auto-dismiss
    dismissible: false,
  }),
};
