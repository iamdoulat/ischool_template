import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const TOKEN_COOKIE_NAME = "ischool_session_token";
const ADMIN_TOKEN_COOKIE_NAME = "ischool_admin_token";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours matching Laravel Sanctum expiration

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

/**
 * GET /api/auth/session
 * Retrieves the current session token stored securely in HttpOnly cookie.
 * Client JavaScript cannot read this cookie directly, but Next.js route handler can.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    const adminTokenCookie = cookieStore.get(ADMIN_TOKEN_COOKIE_NAME);

    const token = tokenCookie?.value || null;
    const adminToken = adminTokenCookie?.value || null;

    return NextResponse.json({
      authenticated: Boolean(token),
      token,
      adminToken,
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, token: null, adminToken: null, error: "Failed to read session" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/session
 * Stores the bearer token and optional admin impersonation token in HttpOnly cookies.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, adminToken, action } = body;

    const cookieStore = await cookies();

    if (action === "restore_admin") {
      // Impersonation exit: promote admin token to main token and clear admin cookie
      const currentAdminToken = adminToken || cookieStore.get(ADMIN_TOKEN_COOKIE_NAME)?.value;
      if (currentAdminToken) {
        cookieStore.set(TOKEN_COOKIE_NAME, currentAdminToken, cookieOptions);
        cookieStore.set(ADMIN_TOKEN_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
        return NextResponse.json({ success: true, token: currentAdminToken });
      }
      return NextResponse.json({ success: false, error: "No admin token to restore" }, { status: 400 });
    }

    if (token) {
      cookieStore.set(TOKEN_COOKIE_NAME, token, cookieOptions);
    }

    if (adminToken !== undefined) {
      if (adminToken) {
        cookieStore.set(ADMIN_TOKEN_COOKIE_NAME, adminToken, cookieOptions);
      } else {
        cookieStore.set(ADMIN_TOKEN_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to save session" }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/session
 * Destroys the session by clearing all HttpOnly session cookies.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(TOKEN_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
    cookieStore.set(ADMIN_TOKEN_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to clear session" }, { status: 500 });
  }
}
