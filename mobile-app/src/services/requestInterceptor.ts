/**
 * Request/Response Interceptor System
 * Provides middleware-like hooks for processing requests and responses
 */

export interface RequestContext {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: any;
  timestamp: number;
  attempts: number;
}

export interface ResponseContext {
  request: RequestContext;
  status: number;
  data: any;
  headers: Record<string, string>;
  timestamp: number;
  duration: number; // milliseconds
}

export interface ErrorContext {
  request: RequestContext;
  error: Error;
  statusCode?: number;
  timestamp: number;
  attempts: number;
}

export type RequestInterceptor = (
  context: RequestContext
) => RequestContext | Promise<RequestContext>;

export type ResponseInterceptor = (
  context: ResponseContext
) => ResponseContext | Promise<ResponseContext>;

export type ErrorInterceptor = (
  context: ErrorContext
) => void | Promise<void>;

/**
 * Interceptor Manager - Handles request/response preprocessing
 */
export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  /**
   * Register a request interceptor
   * Runs BEFORE request is sent
   * Useful for: adding auth headers, logging, modifying URLs
   */
  useRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    console.log(
      `[Interceptor] Request interceptor registered (total: ${this.requestInterceptors.length})`
    );
  }

  /**
   * Register a response interceptor
   * Runs AFTER successful response
   * Useful for: data transformation, caching, logging
   */
  useResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    console.log(
      `[Interceptor] Response interceptor registered (total: ${this.responseInterceptors.length})`
    );
  }

  /**
   * Register an error interceptor
   * Runs AFTER error is caught
   * Useful for: error logging, recovery, analytics
   */
  useErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
    console.log(
      `[Interceptor] Error interceptor registered (total: ${this.errorInterceptors.length})`
    );
  }

  /**
   * Execute all request interceptors in sequence
   */
  async executeRequestInterceptors(
    context: RequestContext
  ): Promise<RequestContext> {
    let ctx = context;

    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(ctx);
      ctx = result || ctx;
    }

    return ctx;
  }

  /**
   * Execute all response interceptors in sequence
   */
  async executeResponseInterceptors(
    context: ResponseContext
  ): Promise<ResponseContext> {
    let ctx = context;

    for (const interceptor of this.responseInterceptors) {
      const result = await interceptor(ctx);
      ctx = result || ctx;
    }

    return ctx;
  }

  /**
   * Execute all error interceptors in sequence
   */
  async executeErrorInterceptors(context: ErrorContext): Promise<void> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(context);
    }
  }

  /**
   * Clear all interceptors
   */
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    console.log('[Interceptor] All interceptors cleared');
  }
}

/**
 * Global interceptor manager instance
 */
export const interceptors = new InterceptorManager();

// ============================================
// BUILT-IN INTERCEPTORS
// ============================================

/**
 * Logging interceptor - logs all requests and responses
 */
export const createLoggingInterceptor = (verbose = false) => {
  const requestInterceptor: RequestInterceptor = (context) => {
    if (verbose) {
      console.log(
        `[HTTP] ${context.method} ${context.url}`,
        context.headers
      );
    } else {
      console.log(`[HTTP] ${context.method} ${context.url}`);
    }
    return context;
  };

  const responseInterceptor: ResponseInterceptor = (context) => {
    console.log(
      `[HTTP] ✓ ${context.status} ${context.request.method} ${context.request.url} (${context.duration}ms)`
    );
    return context;
  };

  const errorInterceptor: ErrorInterceptor = (context) => {
    console.error(
      `[HTTP] ✗ ${context.request.method} ${context.request.url} - ${context.error.message}`
    );
  };

  return { requestInterceptor, responseInterceptor, errorInterceptor };
};

/**
 * Auth header interceptor - adds authorization headers
 */
export const createAuthInterceptor = (apiKey?: string) => {
  const requestInterceptor: RequestInterceptor = (context) => {
    if (apiKey) {
      context.headers['X-API-Key'] = apiKey;
    }
    return context;
  };

  return { requestInterceptor };
};

/**
 * Error recovery interceptor - provides detailed error info
 */
export const createErrorRecoveryInterceptor = () => {
  const errorInterceptor: ErrorInterceptor = (context) => {
    console.error('[Error Recovery]', {
      method: context.request.method,
      url: context.request.url,
      errorMessage: context.error.message,
      statusCode: context.statusCode,
      attempt: context.attempts,
      timestamp: new Date(context.timestamp).toISOString(),
    });
  };

  return { errorInterceptor };
};

/**
 * Performance monitoring interceptor
 */
export const createPerformanceInterceptor = () => {
  const responseInterceptor: ResponseInterceptor = (context) => {
    const isSlowRequest = context.duration > 5000;
    if (isSlowRequest) {
      console.warn(
        `[Performance] Slow request detected: ${context.request.method} ${context.request.url} took ${context.duration}ms`
      );
    }
    return context;
  };

  return { responseInterceptor };
};

/**
 * Response status validator interceptor
 */
export const createStatusValidatorInterceptor = () => {
  const responseInterceptor: ResponseInterceptor = (context) => {
    if (context.status >= 400) {
      console.warn(
        `[Validator] Response status ${context.status} for ${context.request.method} ${context.request.url}`
      );
    }
    return context;
  };

  return { responseInterceptor };
};
