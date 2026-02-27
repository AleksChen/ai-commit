import i18n from "./i18n.js";

export function buildPrompt(diff, hint) {
  const lang = i18n.getCurrentLanguage?.() || "en";
  const promptType = i18n.getConfig("promptType") || "default";
  const customPrompt = i18n.getConfig("customPrompt");

  // 1. Handle Custom
  if (promptType === "custom" && customPrompt) {
    return customPrompt
      .replace(/\{diff\}/g, diff)
      .replace(/\{hint\}/g, hint || "")
      .replace(/\{locale\}/g, lang);
  }

  // 2. Handle Simple (Title only)
  if (promptType === "simple") {
    return [
      "You are a professional commit message generator.",
      "Generate a SINGLE line commit title from the following git diff.",
      "Format: <type>: <description>",
      `Language: ${lang}`,
      hint ? `Additional context: ${hint}` : "",
      "Here is the change summary:\n\n" + diff,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const baseRequirements = [
    "Requirements:",
    "- Choose appropriate type: feat|fix|docs|refactor|perf|build|chore|test|ci|style",
    "- Title must be concise and clear, describing only the main changes",
    "- Ignore minor details, focus on main functional changes",
    "- If there are breaking changes, start description with BREAKING CHANGE:",
  ];

  if (promptType === "emoji") {
    baseRequirements.push(
      "- Use Gitmoji style emojis at the beginning of the title (e.g. 🐛 fix:, ✨ feat:)"
    );
  }

  let langRequirements = [];
  let lengthConstraint = "";

  switch (lang) {
    case "zh":
      langRequirements = [
        "- Description should be in Chinese and focus on core changes",
        "- IMPORTANT: The total length of the commit message (including title and description) must NOT exceed 18 Chinese characters",
        "- Keep it extremely concise and to the point",
      ];
      lengthConstraint =
        "Please output only the commit message itself, no explanations. Format: type: short title\n\ndescription (optional)";
      break;
    case "ko":
      langRequirements = [
        "- Description should be in Korean (Hangul)",
        "- IMPORTANT: The total length of the commit message must be under 25 characters",
        "- Use polite but concise language",
      ];
      lengthConstraint =
        "Output only the commit message. Format: type: short title\n\ndescription (optional)";
      break;
    case "ja":
      langRequirements = [
        "- Description should be in Japanese",
        "- IMPORTANT: The total length of the commit message must be under 25 characters",
        "- Use concise technical Japanese",
      ];
      lengthConstraint =
        "Output only the commit message. Format: type: short title\n\ndescription (optional)";
      break;
    case "es":
      langRequirements = [
        "- Description should be in Spanish",
        "- IMPORTANT: Keep total length under 80 characters",
        "- Use concise technical Spanish",
      ];
      lengthConstraint =
        "Output only the commit message. Format: type: short title\n\ndescription (optional)";
      break;
    case "ar":
      langRequirements = [
        "- Description should be in Arabic",
        "- IMPORTANT: Keep total length under 80 characters",
        "- Use concise technical Arabic",
      ];
      lengthConstraint =
        "Output only the commit message. Format: type: short title\n\ndescription (optional)";
      break;
    default: // en
      langRequirements = [
        "- Title and description must be in English",
        "- IMPORTANT: Keep total length (title + description) under 80 characters",
      ];
      lengthConstraint =
        "Output only the commit message, no explanations. Format: type: short title\n\ndescription (optional)";
      break;
  }

  return [
    "You are a professional commit message generator. Generate a Conventional Commits style commit message from the following git diff.",
    ...baseRequirements,
    ...langRequirements,
    hint ? `Additional context: ${hint}` : "",
    "Here is the change summary:\n\n" + diff,
    "\n" + lengthConstraint,
    `\nIMPORTANT:
      - You MUST generate EXACTLY 3 commit message options.
      - Output format:
        1) First option text
        2) A single line containing ONLY: ---OPTION---
        3) Second option text
        4) A single line containing ONLY: ---OPTION---
        5) Third option text
      - Do NOT add numbering like "Option 1", "1.", "(1)".
      - Do NOT add any explanation, comment, or markdown code fences.
      - Do NOT use the string ---OPTION--- inside any commit message content.

      GOOD EXAMPLE (structure only, content is placeholder):
      feat: first title

      ---OPTION---
      fix: second title

      ---OPTION---
      docs: third title

      BAD EXAMPLE (DO NOT DO THIS):
      Option 1: feat: foo
      ---OPTION--- Option 2: fix: bar`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseOptions(text) {
  if (!text) return [];

  // First, clean the text to handle potential escape sequences
  let cleaned = text.trim();

  // Try multiple splitting strategies in order of preference

  // Strategy 1: Standard separator with flexible whitespace (case-insensitive)
  // Matches: ---OPTION---, ---option---, --- OPTION ---, etc.
  const separators = [
    /---\s*OPTION\s*---/gi, // Standard: ---OPTION---
    /--\s*OPTION\s*--/gi, // Variant: --OPTION--
    /====\s*OPTION\s*====/gi, // Variant: ====OPTION====
    /^\s*OPTION\s*\d+\s*:?\s*$/gim, // Variant: OPTION 1:
    /^\s*Option\s*\d+\s*:?\s*$/gim, // Variant: Option 1:
  ];

  for (const separatorRegex of separators) {
    // Reset regex lastIndex for global regex
    separatorRegex.lastIndex = 0;
    if (separatorRegex.test(cleaned)) {
      separatorRegex.lastIndex = 0; // Reset again before split
      const parts = cleaned.split(separatorRegex);
      if (parts.length > 1) {
        const options = parts
          .map((opt) => assembleCommitText(opt))
          .filter((opt) => opt.length > 0);
        if (options.length > 0) return options;
      }
    }
  }

  // Strategy 2: Split by multiple consecutive blank lines (likely separator)
  // This handles cases where AI uses blank lines to separate options
  const doubleNewlineRegex = /\n\s*\n\s*\n+/;
  if (doubleNewlineRegex.test(cleaned)) {
    const parts = cleaned.split(/\n\s*\n\s*\n+/);
    if (parts.length >= 2) {
      // Filter out very short parts (likely not valid commit messages)
      const options = parts
        .map((opt) => assembleCommitText(opt))
        .filter((opt) => opt.length > 10); // Minimum length for a commit message
      if (options.length >= 2) return options;
    }
  }

  // Strategy 3: Try to detect numbered options (Option 1:, 1., etc.)
  const numberedPattern = /^(?:Option\s*)?\d+[.:]\s*/gim;
  numberedPattern.lastIndex = 0;
  if (numberedPattern.test(cleaned)) {
    numberedPattern.lastIndex = 0; // Reset before split
    const parts = cleaned.split(numberedPattern);
    if (parts.length > 1) {
      // First part might be preamble, skip if too short
      const options = parts
        .slice(1) // Skip first part (usually preamble)
        .map((opt) => assembleCommitText(opt))
        .filter((opt) => opt.length > 0);
      if (options.length > 0) return options;
    }
  }

  // Strategy 4: If all else fails, treat as single option
  // But first check if it looks like multiple messages concatenated
  // by checking for multiple "type:" patterns (e.g., "feat:", "fix:")
  const typePattern =
    /^(feat|fix|docs|refactor|perf|build|chore|test|ci|style):/gim;
  const matches = cleaned.match(typePattern);
  if (matches && matches.length > 1) {
    // Likely multiple commit messages, try to split by type pattern
    const parts = cleaned.split(
      /(?=^(?:feat|fix|docs|refactor|perf|build|chore|test|ci|style):)/gim
    );
    if (parts.length > 1) {
      const options = parts
        .map((opt) => assembleCommitText(opt))
        .filter((opt) => opt.length > 0);
      if (options.length > 1) return options;
    }
  }

  // Fallback: return as single option
  const single = assembleCommitText(cleaned);
  return single ? [single] : [];
}

export function assembleCommitText(aiText) {
  // Model might return wrapped code blocks or extra text, clean it here
  let text = aiText || "";

  // Remove code block markers
  text = text.replace(/^```[a-zA-Z]*\n?|```$/g, "");

  // Remove escape characters and special symbols
  text = text
    .replace(/\\n/g, "\n") // Convert \n to real newline
    .replace(/\\t/g, "\t") // Convert \t to real tab
    .replace(/\\"/g, '"') // Convert \" to "
    .replace(/\\'/g, "'") // Convert \' to '
    .replace(/\\\\/g, "\\") // Convert \\ to \
    .replace(/\\r/g, "\r") // Convert \r to carriage return
    .replace(/\\b/g, "\b") // Convert \b to backspace
    .replace(/\\f/g, "\f"); // Convert \f to form feed

  // Remove other possible escape characters
  text = text.replace(/\\(.)/g, "$1");

  // Clean extra whitespace and newlines
  text = text
    .replace(/[ \t]+/g, " ") // Merge horizontal whitespace to single space
    .replace(/[ \t]*\n[ \t]*/g, "\n") // Remove horizontal whitespace around newlines
    .replace(/\n+/g, "\n") // Merge consecutive newlines
    .trim();

  return text;
}

const COMPRESSION_THRESHOLDS = {
  detailMaxFiles: 5,
  detailMaxLines: 200,
  hybridMaxFiles: 20,
  hybridMaxLines: 1500,
};

const CRITICAL_PATH_PATTERNS = [
  /(^|\/)package\.json$/i,
  /(^|\/)package-lock\.json$/i,
  /(^|\/)yarn\.lock$/i,
  /(^|\/)pnpm-lock\.ya?ml$/i,
  /(^|\/)go\.mod$/i,
  /(^|\/)go\.sum$/i,
  /(^|\/)cargo\.toml$/i,
  /(^|\/)cargo\.lock$/i,
  /(^|\/)pyproject\.toml$/i,
  /(^|\/)requirements\.txt$/i,
  /(^|\/)dockerfile$/i,
  /(^|\/)\.github\/workflows\//i,
  /schema/i,
  /migrations?/i,
];

function parseSectionMeta(section, id) {
  const lines = section.split("\n");
  const header = lines[0] || "";
  const aPath = header.match(/ a\/([^ ]+)/)?.[1];
  const bPath = header.match(/ b\/([^ ]+)/)?.[1] || aPath;

  let changeType = "M";
  if (lines.some((line) => line.startsWith("new file mode"))) changeType = "A";
  else if (lines.some((line) => line.startsWith("deleted file mode")))
    changeType = "D";
  else if (lines.some((line) => line.startsWith("rename from ")))
    changeType = "R";

  let adds = 0;
  let dels = 0;
  for (const line of lines) {
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) adds++;
    else if (line.startsWith("-")) dels++;
  }

  return {
    id,
    section,
    lines,
    aPath,
    bPath,
    changeType,
    adds,
    dels,
    total: adds + dels,
  };
}

function getCompressionMode(totalFiles, totalChangedLines) {
  if (
    totalFiles <= COMPRESSION_THRESHOLDS.detailMaxFiles &&
    totalChangedLines <= COMPRESSION_THRESHOLDS.detailMaxLines
  ) {
    return "detail";
  }
  if (
    totalFiles <= COMPRESSION_THRESHOLDS.hybridMaxFiles &&
    totalChangedLines <= COMPRESSION_THRESHOLDS.hybridMaxLines
  ) {
    return "hybrid";
  }
  return "overview";
}

function getModeConfig(mode, maxLinesPerFile) {
  if (mode === "detail") {
    return {
      snippetHotspotLimit: Number.POSITIVE_INFINITY,
      snippetLineLimit: maxLinesPerFile,
      includeCriticalPathSnippets: false,
    };
  }
  if (mode === "hybrid") {
    return {
      snippetHotspotLimit: 5,
      snippetLineLimit: Math.min(maxLinesPerFile, 10),
      includeCriticalPathSnippets: true,
    };
  }
  return {
    snippetHotspotLimit: 3,
    snippetLineLimit: Math.min(maxLinesPerFile, 3),
    includeCriticalPathSnippets: true,
  };
}

function isCriticalPath(filePath = "") {
  return CRITICAL_PATH_PATTERNS.some((pattern) => pattern.test(filePath));
}

function collectSnippets(lines, maxLinesPerFile) {
  if (maxLinesPerFile <= 0) return [];

  const snippets = [];
  let collected = 0;

  for (const line of lines) {
    if (
      line.startsWith("+++") ||
      line.startsWith("---") ||
      line.startsWith("diff --git ") ||
      line.startsWith("index ") ||
      line.startsWith("new file") ||
      line.startsWith("deleted file") ||
      line.startsWith("similarity index") ||
      line.startsWith("rename ")
    ) {
      continue;
    }

    if (line.startsWith("@@")) {
      if (collected < maxLinesPerFile) {
        snippets.push(line);
      }
      continue;
    }

    if (line.startsWith("+") || line.startsWith("-")) {
      const content = line.slice(1);
      if (content.trim()) {
        snippets.push(line);
        collected++;
        if (collected >= maxLinesPerFile) {
          snippets.push("...");
          break;
        }
      }
    }
  }

  return snippets;
}

export function compressDiff(
  diff,
  {
    maxChars = 200000,
    maxFiles = 50,
    maxLinesPerFile = 15,
    includeAddedSnippets = true,
  } = {}
) {
  if (!diff) return "";

  const sections = diff
    .split(/\n(?=diff --git )/g)
    .filter((section) => section.trim() && section.startsWith("diff --git "));

  if (sections.length === 0) return "";

  const parsedSections = sections.map((section, index) =>
    parseSectionMeta(section, index)
  );
  const totalAdds = parsedSections.reduce((sum, section) => sum + section.adds, 0);
  const totalDels = parsedSections.reduce((sum, section) => sum + section.dels, 0);
  const totalChangedLines = totalAdds + totalDels;
  const mode = getCompressionMode(parsedSections.length, totalChangedLines);
  const modeConfig = getModeConfig(mode, maxLinesPerFile);

  const sortedSections = [...parsedSections].sort((a, b) => b.total - a.total);
  const hotspotIds = new Set(
    sortedSections
      .slice(
        0,
        Math.min(modeConfig.snippetHotspotLimit, sortedSections.length)
      )
      .map((section) => section.id)
  );

  const summaries = [];
  let fileCount = 0;
  let currentChars = 0;

  for (const section of sortedSections) {
    if (fileCount >= maxFiles) break;

    const path = section.bPath || section.aPath || "unknown";
    const shouldIncludeSnippets =
      includeAddedSnippets &&
      (mode === "detail" ||
        hotspotIds.has(section.id) ||
        (modeConfig.includeCriticalPathSnippets && isCriticalPath(path)));

    let snippets = [];
    if (shouldIncludeSnippets && (section.adds > 0 || section.dels > 0)) {
      snippets = collectSnippets(section.lines, modeConfig.snippetLineLimit);
    }

    const fileLine = `${section.changeType} ${path} (+${section.adds} -${section.dels})`;
    const fileSummary =
      snippets.length > 0 ? [fileLine, ...snippets].join("\n") : fileLine;

    // Check char limit
    if (currentChars + fileSummary.length > maxChars) {
      break;
    }

    summaries.push(fileSummary);
    currentChars += fileSummary.length;
    fileCount++;
  }

  // Add omission info if too many files
  if (parsedSections.length > fileCount) {
    summaries.push(
      `... ${i18n.t("compression.moreFiles", {
        count: parsedSections.length - fileCount,
      })}`
    );
  }

  const head = i18n.t("compression.summary", {
    total: parsedSections.length,
    adds: totalAdds,
    dels: totalDels,
    shown: fileCount,
  });
  return [head, ...summaries].join("\n\n");
}
