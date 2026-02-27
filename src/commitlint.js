const CONVENTIONAL_TYPES = [
  "feat",
  "fix",
  "docs",
  "refactor",
  "perf",
  "build",
  "chore",
  "test",
  "ci",
  "style",
];

const HEADER_REGEX = /^([a-z]+)(\(([^)]+)\))?(!)?:\s+(.+)$/;

function stripFormatting(text) {
  return (text || "")
    .replace(/^```[a-zA-Z]*\n?/, "")
    .replace(/```$/, "")
    .trim();
}

function stripOptionPrefix(text) {
  return (text || "")
    .replace(/^\s*Option\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/^\s*\d+\s*[:.)-]\s*/, "")
    .trim();
}

function normalizeBody(body) {
  const cleaned = (body || "").replace(/\r\n/g, "\n").trim();
  return cleaned.replace(/\n{3,}/g, "\n\n");
}

function guessType(text) {
  const lower = (text || "").toLowerCase();
  if (/fix|bug|error|hotfix|修复|修正|问题|錯誤|错误/.test(lower)) return "fix";
  if (/doc|readme|文档|文件|说明/.test(lower)) return "docs";
  if (/test|测试|測試/.test(lower)) return "test";
  if (/refactor|重构|重構/.test(lower)) return "refactor";
  if (/perf|optimiz|性能|效能/.test(lower)) return "perf";
  if (/build|构建|打包|bundle/.test(lower)) return "build";
  if (/ci|workflow|pipeline/.test(lower)) return "ci";
  if (/style|lint|格式/.test(lower)) return "style";
  if (/add|新增|支持|实现|實現|create|introduce|feature/.test(lower))
    return "feat";
  return "chore";
}

function normalizeScope(rawScope) {
  if (!rawScope) return "";
  const scope = rawScope
    .replace(/[()]/g, "")
    .replace(/:/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return scope ? `(${scope})` : "";
}

function normalizeSubject(rawSubject, type) {
  let subject = (rawSubject || "").trim().replace(/^[-:：\s]+/, "");
  const patterns = {
    feat: /^(feat|feature|add|新增|支持|实现|實現)\s*[:：-]?\s*/i,
    fix: /^(fix|bugfix|hotfix|修复|修正|修補)\s*[:：-]?\s*/i,
    docs: /^(docs?|documentation|文档|文件|说明)\s*[:：-]?\s*/i,
    refactor: /^(refactor|重构|重構)\s*[:：-]?\s*/i,
    test: /^(test|测试|測試)\s*[:：-]?\s*/i,
    chore: /^(chore|misc|miscellaneous)\s*[:：-]?\s*/i,
    build: /^(build|构建|打包)\s*[:：-]?\s*/i,
    ci: /^(ci|workflow|pipeline)\s*[:：-]?\s*/i,
    style: /^(style|lint|格式)\s*[:：-]?\s*/i,
    perf: /^(perf|performance|优化|優化)\s*[:：-]?\s*/i,
  };

  if (patterns[type]) {
    subject = subject.replace(patterns[type], "").trim();
  }
  return subject || "update changes";
}

function normalizeHeader(header, fullText) {
  const clean = stripOptionPrefix(header);
  const conventional = clean.match(
    /^([A-Za-z]+)(\(([^)]+)\))?(!)?:\s*(.+)$/
  );

  if (conventional) {
    let type = conventional[1].toLowerCase();
    const scope = normalizeScope(conventional[3]);
    const breaking = conventional[4] ? "!" : "";
    let subject = normalizeSubject(conventional[5], type);

    if (!CONVENTIONAL_TYPES.includes(type)) {
      type = guessType(clean + "\n" + (fullText || ""));
      subject = normalizeSubject(conventional[5], type);
    }

    return `${type}${scope}${breaking}: ${subject}`;
  }

  const colonIdx = clean.indexOf(":");
  let type = "";
  let scope = "";
  let subject = "";

  if (colonIdx > 0) {
    const left = clean.slice(0, colonIdx).trim();
    subject = clean.slice(colonIdx + 1).trim();
    const leftMatch = left.match(/^([A-Za-z]+)(\(([^)]+)\))?(!)?$/);
    if (leftMatch) {
      type = (leftMatch[1] || "").toLowerCase();
      scope = normalizeScope(leftMatch[3]);
    }
  } else {
    subject = clean;
  }

  if (!type || !CONVENTIONAL_TYPES.includes(type)) {
    type = guessType(clean + "\n" + (fullText || ""));
  }

  subject = normalizeSubject(subject, type);
  return `${type}${scope}: ${subject}`;
}

export function validateCommitMessage(message) {
  const text = stripFormatting(message).replace(/\r\n/g, "\n").trim();
  const errors = [];

  if (!text) {
    errors.push("Commit message is empty.");
    return { valid: false, errors };
  }

  const header = (text.split("\n").find((line) => line.trim()) || "").trim();
  if (!header) {
    errors.push("Commit header is empty.");
    return { valid: false, errors };
  }

  const match = header.match(HEADER_REGEX);
  if (!match) {
    errors.push("Header must match: <type>(<scope>): <subject>.");
    return { valid: false, errors };
  }

  const type = match[1];
  const subject = (match[5] || "").trim();

  if (!CONVENTIONAL_TYPES.includes(type)) {
    errors.push(`Type "${type}" is not allowed.`);
  }

  if (!subject) {
    errors.push("Subject is required.");
  }

  return { valid: errors.length === 0, errors };
}

export function autoFixCommitMessage(message) {
  const original = stripFormatting(message).replace(/\r\n/g, "\n").trim();
  if (!original) return "chore: update changes";

  const lines = original.split("\n");
  const firstLine = lines[0] || "";
  const rest = lines.slice(1).join("\n");

  const header = normalizeHeader(firstLine, original);
  const body = normalizeBody(rest);

  if (!body) return header;
  return `${header}\n\n${body}`;
}

export function lintAndFixCommitMessage(message) {
  const original = (message || "").trim();
  const fixed = autoFixCommitMessage(message);
  const result = validateCommitMessage(fixed);
  return {
    message: fixed,
    valid: result.valid,
    errors: result.errors,
    wasFixed: fixed !== original,
  };
}

export { CONVENTIONAL_TYPES };
