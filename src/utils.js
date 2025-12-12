import i18n from "./i18n.js";

export function buildPrompt(diff, hint) {
  const lang = i18n.getCurrentLanguage?.() || "en";
  const promptType = i18n.getConfig('promptType') || 'default';
  const customPrompt = i18n.getConfig('customPrompt');

  // 1. Handle Custom
  if (promptType === 'custom' && customPrompt) {
    return customPrompt
      .replace(/\{diff\}/g, diff)
      .replace(/\{hint\}/g, hint || '')
      .replace(/\{locale\}/g, lang);
  }

  // 2. Handle Simple (Title only)
  if (promptType === 'simple') {
     return [
        "You are a professional commit message generator.",
        "Generate a SINGLE line commit title from the following git diff.",
        "Format: <type>: <description>",
        `Language: ${lang}`,
        hint ? `Additional context: ${hint}` : "",
        "Here is the change summary:\n\n" + diff
     ].filter(Boolean).join("\n");
  }

  const baseRequirements = [
      "Requirements:",
      "- Choose appropriate type: feat|fix|docs|refactor|perf|build|chore|test|ci|style",
      "- Title must be concise and clear, describing only the main changes",
      "- Ignore minor details, focus on main functional changes",
      "- If there are breaking changes, start description with BREAKING CHANGE:",
  ];

  if (promptType === 'emoji') {
      baseRequirements.push("- Use Gitmoji style emojis at the beginning of the title (e.g. 🐛 fix:, ✨ feat:)");
  }

  let langRequirements = [];
  let lengthConstraint = "";

  switch (lang) {
    case "zh":
        langRequirements = [
            "- Description should be in Chinese and focus on core changes",
            "- IMPORTANT: The total length of the commit message (including title and description) must NOT exceed 18 Chinese characters",
            "- Keep it extremely concise and to the point"
        ];
        lengthConstraint = "Please output only the commit message itself, no explanations. Format: type: short title\n\ndescription (optional)";
        break;
    case "ko":
        langRequirements = [
            "- Description should be in Korean (Hangul)",
            "- IMPORTANT: The total length of the commit message must be under 25 characters",
            "- Use polite but concise language"
        ];
        lengthConstraint = "Output only the commit message. Format: type: short title\n\ndescription (optional)";
        break;
    case "ja":
        langRequirements = [
            "- Description should be in Japanese",
            "- IMPORTANT: The total length of the commit message must be under 25 characters",
            "- Use concise technical Japanese"
        ];
        lengthConstraint = "Output only the commit message. Format: type: short title\n\ndescription (optional)";
        break;
    case "es":
        langRequirements = [
            "- Description should be in Spanish",
            "- IMPORTANT: Keep total length under 80 characters",
            "- Use concise technical Spanish"
        ];
        lengthConstraint = "Output only the commit message. Format: type: short title\n\ndescription (optional)";
        break;
    case "ar":
        langRequirements = [
            "- Description should be in Arabic",
            "- IMPORTANT: Keep total length under 80 characters",
            "- Use concise technical Arabic"
        ];
        lengthConstraint = "Output only the commit message. Format: type: short title\n\ndescription (optional)";
        break;
    default: // en
        langRequirements = [
            "- Title and description must be in English",
            "- IMPORTANT: Keep total length (title + description) under 80 characters"
        ];
        lengthConstraint = "Output only the commit message, no explanations. Format: type: short title\n\ndescription (optional)";
        break;
  }

  return [
    "You are a professional commit message generator. Generate a Conventional Commits style commit message from the following git diff.",
    ...baseRequirements,
    ...langRequirements,
    hint ? `Additional context: ${hint}` : "",
    "Here is the change summary:\n\n" + diff,
    "\n" + lengthConstraint,
    "\nIMPORTANT: Please generate 3 distinct commit message options. Separate each option with \"---OPTION---\". Do not number them or add labels like 'Option 1'. Output ONLY the raw commit message for each option.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function parseOptions(text) {
  if (!text) return [];
  return text
    .split("---OPTION---")
    .map(opt => assembleCommitText(opt))
    .filter(opt => opt.length > 0);
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

  // Split diff by file
  const sections = diff.split(/\n(?=diff --git )/g);
  const summaries = [];
  let totalAdds = 0;
  let totalDels = 0;
  let fileCount = 0;
  let currentChars = 0;

  // Sort by change size, prioritize important changes
  const sortedSections = sections
    .filter((sec) => sec.trim() && sec.startsWith("diff --git "))
    .map((sec) => {
      const lines = sec.split("\n");
      let adds = 0,
        dels = 0;
      for (const l of lines) {
        if (l.startsWith("+") && !l.startsWith("+++")) adds++;
        else if (l.startsWith("-") && !l.startsWith("---")) dels++;
      }
      return { section: sec, adds, dels, total: adds + dels };
    })
    .sort((a, b) => b.total - a.total); // Sort descending by change amount

  for (const { section } of sortedSections) {
    if (fileCount >= maxFiles) break;

    const lines = section.split("\n");
    const header = lines[0];
    const aPath = header.match(/ a\/([^ ]+)/)?.[1];
    const bPath = header.match(/ b\/([^ ]+)/)?.[1] || aPath;

    // Simplified change type detection
    let changeType = "M";
    if (lines.some((l) => l.startsWith("new file mode"))) changeType = "A";
    else if (lines.some((l) => l.startsWith("deleted file mode")))
      changeType = "D";
    else if (lines.some((l) => l.startsWith("rename from "))) changeType = "R";

    let adds = 0;
    let dels = 0;
    const snippets = [];

    // Count changed lines
    for (const l of lines) {
      if (l.startsWith("+++") || l.startsWith("---")) continue;
      if (l.startsWith("+")) adds++;
      else if (l.startsWith("-")) dels++;
    }

    totalAdds += adds;
    totalDels += dels;

    // Intelligent snippet extraction
    if (includeAddedSnippets && (adds > 0 || dels > 0)) {
      let collected = 0;

      for (const l of lines) {
        // Skip file headers and meta info
        if (
          l.startsWith("+++") ||
          l.startsWith("---") ||
          l.startsWith("diff --git ") ||
          l.startsWith("index ") ||
          l.startsWith("new file") ||
          l.startsWith("deleted file") ||
          l.startsWith("similarity index") ||
          l.startsWith("rename ")
        )
          continue;

        // Keep Hunk headers for context
        if (l.startsWith("@@")) {
          if (collected < maxLinesPerFile) {
            snippets.push(l);
          }
          continue;
        }

        // Collect both added and deleted lines for better context
        if (l.startsWith("+") || l.startsWith("-")) {
          const content = l.slice(1);
          // Only skip completely empty lines, KEEP comments for documentation updates
          if (content.trim()) {
            snippets.push(l);
            collected++;
            if (collected >= maxLinesPerFile) {
              snippets.push("...");
              break;
            }
          }
        }
      }
    }

    const fileLine = `${changeType} ${bPath} (+${adds} -${dels})`;
    const fileSummary = [fileLine, ...snippets].join("\n");

    // Check char limit
    if (currentChars + fileSummary.length > maxChars) {
      break;
    }

    summaries.push(fileSummary);
    currentChars += fileSummary.length;
    fileCount++;
  }

  // Add omission info if too many files
  if (sections.length > fileCount) {
    summaries.push(`... ${i18n.t("compression.moreFiles", { count: sections.length - fileCount })}`);
  }

  const head = i18n.t("compression.summary", { 
    total: sections.length, 
    adds: totalAdds, 
    dels: totalDels, 
    shown: fileCount 
  });
  return [head, ...summaries].join("\n\n");
}
