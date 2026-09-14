/**
 * Token Manager - Secure In-Memory Token Vault & HttpOnly Session Bridge
 * 
 * Provides defense-in-depth protection against token stealing:
 * 1. Primary Vault: In-memory JavaScript closure (inaccessible to localStorage/DOM scrapers).
 * 2. Persistent Storage: HttpOnly, SameSite=Lax, Secure cookie via Next.js Route Handler (/api/auth/session).
 * 3. Zero-Downtime Migration: Automatically moves any pre-existing localStorage token to the HttpOnly cookie.
 */

class TokenManager {
  private inMemoryToken: string | null = null;
  private inMemoryAdminToken: string | null = null;
  private syncPromise: Promise<string | null> | null = null;
  private isInitialized = false;

  /**
   * Synchronously get the in-memory token (fast path for outgoing requests).
   */
  public getToken(): string | null {
    return this.inMemoryToken;
  }

  /**
   * Check if a token is present in memory or if an active session exists.
   */
  public hasToken(): boolean {
    return Boolean(this.inMemoryToken);
  }

  /**
   * Get the current impersonation admin token (if active).
   */
  public getAdminToken(): string | null {
    return this.inMemoryAdminToken;
  }

  /**
   * Check if currently impersonating a student.
   */
  public isImpersonating(): boolean {
    return Boolean(this.inMemoryAdminToken);
  }

  /**
   * Store a new token: updates in-memory vault and sets HttpOnly session cookie.
   * Wipes any plain token from localStorage to prevent exposure.
   */
  public async setToken(token: string): Promise<void> {
    this.inMemoryToken = token;
    this.isInitialized = true;

    // Purge legacy plain token from localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem("auth_token");
      } catch {
        // Ignore storage errors
      }
    }

    // Persist securely in HttpOnly cookie via Next.js route handler
    if (typeof window !== "undefined") {
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.warn("[TokenManager] Failed to persist session cookie:", error);
      }
    }
  }

  /**
   * Store an admin token for student impersonation.
   */
  public async setAdminToken(adminToken: string): Promise<void> {
    this.inMemoryAdminToken = adminToken;

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem("admin_auth_token");
      } catch {
        // Ignore storage errors
      }
    }

    if (typeof window !== "undefined") {
      try {
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminToken }),
        });
      } catch (error) {
        console.warn("[TokenManager] Failed to persist admin cookie:", error);
      }
    }
  }

  /**
   * Restore admin session upon exiting impersonation.
   */
  public async restoreAdminSession(): Promise<string | null> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore_admin" }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.success && data.token) {
          this.inMemoryToken = data.token;
          this.inMemoryAdminToken = null;
          return data.token;
        }
      } catch (error) {
        console.warn("[TokenManager] Failed to restore admin session:", error);
      }
    }

    // Fallback in case route handler was unreachable
    if (this.inMemoryAdminToken) {
      this.inMemoryToken = this.inMemoryAdminToken;
      this.inMemoryAdminToken = null;
      return this.inMemoryToken;
    }

    return null;
  }

  /**
   * Synchronize session from HttpOnly cookie on app load or page refresh.
   * Auto-migrates legacy localStorage token if found.
   */
  public async syncSession(): Promise<string | null> {
    if (this.inMemoryToken) {
      return this.inMemoryToken;
    }

    // Deduplicate in-flight sync requests
    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = (async () => {
      try {
        if (typeof window === "undefined") {
          return null;
        }

        // 1. Fetch current session from Next.js HttpOnly cookie
        const res = await fetch("/api/auth/session", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.token) {
            this.inMemoryToken = data.token;
            this.inMemoryAdminToken = data.adminToken || null;
            this.isInitialized = true;
            return this.inMemoryToken;
          }
        }

        // 2. Backward compatibility & Auto-migration:
        // If no HttpOnly cookie exists yet, check legacy localStorage
        if (typeof window !== "undefined" && window.localStorage) {
          const legacyToken = window.localStorage.getItem("auth_token");
          const legacyAdminToken = window.localStorage.getItem("admin_auth_token");

          if (legacyToken) {
            this.inMemoryToken = legacyToken;
            this.inMemoryAdminToken = legacyAdminToken || null;
            this.isInitialized = true;

            // Automatically upgrade legacy token to secure HttpOnly cookie
            await this.setToken(legacyToken);
            if (legacyAdminToken) {
              await this.setAdminToken(legacyAdminToken);
            }

            return legacyToken;
          }
        }

        this.isInitialized = true;
        return null;
      } catch (error) {
        console.warn("[TokenManager] Session sync error:", error);
        return null;
      } finally {
        this.syncPromise = null;
      }
    })();

    return this.syncPromise;
  }

  /**
   * Destroy the session completely across in-memory vault, cookies, and storage.
   */
  public async clearToken(): Promise<void> {
    this.inMemoryToken = null;
    this.inMemoryAdminToken = null;
    this.isInitialized = true;

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem("auth_token");
        window.localStorage.removeItem("admin_auth_token");
        window.localStorage.removeItem("is_impersonating");
      } catch {
        // Ignore storage errors
      }
    }

    if (typeof window !== "undefined") {
      try {
        await fetch("/api/auth/session", {
          method: "DELETE",
        });
      } catch (error) {
        console.warn("[TokenManager] Failed to clear session cookie:", error);
      }
    }
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;
