const BAD_REQUEST_STATUSES = new Set([400, 404, 405, 409, 410, 413, 415, 422]);
const NETWORK_ERROR_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
]);

export function classifyError(error) {
  const status = Number(
    error?.status || error?.statusCode || error?.response?.status || 0
  );
  const code = (error?.code || "").toString();
  const message = (error?.message || "").toString().trim();
  const lower = message.toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    /unauthorized|forbidden|invalid api key|authentication|auth failed/.test(
      lower
    )
  ) {
    return { category: "auth", status: status || undefined, message };
  }

  if (status === 429 || /rate limit|too many requests|quota exceeded/.test(lower)) {
    return { category: "rateLimit", status: status || undefined, message };
  }

  if (
    code === "ECONNABORTED" ||
    /timeout|timed out|request aborted/.test(lower)
  ) {
    return { category: "timeout", status: status || undefined, message };
  }

  if (
    NETWORK_ERROR_CODES.has(code) ||
    /network error|getaddrinfo|socket hang up|dns/.test(lower)
  ) {
    return { category: "network", status: status || undefined, message };
  }

  if (status >= 500) {
    return { category: "server", status, message };
  }

  if (status && BAD_REQUEST_STATUSES.has(status)) {
    return { category: "badRequest", status, message };
  }

  return { category: "unknown", status: status || undefined, message };
}

export function formatClassifiedError(error, t) {
  const info = classifyError(error);
  const categoryKey = `errors.categories.${info.category}`;
  const hintKey = `errors.hints.${info.category}`;
  const categoryLabel = t(categoryKey);
  const hint = t(hintKey);
  const detail =
    info.message ||
    (info.status ? `HTTP ${info.status}` : t("errors.unknownMessage"));
  const detailWithStatus =
    info.status && !detail.includes("HTTP ")
      ? `HTTP ${info.status}: ${detail}`
      : detail;

  const lines = [`[${categoryLabel}] ${detailWithStatus}`];
  if (hint && hint !== hintKey) {
    lines.push(t("errors.suggestedFix", { hint }));
  }
  return lines.join("\n");
}
