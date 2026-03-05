// ============================================================
// SIGAM — CORS Headers for Edge Functions
// ============================================================
// Origins are read from ALLOWED_CORS_ORIGINS env var (comma-separated).
// Vercel preview domains (*.vercel.app) are matched by suffix.
// If no env var is set, defaults to production + localhost origins.
// ============================================================

const DEFAULT_ORIGINS =
  "https://sig-am.vercel.app,http://localhost:5173,http://localhost:3000";

function loadAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_CORS_ORIGINS") || DEFAULT_ORIGINS;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Check if an origin is allowed.
 * Exact match against the allowlist, PLUS any *.vercel.app subdomain
 * (Vercel preview deploys generate unique subdomains).
 */
function isOriginAllowed(origin: string, allowed: string[]): boolean {
  if (allowed.includes(origin)) return true;
  // Allow any Vercel preview deployment subdomain
  try {
    const url = new URL(origin);
    if (url.protocol === "https:" && url.hostname.endsWith(".vercel.app")) {
      return true;
    }
  } catch {
    // malformed origin — reject
  }
  return false;
}

const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type";

/**
 * Build CORS headers from the incoming request's Origin header.
 * If the origin is not allowed, the Access-Control-Allow-Origin header
 * is omitted entirely — the browser will block the request.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowed = loadAllowedOrigins();

  if (isOriginAllowed(origin, allowed)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    };
  }

  // Unknown origin: return headers without Allow-Origin (browser blocks it)
  return {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
  };
}

/**
 * @deprecated Use getCorsHeaders(req) instead.
 * Static fallback for any code that hasn't been migrated yet.
 * Uses the first origin from the allowlist (production).
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": loadAllowedOrigins()[0] || DEFAULT_ORIGINS.split(",")[0],
  "Access-Control-Allow-Headers": ALLOWED_HEADERS,
};
