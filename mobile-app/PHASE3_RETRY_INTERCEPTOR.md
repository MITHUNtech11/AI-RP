# Phase 3: Retry Logic & Request Interceptor System

## Overview

Phase 3 implements a production-ready HTTP request handling system with:
- **Automatic Retry Logic** - Exponential backoff with jitter for transient failures
- **Request/Response Interceptors** - Middleware-like hooks for request preprocessing and response handling
- **Error Recovery** - Intelligent error classification and recovery strategies
- **Performance Monitoring** - Built-in request duration tracking and slow request detection

## Architecture

```
App.tsx (HTTP Client Initialization)
  └── httpConfig.ts (Initialize interceptors & retry config)
      ├── httpClient.ts (Core XHR + retry integration)
      ├── retryPolicy.ts (Exponential backoff logic)
      └── requestInterceptor.ts (Interceptor manager & built-ins)
```

## Key Components

### 1. Retry Policy (`retryPolicy.ts`)

**Purpose**: Implements exponential backoff with jitter for automatic request retries

**Key Features**:
- Configurable retry attempts (default: 3)
- Exponential backoff: `delay = initialDelay * (multiplier ^ attempt)`
- Jitter to prevent thundering herd: `delay += random(0, delay * jitterFactor)`
- Retryable error detection based on status codes and error types

**Default Configuration**:
```typescript
{
  maxAttempts: 3,              // Retry up to 3 times
  initialDelayMs: 1000,        // Start with 1 second
  maxDelayMs: 30000,           // Cap at 30 seconds
  backoffMultiplier: 2,        // Double delay each attempt
  jitterFactor: 0.1,           // Add 10% random jitter
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['Network error', 'timeout', 'ECONNRESET', ...]
}
```

**Retry Delays**:
- Attempt 1 → Fail → Wait ~1000ms
- Attempt 2 → Fail → Wait ~2000ms
- Attempt 3 → Fail → Wait ~4000ms
- Attempt 4 → Final failure (3 max attempts reached)

**API**:
```typescript
// Execute function with automatic retries
const result = await executeWithRetry(
  () => apiCall(),
  customRetryConfig,
  (error, attempt, delay) => console.log(`Retrying in ${delay}ms...`)
);

// Classify errors
if (isRetryableError(error, statusCode)) {
  // This error will be retried
}
```

### 2. Request/Response Interceptors (`requestInterceptor.ts`)

**Purpose**: Provides middleware-like hooks for request/response processing

**Key Concepts**:

1. **Request Interceptors** - Run BEFORE request is sent
   - Add authentication headers
   - Modify request URLs or parameters
   - Log request details
   - Transform request data

2. **Response Interceptors** - Run AFTER successful response
   - Transform response data
   - Cache results
   - Log response metrics
   - Validate response format

3. **Error Interceptors** - Run AFTER error is caught
   - Log error details
   - Track error metrics
   - Send error notifications
   - Recover from errors

**Built-in Interceptors**:

```typescript
// Logging Interceptor
const { requestInterceptor, responseInterceptor, errorInterceptor } =
  createLoggingInterceptor(verbose);
// Logs: [HTTP] GET /api/endpoint
// Logs: [HTTP] ✓ 200 GET /api/endpoint (325ms)
// Logs: [HTTP] ✗ GET /api/endpoint - Network error

// Auth Interceptor
const { requestInterceptor } = createAuthInterceptor(apiKey);
// Adds: X-API-Key header to all requests

// Error Recovery Interceptor
const { errorInterceptor } = createErrorRecoveryInterceptor();
// Logs detailed error info with timestamp and context

// Performance Interceptor
const { responseInterceptor } = createPerformanceInterceptor();
// Warns if request takes > 5 seconds

// Status Validator Interceptor
const { responseInterceptor } = createStatusValidatorInterceptor();
// Warns if response status >= 400
```

**API**:
```typescript
// Register custom interceptor
interceptors.useRequestInterceptor((context) => {
  context.headers['X-Custom-Header'] = 'value';
  return context;
});

// Register response interceptor
interceptors.useResponseInterceptor((context) => {
  console.log(`Request took ${context.duration}ms`);
  return context;
});

// Register error interceptor
interceptors.useErrorInterceptor((context) => {
  console.error(`Error: ${context.error.message}`);
  console.error(`Status: ${context.statusCode}`);
});
```

### 3. HTTP Client (`httpClient.ts`)

**Purpose**: Core HTTP request handler with integrated retry and interceptor support

**Integration Points**:

1. Request interceptors run before XHR opens
2. Retries automatically wrap the request execution
3. Response interceptors run after successful response
4. Error interceptors run on failure before retry decision

**API**:
```typescript
// Make request with automatic retries and interceptors
const response = await xhrRequest({
  method: 'POST',
  url: 'https://api.example.com/parse',
  data: formData,
  headers: { 'X-API-Key': 'key' },
  onProgress: (progress) => setProgress(progress),
  timeout: 30000,
  retryConfig: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    // ... other config
  },
});

// Helper methods
const data = await postFormData(url, formData, headers, onProgress, retryConfig);
const json = await postJSON(url, data, headers, retryConfig);
```

## HTTP Configuration (`httpConfig.ts`)

**Purpose**: Centralized initialization of HTTP client with all interceptors

**Usage** (in App.tsx):
```typescript
import { initializeHttpClient } from './src/services/httpConfig';

useEffect(() => {
  initializeHttpClient({
    apiKey: process.env.REACT_APP_BACKEND_API_KEY,
    verbose: __DEV__,
    enableLogging: true,
    enableErrorRecovery: true,
    enablePerformanceMonitoring: true,
    enableStatusValidation: true,
  });
}, []);
```

**Options**:
- `apiKey` - Add API key to all requests
- `verbose` - Log detailed request/response info
- `enableLogging` - Log all requests and responses
- `enableErrorRecovery` - Log error details for debugging
- `enablePerformanceMonitoring` - Warn on slow requests (>5s)
- `enableStatusValidation` - Warn on 4xx/5xx responses

## Request Flow

```
1. App initializes HTTP client
   ↓
2. API call is made: postFormData(url, data)
   ↓
3. executeWithRetry wraps the request
   ↓
4. Request interceptors run (add headers, log, etc)
   ↓
5. XHR request sent with progress tracking
   ↓
6a. SUCCESS: Response interceptors run → return data
   ↓
6b. TRANSIENT ERROR (408, 429, 500, etc):
   - Error interceptors run
   - Calculate backoff delay
   - Retry from step 4
   ↓
6c. NON-TRANSIENT ERROR (4xx, validation error, etc):
   - Error interceptors run
   - Throw error to caller
```

## Retry Examples

### Example 1: Network Timeout on First Attempt

```
Attempt 1: GET /api/parse
  ↓ Timeout after 30 seconds
  ↓ Error: "Request timeout"
  ↓ isRetryableError("timeout") → true
  ↓ Calculate delay: 1000 * (2^0) + jitter = ~1000ms
  ↓ Sleep 1000ms

Attempt 2: GET /api/parse
  ↓ Timeout after 30 seconds
  ↓ Error: "Request timeout"
  ↓ isRetryableError("timeout") → true
  ↓ Calculate delay: 1000 * (2^1) + jitter = ~2000ms
  ↓ Sleep 2000ms

Attempt 3: GET /api/parse
  ↓ 200 OK ✓
  ↓ Response interceptors run
  ↓ Return data to caller
```

### Example 2: Server Overload (503)

```
Attempt 1: POST /api/parse
  ↓ HTTP 503 Service Unavailable
  ↓ Error interceptor logs: "HTTP 503"
  ↓ isRetryableError(503) → true (503 in retryableStatusCodes)
  ↓ Wait ~1000ms

Attempt 2: POST /api/parse
  ↓ HTTP 503 Service Unavailable
  ↓ Error interceptor logs: "HTTP 503"
  ↓ Wait ~2000ms

Attempt 3: POST /api/parse
  ↓ HTTP 200 OK ✓
  ↓ Return parsed resume data
```

### Example 3: Non-Retryable Error (400 Bad Request)

```
Attempt 1: POST /api/parse
  ↓ HTTP 400 Bad Request
  ↓ Response: { "detail": "Invalid file format" }
  ↓ isRetryableError(400) → false (not in retryableStatusCodes)
  ↓ NonRetryableError thrown
  ↓ Error caught at API call site
  ↓ Display to user: "Invalid file format"
```

## Console Output Example

With logging enabled, you'll see:

```
[HTTP Client] Initializing...
[HTTP Client] ✓ Logging interceptor enabled
[HTTP Client] ✓ Auth interceptor enabled
[HTTP Client] ✓ Error recovery interceptor enabled
[HTTP Client] ✓ Performance monitoring enabled
[HTTP Client] ✓ Status validator enabled
[HTTP Client] Initialization complete

[HTTP] POST /api/parse
[Retry Policy] Attempt 1/3
[HTTP] ✗ POST /api/parse - Request timeout
[Error Recovery] { method: 'POST', url: '/api/parse', error: 'timeout', attempts: 1, ... }

[Retry Policy] Attempt 2/3, retrying in 1023ms...
[HTTP] POST /api/parse
[Retry Policy] Attempt 2/3
[HTTP] ✓ 200 POST /api/parse (2850ms)
```

## Testing Retry Logic

```typescript
// Simulate transient failure
const unreliableApi = async () => {
  if (Math.random() < 0.7) {
    throw new Error('Network error');
  }
  return { success: true };
};

// This will retry automatically
const result = await executeWithRetry(
  unreliableApi,
  { maxAttempts: 3, initialDelayMs: 100 }
);
```

## Best Practices

### 1. Configure Retry Policies Per Request Type

```typescript
// File uploads: more aggressive retries
const uploadRetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 2000,
  maxDelayMs: 60000,
};

// API calls: standard retries
const apiRetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
};

// Get real-time data: minimal retries
const realtimeRetryConfig = {
  maxAttempts: 1,
  initialDelayMs: 0,
};
```

### 2. Monitor Retry Patterns

```typescript
const onRetry = (error, attempt, delay) => {
  // Send to analytics
  analytics.track('request_retry', {
    error: error.message,
    attempt,
    delay,
    timestamp: new Date().toISOString(),
  });
};
```

### 3. Add Custom Interceptors for Your Use Case

```typescript
// Cache interceptor
interceptors.useResponseInterceptor((context) => {
  if (context.request.method === 'GET') {
    cache.set(context.request.url, context.data);
  }
  return context;
});

// Rate limit detector
interceptors.useErrorInterceptor((context) => {
  if (context.statusCode === 429) {
    showAlert('Too many requests, please wait...');
  }
});
```

## Troubleshooting

### "Max retry attempts exceeded"
- Check if the error is actually transient (network, 5xx, timeout)
- Increase `maxAttempts` if retries are needed
- Check server logs for persistent issues

### "Slow request detected"
- Typical for large file uploads
- Increase timeout or check network connectivity
- Consider splitting large uploads into chunks

### Interceptors not running
- Ensure `initializeHttpClient()` is called in App.tsx
- Check console for initialization logs
- Verify interceptor registration in `httpConfig.ts`

## Summary

Phase 3 provides production-ready HTTP handling with:
- ✅ **3 automatic retries** with exponential backoff for transient failures
- ✅ **Request/Response interceptors** for logging, auth, monitoring
- ✅ **Error classification** to distinguish retryable vs permanent errors
- ✅ **Built-in monitoring** for performance, errors, and validation
- ✅ **Zero manual intervention** - retries and interceptors are automatic

The system handles common failure scenarios:
- Network timeouts → Retries with backoff
- Server overload (503, 429) → Retries with backoff
- Transient network errors → Retries with backoff
- Permanent errors (400, 401, 404) → Fail immediately
- Performance issues → Logged and monitored

**Result**: A resilient mobile app that gracefully handles network instability!
