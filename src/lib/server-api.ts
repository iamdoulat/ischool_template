/**
 * Server-side API utility for React Server Components (RSC) and Next.js Server Actions.
 * Runs strictly on the Node.js server. Never exposed to the browser.
 */

function getServerApiBaseUrl(): string {
    const internalUrl = process.env.INTERNAL_API_URL;
    if (internalUrl) return internalUrl.replace(/\/+$/, "");

    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    if (publicUrl) return publicUrl.replace(/\/+$/, "");

    return "http://127.0.0.1:8000/api/v1";
}

export interface ServerFetchOptions extends RequestInit {
    revalidate?: number | false;
    tags?: string[];
    token?: string;
    branchId?: string;
}

export async function serverFetch<T = any>(
    endpoint: string,
    options: ServerFetchOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
    const baseUrl = getServerApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };

    if (options.token) {
        headers["Authorization"] = `Bearer ${options.token}`;
    }

    if (options.branchId) {
        headers["X-Branch-Id"] = options.branchId;
    }

    const nextOptions: { revalidate?: number | false; tags?: string[] } = {};
    if (options.revalidate !== undefined) {
        nextOptions.revalidate = options.revalidate;
    }
    if (options.tags) {
        nextOptions.tags = options.tags;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined,
        });

        const status = response.status;
        if (!response.ok) {
            let errorMessage = `HTTP error ${status}`;
            try {
                const errJson = await response.json();
                errorMessage = errJson.message || errorMessage;
            } catch {
                // Not JSON
            }
            return { data: null, error: errorMessage, status };
        }

        const json = await response.json();
        // Defensive unwrapping for Laravel ApiResponse trait
        const unwrapped = json?.data !== undefined ? json.data : json;
        return { data: unwrapped as T, error: null, status };
    } catch (err: any) {
        console.error(`[serverFetch] Error connecting to ${url}:`, err.message || err);
        return {
            data: null,
            error: err.message || "Failed to communicate with the backend server",
            status: 500,
        };
    }
}
