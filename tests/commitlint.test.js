import { describe, it, expect } from "vitest";
import {
  autoFixCommitMessage,
  lintAndFixCommitMessage,
  validateCommitMessage,
} from "../src/commitlint.js";

describe("commitlint", () => {
  it("validates a standard conventional commit", () => {
    const result = validateCommitMessage("feat(auth): add token refresh");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("detects invalid headers", () => {
    const result = validateCommitMessage("just update files");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("Header must match");
  });

  it("auto-fixes plain sentences into conventional commits", () => {
    const fixed = autoFixCommitMessage("fix login bug");
    expect(fixed).toBe("fix: login bug");
  });

  it("auto-fixes option prefixes and uppercased types", () => {
    const fixed = autoFixCommitMessage("Option 2: FEAT: add health check");
    expect(fixed).toBe("feat: health check");
  });

  it("returns lint result with fix metadata", () => {
    const result = lintAndFixCommitMessage("1. update api docs");
    expect(result.wasFixed).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.message.startsWith("docs:")).toBe(true);
  });
});
