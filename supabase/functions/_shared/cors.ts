// ============================================================
// SIGAM — CORS Headers for Edge Functions
// ============================================================

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ams.vercel.app",
];

export function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

// Backward-compat: static headers for functions that don't pass the request
export const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[2],
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
