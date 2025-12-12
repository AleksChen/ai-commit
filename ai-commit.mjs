#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { program } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";
import { onExit } from "signal-exit";
import axios from "axios";
import updateNotifier from "update-notifier";
import i18n from "./src/i18n.js";

process.on("SIGINT", () => {
  console.log(
    "\n" +
      chalk.yellow(i18n.t("commit.operationCancelled"))
  );
  process.exit(0);
});
import { handleConfigCommand, setApiKeys } from "./src/config.js";
import { recordUsage, showStats } from "./src/cost_stats.js";
import { buildPrompt, assembleCommitText, compressDiff, parseOptions } from "./src/utils.js";

const pkg = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

updateNotifier({ pkg }).notify();

const DEFAULT_CONFIG = {
  BASE_URL: "https://api.openai.com/v1",
  MODEL: "gpt-3.5-turbo",
};

// State tracking for cleanup
let tempFilePath = null;

// Register exit cleanup
onExit(() => {
  if (tempFilePath && fs.existsSync(tempFilePath)) {
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}
  }
});

function run(cmd) {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

function getGitDir() {
  try {
    return run("git rev-parse --git-dir");
  } catch {
    return null;
  }
}

function ensureGitRepo() {
  const gitDir = getGitDir();
  if (!gitDir) {
    console.error(chalk.red(i18n.t("git.notRepo")));
    process.exit(1);
  }
  return gitDir;
}

// Get changes: staged first, return null if none
function getDiff(type = "staged") {
  try {
    if (type === "staged") {
      // Filter irrelevant states (Unknown, Ignored)
      const diff = run("git diff --cached --diff-filter=ACDMR");
      return diff || null;
    }
    return run("git diff --diff-filter=ACDMR") || null;
  } catch (e) {
    return null;
  }
}

async function checkAndStageFiles() {
  // 1. Check staged changes
  let diff = getDiff("staged");
  if (diff) return diff;

  // 2. Staged is empty, check working directory
  const workingDiff = getDiff("working");
  if (!workingDiff) {
    console.error(chalk.red(i18n.t("git.noChanges")));
    process.exit(1);
  }

  // 3. Ask to stage all
  console.log(
    chalk.yellow(i18n.t("git.stagedEmpty"))
  );

  // Check if auto-stage is enabled via env var
  const autoStageEnv = process.env.AI_COMMIT_AUTO_STAGE;
  if (autoStageEnv === "1") {
    // Auto stage without asking
  } else if (autoStageEnv === "0") {
    console.error(chalk.red(i18n.t("git.noChanges")));
    process.exit(1);
  } else {
    // Ask by default
    const { confirmStage } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmStage",
        message: i18n.t("git.confirmStageAll"),
        default: true,
      },
    ]);

    if (!confirmStage) {
      console.log(chalk.gray(i18n.t("commit.operationCancelled")));
      process.exit(0);
    }
  }

  const spinner = ora(i18n.t("git.staging")).start();
  try {
    run("git add -A");
    spinner.succeed(i18n.t("git.staged"));
    return getDiff("staged");
  } catch (e) {
    spinner.fail(i18n.t("git.stagingFailed"));
    process.exit(1);
  }
}

async function getAuth() {
  let apiKey = process.env.AI_COMMIT_API_KEY || i18n.getConfig("apiKey");
  let baseUrl =
    process.env.AI_COMMIT_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    i18n.getConfig("baseUrl") ||
    DEFAULT_CONFIG.BASE_URL;
  let model =
    process.env.AI_COMMIT_MODEL ||
    process.env.OPENAI_MODEL ||
    i18n.getConfig("model") ||
    DEFAULT_CONFIG.MODEL;

  if (!apiKey) {
    console.log(chalk.yellow(i18n.t("auth.setupRequired")));
    await setApiKeys();
    apiKey = i18n.getConfig("apiKey");
    baseUrl = i18n.getConfig("baseUrl") || DEFAULT_CONFIG.BASE_URL;
    model = i18n.getConfig("model") || DEFAULT_CONFIG.MODEL;

    if (!apiKey) {
      console.error(chalk.red(i18n.t("auth.setupRequired")));
      process.exit(1);
    }
  }
  return { apiKey, baseUrl, model };
}

async function callAI(messages, { apiKey, baseUrl, model }) {
  let endpoint = baseUrl.replace(/\/$/, "");
  if (!endpoint.endsWith("/chat/completions")) {
    endpoint = `${endpoint}/chat/completions`;
  }

  try {
    const response = await axios.post(
      endpoint,
      { model, messages, stream: false },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 60_000,
      }
    );

    const result = response.data;
    if (result.error)
      throw new Error(result.error.message || JSON.stringify(result.error));

    const choice = result?.choices?.[0];
    return {
      content: choice?.message?.content?.trim?.(),
      reasoning: choice?.message?.reasoning_content?.trim?.(),
      tokens: {
        prompt: result.usage?.prompt_tokens || 0,
        completion: result.usage?.completion_tokens || 0,
        total: result.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    if (error.response) {
      throw new Error(
        `API (${error.response.status}): ${
          error.response.data?.error?.message ||
          JSON.stringify(error.response.data)
        }`
      );
    }
    throw error;
  }
}

async function generateWithSelection(prompt, auth, options, isRegen = false) {
  const spinnerLabel = isRegen ? "ai.regenerating" : "ai.generating";
  const successLabel = isRegen ? "ai.regenerated" : "ai.generated";
  
  const spinner = ora(i18n.t(spinnerLabel)).start();
  const startTime = Date.now();

  try {
    const { content, tokens } = await callAI(
      [{ role: "user", content: prompt }],
      auth
    );
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    spinner.succeed(i18n.t(successLabel, { duration }));

    if (tokens.total > 0) {
       if (!options.quiet) {
          console.log(chalk.gray(i18n.t("ai.tokens", {
              prompt: tokens.prompt,
              completion: tokens.completion,
              total: tokens.total
          })));
       }
       recordUsage({
           model: auth.model,
           duration: parseFloat(duration),
           tokens
       });
    }

    const choices = parseOptions(content);
    if (!choices || choices.length === 0) {
        throw new Error(i18n.t("ai.noMessage"));
    }

    if (options.write || options.print || choices.length === 1) {
        return choices[0];
    }

    // Display options
    console.log("");
    choices.forEach((c, i) => {
        console.log(chalk.yellow(`Option ${i + 1}:`));
        console.log(chalk.gray("----------------------------------------"));
        console.log(c);
        console.log(chalk.gray("----------------------------------------\n"));
    });

    const { selectedIndex } = await inquirer.prompt([
        {
            type: "list",
            name: "selectedIndex",
            message: i18n.t("commit.selectOption"),
            choices: choices.map((c, i) => ({
                name: `Option ${i + 1}: ${c.split('\n')[0].substring(0, 50)}...`,
                value: i
            }))
        }
    ]);
    return choices[selectedIndex];

  } catch (error) {
      spinner.fail(i18n.t(isRegen ? "ai.regenerationFailed" : "ai.generationFailed"));
      throw error;
  }
}

// Main command logic
async function runMain(options, hintParts) {
  // Banner
  if (!options.quiet) {
    console.log(
      "\n" +
        chalk.cyan.bold(
          figlet.textSync(i18n.t("banner.title"), { font: "Standard" })
        )
    );
    console.log(chalk.gray(i18n.t("banner.subtitle")));
  }

  const gitDir = ensureGitRepo();
  if (!options.quiet) console.log(chalk.blue(i18n.t("git.detecting")));

  // Process changes
  const diff = await checkAndStageFiles();

  if (!options.quiet) {
    console.log(chalk.blue(i18n.t("git.readingChanges")));
  }

  // Stats
  const sections = diff.split(/\n(?=diff --git )/g);
  const totalFiles = sections.filter(
    (sec) => sec.trim() && sec.startsWith("diff --git ")
  ).length;
  let totalAdds = 0,
    totalDels = 0;
  for (const sec of sections) {
    if (!sec.trim() || !sec.startsWith("diff --git ")) continue;
    const lines = sec.split("\n");
    for (const l of lines) {
      if (l.startsWith("+") && !l.startsWith("+++")) totalAdds++;
      else if (l.startsWith("-") && !l.startsWith("---")) totalDels++;
    }
  }

  if (!options.quiet) {
    console.log(
      chalk.cyan(
        i18n.t("compression.stats", {
          files: totalFiles,
          adds: totalAdds,
          dels: totalDels,
        })
      )
    );
    console.log(chalk.blue(i18n.t("auth.getting")));
  }

  // Auth
  const auth = await getAuth();
  if (!options.quiet) console.log(chalk.green(i18n.t("auth.success")));

  // Compression
  const compressionOptions = {
    maxChars: parseInt(process.env.AI_COMMIT_MAX_CHARS) || 200000,
    maxFiles: parseInt(process.env.AI_COMMIT_MAX_FILES) || 50,
    maxLinesPerFile: parseInt(process.env.AI_COMMIT_MAX_LINES) || 15,
    includeAddedSnippets:
      (process.env.AI_COMMIT_INCLUDE_SNIPPETS ?? "1") !== "0",
  };

  const compressSpinner = ora(i18n.t("compression.compressing")).start();
  const condensed = compressDiff(diff, compressionOptions);
  compressSpinner.succeed(
    i18n.t("compression.compressed", { length: condensed.length })
  );

  const hint = hintParts.join(" ");
  const prompt = buildPrompt(condensed, hint);

  let commitMsg;
  try {
    commitMsg = await generateWithSelection(prompt, auth, options, false);
  } catch (error) {
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Direct write mode (Hook)
  if (options.write) {
    try {
      fs.writeFileSync(options.write, commitMsg, "utf8");
      console.log(
        chalk.green(i18n.t("commit.writeSuccess", { path: options.write }))
      );
    } catch (e) {
      console.error(chalk.red(i18n.t("commit.writeFailed")), e.message);
      process.exit(1);
    }
    return;
  }

  // Print mode only
  if (options.print) {
    console.log(
      "\n" +
        boxen(chalk.cyan(i18n.t("commit.generated")), {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "cyan",
        })
    );
    console.log(commitMsg);
    return;
  }

  // Interactive confirmation loop
  while (true) {
    console.log(
      "\n" +
        boxen(chalk.cyan(commitMsg), {
          padding: 1,
          borderStyle: "round",
          borderColor: "cyan",
        })
    );

    // Length warning
    const chineseCharCount = (commitMsg.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (chineseCharCount > 18) {
      console.log(
        chalk.yellow(
          i18n.t("commit.lengthWarning", { count: chineseCharCount })
        )
      );
    }

    const { userChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "userChoice",
        message: i18n.t("commit.selectAction"),
        choices: [
          {
            name: chalk.green(i18n.t("commit.choices.commit")),
            value: "commit",
          },
          { name: chalk.yellow(i18n.t("commit.choices.edit")), value: "edit" },
          {
            name: chalk.blue(i18n.t("commit.choices.regenerate")),
            value: "regenerate",
          },
          { name: chalk.red(i18n.t("commit.choices.abort")), value: "abort" },
        ],
      },
    ]);

    if (userChoice === "abort") {
      console.log(chalk.red(i18n.t("commit.operationCancelled")));
      process.exit(0);
    }

    if (userChoice === "commit") break;

    if (userChoice === "edit") {
      const { newMsg } = await inquirer.prompt([
        {
          type: "editor",
          name: "newMsg",
          message: i18n.t("commit.editPrompt"),
          default: commitMsg,
          waitUserInput: true,
        },
      ]);
      commitMsg = newMsg.trim();
    }

    if (userChoice === "regenerate") {
      try {
        const newMsg = await generateWithSelection(prompt, auth, options, true);
        if (newMsg) commitMsg = newMsg;
      } catch (e) {
        console.error(e.message);
      }
    }
  }

  // Execute commit
  const commitSpinner = ora(i18n.t("git.commitExecuting")).start();
  // Store temp file in .git to avoid pollution
  tempFilePath = path.join(gitDir, "COMMIT_EDITMSG_AI_TEMP");

  try {
    fs.writeFileSync(tempFilePath, commitMsg, "utf8");

    const args = ["commit", "-F", tempFilePath];
    if (process.env.AI_COMMIT_SIGN === "1") args.push("-S");
    if (process.env.AI_COMMIT_AMEND === "1") args.push("--amend");

    run(`git ${args.join(" ")}`);

    // Manual cleanup (explicit better than onExit here)
    try {
      fs.unlinkSync(tempFilePath);
    } catch {}
    tempFilePath = null;

    commitSpinner.succeed(i18n.t("git.commitSuccess"));
    console.log(
      "\n" +
        boxen(chalk.green(i18n.t("git.commitDoneBanner")), {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        })
    );
  } catch (e) {
    commitSpinner.fail(i18n.t("git.commitFailed"));
    console.error(chalk.red(e.message));
    process.exit(1);
  }
}

// CLI Definition
program
  .name("ai-commit")
  .description(pkg.description)
  .version(pkg.version)
  .option("-p, --print", "Print the commit message instead of committing")
  .option(
    "-w, --write <path>",
    "Write the commit message to a file (hook mode)"
  )
  .option("-q, --quiet", "Suppress banner and info logs")
  .argument("[hint...]", "Optional hint for the AI generation")
  .action((hintParts, options) => {
    runMain(options, hintParts).catch((e) => {
      // Handle Inquirer force close error
      if (
        e.message.includes("User force closed") ||
        e.name === "ExitPromptError"
      ) {
        console.log(
          "\n" +
            chalk.yellow(i18n.t("commit.operationCancelled"))
        );
        process.exit(0);
      }
      console.error(chalk.red(i18n.t("common.fatalError")), e.message);
      process.exit(1);
    });
  });

program
  .command("config")
  .description("Configure API keys and language")
  .action(async () => {
    await handleConfigCommand().catch((e) => {
      if (
        e.message.includes("User force closed") ||
        e.name === "ExitPromptError"
      ) {
        console.log(
          "\n" +
            chalk.yellow(i18n.t("commit.operationCancelled"))
        );
        process.exit(0);
      }
      console.error(chalk.red(i18n.t("common.configError")), e.message);
      process.exit(1);
    });
  });

program
  .command("cost")
  .description("Show AI usage statistics")
  .action(() => {
    showStats();
  });

program.parse();
