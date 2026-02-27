import { execSync } from "node:child_process";
import fs from "node:fs";
import axios from "axios";
import chalk from "chalk";
import boxen from "boxen";
import i18n from "./i18n.js";
import { classifyError } from "./error_utils.js";

const DEFAULT_CONFIG = {
  BASE_URL: "https://api.openai.com/v1",
  MODEL: "gpt-3.5-turbo",
};

function runCommand(cmd) {
  try {
    const output = execSync(cmd, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      maxBuffer: 2 * 1024 * 1024,
    }).trim();
    return { ok: true, output };
  } catch (error) {
    const stderr = error?.stderr?.toString?.().trim?.();
    const stdout = error?.stdout?.toString?.().trim?.();
    return {
      ok: false,
      output: stdout || "",
      error: stderr || error?.message || "Unknown error",
    };
  }
}

function resolveRuntimeConfig() {
  const apiKey = process.env.AI_COMMIT_API_KEY || i18n.getConfig("apiKey");
  const baseUrl =
    process.env.AI_COMMIT_BASE_URL ||
    process.env.OPENAI_BASE_URL ||
    i18n.getConfig("baseUrl") ||
    DEFAULT_CONFIG.BASE_URL;
  const model =
    process.env.AI_COMMIT_MODEL ||
    process.env.OPENAI_MODEL ||
    i18n.getConfig("model") ||
    DEFAULT_CONFIG.MODEL;

  return { apiKey, baseUrl, model };
}

function getStatusStyle(status) {
  if (status === "pass") return chalk.green;
  if (status === "warn") return chalk.yellow;
  return chalk.red;
}

function getStatusIcon(status) {
  if (status === "pass") return "✅";
  if (status === "warn") return "⚠️";
  return "❌";
}

function printResult(result) {
  const color = getStatusStyle(result.status);
  const statusLabel = i18n.t(`doctor.status.${result.status}`);
  console.log(
    `${getStatusIcon(result.status)} ${color(result.title)} ${chalk.gray(
      `[${statusLabel}]`
    )}`
  );
  if (result.detail) console.log(`   ${result.detail}`);
  if (result.hint) console.log(`   ${chalk.gray(result.hint)}`);
}

function endpointFromBaseUrl(baseUrl) {
  const trimmed = (baseUrl || "").replace(/\/$/, "");
  if (trimmed.endsWith("/chat/completions")) {
    return trimmed.replace(/\/chat\/completions$/, "/models");
  }
  return `${trimmed}/models`;
}

function checkNodeVersion() {
  const current = process.versions.node;
  const major = parseInt(current.split(".")[0], 10);
  if (major >= 18) {
    return {
      title: i18n.t("doctor.checks.node"),
      status: "pass",
      detail: i18n.t("doctor.details.nodeOk", { version: current }),
    };
  }
  return {
    title: i18n.t("doctor.checks.node"),
    status: "fail",
    detail: i18n.t("doctor.details.nodeTooLow", { version: current }),
    hint: i18n.t("doctor.hints.nodeUpgrade"),
  };
}

function checkGitBinary() {
  const result = runCommand("git --version");
  if (result.ok) {
    return {
      title: i18n.t("doctor.checks.gitBinary"),
      status: "pass",
      detail: result.output,
    };
  }
  return {
    title: i18n.t("doctor.checks.gitBinary"),
    status: "fail",
    detail: result.error,
    hint: i18n.t("doctor.hints.installGit"),
  };
}

function checkGitRepo() {
  const result = runCommand("git rev-parse --is-inside-work-tree");
  if (result.ok && result.output === "true") {
    return {
      title: i18n.t("doctor.checks.gitRepo"),
      status: "pass",
      detail: i18n.t("doctor.details.gitRepoOk"),
    };
  }
  return {
    title: i18n.t("doctor.checks.gitRepo"),
    status: "fail",
    detail: i18n.t("doctor.details.gitRepoFail"),
    hint: i18n.t("doctor.hints.initGit"),
  };
}

function checkConfigFile() {
  const filePath = i18n.CONFIG_FILE;
  if (!fs.existsSync(filePath)) {
    return {
      title: i18n.t("doctor.checks.configFile"),
      status: "warn",
      detail: i18n.t("doctor.details.configMissing", { path: filePath }),
      hint: i18n.t("doctor.hints.runConfig"),
    };
  }

  try {
    JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      title: i18n.t("doctor.checks.configFile"),
      status: "pass",
      detail: i18n.t("doctor.details.configOk", { path: filePath }),
    };
  } catch (error) {
    return {
      title: i18n.t("doctor.checks.configFile"),
      status: "fail",
      detail: i18n.t("doctor.details.configInvalid", { path: filePath }),
      hint: i18n.t("doctor.hints.resetConfig"),
    };
  }
}

function checkApiKey(apiKey) {
  if (apiKey) {
    return {
      title: i18n.t("doctor.checks.apiKey"),
      status: "pass",
      detail: i18n.t("doctor.details.apiKeyOk"),
    };
  }
  return {
    title: i18n.t("doctor.checks.apiKey"),
    status: "fail",
    detail: i18n.t("doctor.details.apiKeyMissing"),
    hint: i18n.t("doctor.hints.runConfig"),
  };
}

function checkBaseUrl(baseUrl) {
  if (!baseUrl) {
    return {
      title: i18n.t("doctor.checks.baseUrl"),
      status: "fail",
      detail: i18n.t("doctor.details.baseUrlMissing"),
      hint: i18n.t("doctor.hints.runConfig"),
    };
  }
  return {
    title: i18n.t("doctor.checks.baseUrl"),
    status: "pass",
    detail: baseUrl,
  };
}

function checkModel(model) {
  if (!model) {
    return {
      title: i18n.t("doctor.checks.model"),
      status: "warn",
      detail: i18n.t("doctor.details.modelMissing"),
    };
  }
  return {
    title: i18n.t("doctor.checks.model"),
    status: "pass",
    detail: model,
  };
}

function checkGitChanges() {
  const staged = runCommand("git diff --cached --name-only");
  const working = runCommand("git diff --name-only");

  if (!staged.ok || !working.ok) {
    return {
      title: i18n.t("doctor.checks.gitChanges"),
      status: "warn",
      detail: i18n.t("doctor.details.gitChangesUnknown"),
    };
  }

  const stagedCount = staged.output ? staged.output.split("\n").length : 0;
  const workingCount = working.output ? working.output.split("\n").length : 0;

  if (stagedCount === 0 && workingCount === 0) {
    return {
      title: i18n.t("doctor.checks.gitChanges"),
      status: "warn",
      detail: i18n.t("doctor.details.gitChangesNone"),
      hint: i18n.t("doctor.hints.addChanges"),
    };
  }

  return {
    title: i18n.t("doctor.checks.gitChanges"),
    status: "pass",
    detail: i18n.t("doctor.details.gitChangesOk", {
      staged: stagedCount,
      working: workingCount,
    }),
  };
}

async function checkEndpoint(baseUrl, apiKey) {
  if (!apiKey) {
    return {
      title: i18n.t("doctor.checks.endpoint"),
      status: "warn",
      detail: i18n.t("doctor.details.endpointSkipped"),
    };
  }

  const endpoint = endpointFromBaseUrl(baseUrl);

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 7000,
    });

    return {
      title: i18n.t("doctor.checks.endpoint"),
      status: "pass",
      detail: i18n.t("doctor.details.endpointOk", {
        endpoint,
        status: response.status,
      }),
    };
  } catch (error) {
    const info = classifyError(error);
    const category = i18n.t(`errors.categories.${info.category}`);
    const hint = i18n.t(`errors.hints.${info.category}`);
    const statusLabel = info.status ? `HTTP ${info.status}` : info.message;
    const isAuthFailure = info.category === "auth";

    return {
      title: i18n.t("doctor.checks.endpoint"),
      status: isAuthFailure ? "fail" : "warn",
      detail: i18n.t("doctor.details.endpointFail", {
        endpoint,
        category,
        reason: statusLabel || i18n.t("errors.unknownMessage"),
      }),
      hint: hint === `errors.hints.${info.category}` ? "" : hint,
    };
  }
}

export async function runDoctorCommand() {
  const checks = [];
  const runtimeConfig = resolveRuntimeConfig();

  checks.push(checkNodeVersion());
  checks.push(checkGitBinary());

  const gitRepoCheck = checkGitRepo();
  checks.push(gitRepoCheck);

  checks.push(checkConfigFile());
  checks.push(checkApiKey(runtimeConfig.apiKey));
  checks.push(checkBaseUrl(runtimeConfig.baseUrl));
  checks.push(checkModel(runtimeConfig.model));

  if (gitRepoCheck.status === "pass") {
    checks.push(checkGitChanges());
  }

  const endpointCheck = await checkEndpoint(
    runtimeConfig.baseUrl,
    runtimeConfig.apiKey
  );
  checks.push(endpointCheck);

  console.log(
    "\n" +
      chalk.cyan.bold(
        boxen(i18n.t("doctor.title"), {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "cyan",
        })
      )
  );

  checks.forEach((check) => printResult(check));

  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const passCount = checks.filter((c) => c.status === "pass").length;

  console.log(chalk.gray("─".repeat(50)));
  console.log(
    chalk.cyan(
      i18n.t("doctor.summary", {
        pass: passCount,
        warn: warnCount,
        fail: failCount,
      })
    )
  );

  if (failCount > 0) {
    process.exitCode = 1;
  }
}
