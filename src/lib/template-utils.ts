/**
 * Template utility helper to determine the active website template (ischool vs imadrasha).
 */
export function isMadrashaTemplate(
  settings?: Record<string, unknown> | null,
  cmsData?: Record<string, unknown> | null,
  searchTemplate?: string | null
): boolean {
  // 1. Explicit template override passed directly (from page.template or component prop)
  if (searchTemplate) {
    const lower = searchTemplate.toLowerCase().trim();
    if (lower === "imadrasha" || lower === "madrasha") return true;
    if (lower === "ischool") return false;
    // If 'both' or 'shared' or empty, fall through to URL query param / settings
  }

  // 2. URL search param override (e.g. ?template=imadrasha or ?template=ischool)
  const queryParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("template")
      : null;

  if (queryParam) {
    const lower = queryParam.toLowerCase().trim();
    if (lower === "imadrasha" || lower === "madrasha") return true;
    if (lower === "ischool") return false;
  }

  if (typeof window !== "undefined") {
    // 2. Hostname check (e.g. imadrasha.vercel.app, *.madrasha.*, etc.)
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes("madrasha") || hostname.includes("madrasa")) {
      return true;
    }
  }

  // 3. Environment variable override
  const envTemplate = process.env.NEXT_PUBLIC_WEBSITE_TEMPLATE?.toLowerCase();
  if (envTemplate === "imadrasha" || envTemplate === "madrasha") return true;
  if (envTemplate === "ischool") return false;

  // 4. Front CMS Settings
  const cmsTemplate = (
    cmsData?.website_template ||
    (cmsData?.header_footer_sections as Record<string, unknown> | undefined)?.website_template
  )?.toString().toLowerCase();

  if (cmsTemplate === "imadrasha" || cmsTemplate === "madrasha") return true;
  if (cmsTemplate === "ischool") return false;

  // 5. General Settings
  const settingsTemplate = settings?.website_template?.toString().toLowerCase();
  if (settingsTemplate === "imadrasha" || settingsTemplate === "madrasha") return true;
  if (settingsTemplate === "ischool") return false;

  return false;
}
