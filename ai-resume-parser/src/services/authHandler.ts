/**
 * Authentication Handler - Manages tokens, refresh logic, and redirects
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    created_at: string;
  };
}

class AuthHandler {
  private static isRefreshing = false;
  private static refreshPromise: Promise<string | null> | null = null;

  /**
   * Get access token from localStorage
   */
  static getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get refresh token from localStorage
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Store tokens in localStorage
   */
  static setTokens(tokenResponse: TokenResponse): void {
    localStorage.setItem('access_token', tokenResponse.access_token);
    localStorage.setItem('refresh_token', tokenResponse.refresh_token);
    localStorage.setItem('token_expires_in', String(tokenResponse.expires_in));
    localStorage.setItem('user_id', tokenResponse.user.id);
    localStorage.setItem('user_email', tokenResponse.user.email);
  }

  /**
   * Clear all tokens from localStorage
   */
  static clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_in');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, wait for the current refresh to complete
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      this.redirectToLogin('Session expired. Please login again.');
      return null;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          // Refresh token is also invalid
          this.clearTokens();
          this.redirectToLogin('Session expired. Please login again.');
          return null;
        }

        const data: { access_token: string; expires_in: number } = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('token_expires_in', String(data.expires_in));
        
        return data.access_token;
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.clearTokens();
        this.redirectToLogin('Failed to refresh session. Please login again.');
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Redirect to login page
   */
  static redirectToLogin(reason?: string): void {
    if (reason) {
      localStorage.setItem('auth_redirect_reason', reason);
    }
    window.location.href = '/';
  }

  /**
   * Handle 401 Unauthorized response
   */
  static async handle401(response: Response): Promise<Response | null> {
    const error = await response.json().catch(() => ({}));
    const isTokenExpired = 
      error.detail?.includes?.('Invalid or expired token') ||
      error.detail?.includes?.('token') ||
      error.message?.includes?.('expired');

    if (isTokenExpired) {
      // Try to refresh token
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        return newToken; // Return new token so caller can retry
      }
    } else {
      // Other 401 error, redirect to login
      this.clearTokens();
      this.redirectToLogin(error.detail || 'Unauthorized. Please login again.');
    }

    return null;
  }

  /**
   * Get authorization header with current access token
   */
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getAccessToken();
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  }
}

export default AuthHandler;
