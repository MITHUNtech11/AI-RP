/**
 * HTTP Client utility for handling XML requests with progress tracking
 * Integrates retry logic, request/response interceptors, and error handling
 */

import {
  executeWithRetry,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  isRetryableError,
} from './retryPolicy';
import {
  interceptors,
  RequestContext,
  ResponseContext,
  ErrorContext,
} from './requestInterceptor';

interface XHRRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: FormData | BodyInit;
  headers?: Record<string, string>;
  onProgress?: (progress: number) => void;
  timeout?: number;
  retryConfig?: RetryConfig;
}

interface XHRResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

/**
 * Execute an XMLHttpRequest with progress tracking, retries, and interceptors
 * @param options - Configuration for the request
 * @returns Promise with response data
 */
export const xhrRequest = <T = any>(
  options: XHRRequestOptions
): Promise<XHRResponse<T>> => {
  const {
    method,
    url,
    data,
    headers = {},
    onProgress,
    timeout = 30000,
    retryConfig = DEFAULT_RETRY_CONFIG,
  } = options;

  return executeWithRetry(
    async () => {
      return performXhrRequest<T>({
        method,
        url,
        data,
        headers,
        onProgress,
        timeout,
      });
    },
    retryConfig,
    async (error, attempt, delayMs) => {
      // Invoke error interceptors on retry
      if (isRetryableError(error)) {
        const errorContext: ErrorContext = {
          request: {
            method,
            url,
            headers,
            data,
            timestamp: Date.now(),
            attempts: attempt,
          },
          error,
          timestamp: Date.now(),
          attempts: attempt,
        };

        await interceptors.executeErrorInterceptors(errorContext);
      }
    }
  );
};

/**
 * Internal helper to perform the actual XHR request
 */
const performXhrRequest = async <T = any>(
  options: Omit<XHRRequestOptions, 'retryConfig'>
): Promise<XHRResponse<T>> => {
  const { method, url, data, headers = {}, onProgress, timeout = 30000 } =
    options;

  // Step 1: Execute request interceptors
  let requestContext: RequestContext = {
    method,
    url,
    headers: { ...headers },
    data,
    timestamp: Date.now(),
    attempts: 1,
  };

  requestContext = await interceptors.executeRequestInterceptors(
    requestContext
  );

  // Step 2: Perform XHR request
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();

    // Set timeout if specified
    if (timeout > 0) {
      xhr.timeout = timeout;
    }

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.min(percentComplete, 95)); // Cap at 95% until complete
      }
    });

    // Track download progress
    xhr.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(Math.min(percentComplete, 95));
      }
    });

    // Handle successful response
    xhr.addEventListener('load', async () => {
      try {
        const duration = Date.now() - startTime;

        if (xhr.status >= 200 && xhr.status < 300) {
          let responseData: T;
          try {
            responseData = JSON.parse(xhr.responseText);
          } catch {
            responseData = xhr.responseText as any;
          }

          if (onProgress) {
            onProgress(100);
          }

          const response: XHRResponse<T> = {
            status: xhr.status,
            data: responseData,
            headers: parseHeaders(xhr.getAllResponseHeaders()),
          };

          // Step 3: Execute response interceptors
          const responseContext: ResponseContext = {
            request: requestContext,
            status: xhr.status,
            data: responseData,
            headers: parseHeaders(xhr.getAllResponseHeaders()),
            timestamp: Date.now(),
            duration,
          };

          await interceptors.executeResponseInterceptors(responseContext);

          resolve(response);
        } else {
          // Handle error response with data
          let errorData: any;
          try {
            errorData = JSON.parse(xhr.responseText);
          } catch {
            errorData = { detail: xhr.responseText };
          }

          const errorMessage =
            errorData?.detail?.[0]?.msg ||
            errorData?.detail?.message ||
            errorData?.detail ||
            `HTTP ${xhr.status}`;

          const error = new Error(errorMessage);

          // Execute error interceptors
          const errorContext: ErrorContext = {
            request: requestContext,
            error,
            statusCode: xhr.status,
            timestamp: Date.now(),
            attempts: 1,
          };

          await interceptors.executeErrorInterceptors(errorContext);

          reject(error);
        }
      } catch (e) {
        reject(e);
      }
    });

    // Handle network errors
    xhr.addEventListener('error', async () => {
      const error = new Error(
        'Network error - unable to reach server'
      );

      // Execute error interceptors
      const errorContext: ErrorContext = {
        request: requestContext,
        error,
        timestamp: Date.now(),
        attempts: 1,
      };

      await interceptors.executeErrorInterceptors(errorContext);

      reject(error);
    });

    // Handle timeout
    xhr.addEventListener('timeout', async () => {
      const error = new Error(
        'Request timeout - server took too long to respond'
      );

      // Execute error interceptors
      const errorContext: ErrorContext = {
        request: requestContext,
        error,
        timestamp: Date.now(),
        attempts: 1,
      };

      await interceptors.executeErrorInterceptors(errorContext);

      reject(error);
    });

    // Handle abort
    xhr.addEventListener('abort', () => {
      reject(new Error('Request was cancelled'));
    });

    // Set headers
    xhr.open(method, requestContext.url);
    Object.entries(requestContext.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // Send request
    xhr.send(requestContext.data || null);
  });
};

/**
 * Parse response headers from getAllResponseHeaders()
 */
function parseHeaders(headerStr: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!headerStr) return headers;

  headerStr.split('\r\n').forEach((line) => {
    const parts = line.split(': ');
    if (parts.length === 2) {
      headers[parts[0].toLowerCase()] = parts[1];
    }
  });

  return headers;
}

/**
 * Helper: Make a POST request with form data and progress tracking
 */
export const postFormData = async <T = any>(
  url: string,
  formData: FormData,
  headers: Record<string, string> = {},
  onProgress?: (progress: number) => void,
  retryConfig?: RetryConfig
): Promise<T> => {
  const response = await xhrRequest<T>({
    method: 'POST',
    url,
    data: formData,
    headers,
    onProgress,
    retryConfig,
  });

  return response.data;
};

/**
 * Helper: Make a POST request with JSON data
 */
export const postJSON = async <T = any>(
  url: string,
  data: any,
  headers: Record<string, string> = {},
  retryConfig?: RetryConfig
): Promise<T> => {
  return executeWithRetry(
    async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error?.detail?.[0]?.msg ||
            error?.detail?.message ||
            error?.detail ||
            `HTTP ${response.status}`
        );
      }

      return response.json();
    },
    retryConfig || DEFAULT_RETRY_CONFIG
  );
};
