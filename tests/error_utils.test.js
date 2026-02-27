import { describe, it, expect } from "vitest";
import { classifyError, formatClassifiedError } from "../src/error_utils.js";

describe("error_utils", () => {
  it("classifies auth errors by status", () => {
    const result = classifyError({ status: 401, message: "invalid api key" });
    expect(result.category).toBe("auth");
  });

  it("classifies rate limit errors by status", () => {
    const result = classifyError({ status: 429, message: "Too Many Requests" });
    expect(result.category).toBe("rateLimit");
  });

  it("classifies timeout errors by code", () => {
    const result = classifyError({ code: "ECONNABORTED", message: "timeout" });
    expect(result.category).toBe("timeout");
  });

  it("formats classified error with suggestion", () => {
    const t = (key, params = {}) => {
      if (key === "errors.categories.auth") return "Auth";
      if (key === "errors.hints.auth") return "Check API key.";
      if (key === "errors.suggestedFix") return `Suggested fix: ${params.hint}`;
      if (key === "errors.unknownMessage") return "Unknown error";
      return key;
    };

    const message = formatClassifiedError(
      { status: 401, message: "invalid key" },
      t
    );

    expect(message).toContain("[Auth]");
    expect(message).toContain("HTTP 401");
    expect(message).toContain("Suggested fix:");
  });
});
