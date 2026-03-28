/**
 * Retry Policy - Exponential Backoff with Jitter
 * Handles retry logic for failed requests with configurable backoff strategy
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
  retryableStatusCodes: number[];
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000, // Start at 1 second
  maxDelayMs: 30000, // Cap at 30 seconds
  backoffMultiplier: 2, // Double wait time on each retry
  jitterFactor: 0.1, // Add 10% random jitter to prevent thundering herd
  // Retry on these HTTP status codes (transient errors)
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  // Retry on these error types
  retryableErrors: [
    'Network error',
    'timeout',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ],
};

export class RetryableError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public attemptNumber?: number,
    public maxAttempts?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class NonRetryableError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

/**
 * Determine if an error is retryable based on status code or error type
 */
export const isRetryableError = (
  error: Error,
  statusCode?: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean => {
  // Check if status code is retryable
  if (statusCode && config.retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  // Check if error message contains retryable error patterns
  const errorMessage = error.message.toLowerCase();
  return config.retryableErrors.some((pattern) =>
    errorMessage.includes(pattern.toLowerCase())
  );
};

/**
 * Calculate delay with exponential backoff and jitter
 * Formula: min(initialDelay * (multiplier ^ attempt) * (1 + random(0, jitterFactor)), maxDelay)
 */
export const calculateBackoffDelay = (
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number => {
  // Exponential backoff: delay = initialDelay * (multiplier ^ attemptNumber)
  const exponentialDelay = config.initialDelayMs *
    Math.pow(config.backoffMultiplier, attemptNumber - 1);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter: random factor between 0 and jitterFactor
  const jitter = cappedDelay * Math.random() * config.jitterFactor;

  return Math.floor(cappedDelay + jitter);
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Format retry error message with useful debugging info
 */
export const formatRetryError = (
  error: Error,
  attempt: number,
  maxAttempts: number,
  nextDelayMs?: number
): string => {
  const delayMsg = nextDelayMs
    ? `, retrying in ${Math.round(nextDelayMs / 1000)}s`
    : '';
  return `[Attempt ${attempt}/${maxAttempts}] ${error.message}${delayMsg}`;
};

/**
 * Execute a function with retry logic
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @param onRetry - Optional callback invoked before each retry
 * @returns Promise with the function result
 */
export const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (error: Error, attempt: number, delay: number) => void
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`[Retry Policy] Attempt ${attempt}/${config.maxAttempts}`);
      return await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Check if error is retryable
      if (!isRetryableError(err, undefined, config)) {
        console.log(`[Retry Policy] Non-retryable error: ${err.message}`);
        throw new NonRetryableError(err.message);
      }

      // Check if we've exhausted retries
      if (attempt >= config.maxAttempts) {
        console.log(
          `[Retry Policy] Max attempts (${config.maxAttempts}) reached`
        );
        throw new RetryableError(
          `Max retry attempts exceeded: ${err.message}`,
          undefined,
          attempt,
          config.maxAttempts
        );
      }

      // Calculate delay before retry
      const delayMs = calculateBackoffDelay(attempt, config);
      const retryMsg = formatRetryError(err, attempt, config.maxAttempts, delayMs);
      console.warn(retryMsg);

      // Invoke callback if provided
      if (onRetry) {
        onRetry(err, attempt, delayMs);
      }

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // Should never reach here, but just in case
  throw lastError || new Error('Unknown error in retry logic');
};

/**
 * Create a retry wrapper for any async function
 */
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config?: RetryConfig,
  onRetry?: (error: Error, attempt: number, delay: number) => void
) => {
  return (...args: T): Promise<R> => {
    return executeWithRetry(() => fn(...args), config, onRetry);
  };
};
