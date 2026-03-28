/**
 * HTTP Configuration
 * Initializes interceptors and retry policies for all HTTP requests
 */

import { interceptors } from './requestInterceptor';
import {
  createLoggingInterceptor,
  createErrorRecoveryInterceptor,
  createPerformanceInterceptor,
  createStatusValidatorInterceptor,
  createAuthInterceptor,
} from './requestInterceptor';

/**
 * Initialize HTTP client with interceptors and configuration
 * Call this once when the app starts (e.g., in App.tsx or in a setup function)
 */
export const initializeHttpClient = (options?: {
  apiKey?: string;
  verbose?: boolean;
  enableLogging?: boolean;
  enableErrorRecovery?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableStatusValidation?: boolean;
}) => {
  const {
    apiKey,
    verbose = false,
    enableLogging = true,
    enableErrorRecovery = true,
    enablePerformanceMonitoring = true,
    enableStatusValidation = true,
  } = options || {};

  console.log('[HTTP Client] Initializing...');

  // Register logging interceptor
  if (enableLogging) {
    const { requestInterceptor, responseInterceptor, errorInterceptor } =
      createLoggingInterceptor(verbose);
    interceptors.useRequestInterceptor(requestInterceptor);
    interceptors.useResponseInterceptor(responseInterceptor);
    interceptors.useErrorInterceptor(errorInterceptor);
    console.log('[HTTP Client] ✓ Logging interceptor enabled');
  }

  // Register auth interceptor
  if (apiKey) {
    const { requestInterceptor } = createAuthInterceptor(apiKey);
    interceptors.useRequestInterceptor(requestInterceptor);
    console.log('[HTTP Client] ✓ Auth interceptor enabled');
  }

  // Register error recovery interceptor
  if (enableErrorRecovery) {
    const { errorInterceptor } = createErrorRecoveryInterceptor();
    interceptors.useErrorInterceptor(errorInterceptor);
    console.log('[HTTP Client] ✓ Error recovery interceptor enabled');
  }

  // Register performance monitoring interceptor
  if (enablePerformanceMonitoring) {
    const { responseInterceptor } = createPerformanceInterceptor();
    interceptors.useResponseInterceptor(responseInterceptor);
    console.log('[HTTP Client] ✓ Performance monitoring enabled');
  }

  // Register status validator interceptor
  if (enableStatusValidation) {
    const { responseInterceptor } = createStatusValidatorInterceptor();
    interceptors.useResponseInterceptor(responseInterceptor);
    console.log('[HTTP Client] ✓ Status validator enabled');
  }

  console.log('[HTTP Client] Initialization complete');
};

/**
 * Clear all interceptors (useful for testing or cleanup)
 */
export const clearHttpInterceptors = () => {
  interceptors.clear();
  console.log('[HTTP Client] All interceptors cleared');
};

/**
 * Get the interceptor manager instance for advanced usage
 */
export { interceptors };
