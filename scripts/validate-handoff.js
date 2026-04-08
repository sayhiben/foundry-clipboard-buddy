const fs = require("node:fs");
const path = require("node:path");
const {execFileSync} = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const handoffDir = path.join(rootDir, "handoff");
const currentMdPath = path.join(handoffDir, "current.md");
const currentJsonPath = path.join(handoffDir, "current.json");
const historyPath = path.join(handoffDir, "history.ndjson");
const schemaPath = path.join(handoffDir, "schema.json");
const ignoredRepoStatePrefixes = ["handoff"];

const errors = [];

function fail(message) {
  errors.push(message);
}

function normalizeRepoRelativePath(value) {
  if (typeof value !== "string") return "";
  const normalized = value
    .replace(/\\/g, "/")
    .replace(/\/+$/, "")
    .replace(/^\.\//, "");
  if (!normalized) return ".";
  if (normalized === ".") return ".";
  const withPlatformRules = path.normalize(normalized).replace(/\\/g, "/");
  return withPlatformRules === "." ? "." : withPlatformRules.replace(/\/+$/, "");
}

function resolveRepoRelativePath(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`${label} must be a non-empty repo-relative path.`);
    return null;
  }
  if (path.isAbsolute(value)) {
    fail(`${label} must be repo-relative, not absolute: ${value}`);
    return null;
  }

  const relativePath = normalizeRepoRelativePath(value);
  if (!relativePath || relativePath.startsWith("..")) {
    fail(`${label} must stay within the repository root: ${value}`);
    return null;
  }

  return {
    relativePath,
    absolutePath: relativePath === "." ? rootDir : path.join(rootDir, relativePath),
  };
}

function isIgnoredRepoStatePath(relativePath) {
  return ignoredRepoStatePrefixes.some(prefix => relativePath === prefix || relativePath.startsWith(`${prefix}/`));
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
    return null;
  }
}

function validateSchema(value, schema, currentPath = "$") {
  if (!schema) return;

  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail(`${currentPath} must be an object.`);
      return;
    }

    for (const key of schema.required || []) {
      if (value[key] === undefined) fail(`${currentPath}.${key} is required.`);
    }

    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (value[key] !== undefined) validateSchema(value[key], childSchema, `${currentPath}.${key}`);
    }
    return;
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      fail(`${currentPath} must be an array.`);
      return;
    }
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      fail(`${currentPath} must contain at least ${schema.minItems} item(s).`);
    }
    if (schema.items) {
      value.forEach((entry, index) => validateSchema(entry, schema.items, `${currentPath}[${index}]`));
    }
    return;
  }

  if (schema.type === "string") {
    if (typeof value !== "string") {
      fail(`${currentPath} must be a string.`);
      return;
    }
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      fail(`${currentPath} must be at least ${schema.minLength} character(s).`);
    }
    if (schema.enum && !schema.enum.includes(value)) {
      fail(`${currentPath} must be one of: ${schema.enum.join(", ")}.`);
    }
    return;
  }

  if (schema.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) fail(`${currentPath} must be a number.`);
    return;
  }

  if (schema.type === "boolean") {
    if (typeof value !== "boolean") fail(`${currentPath} must be a boolean.`);
    return;
  }
}

function readGitStatus() {
  const porcelain = execFileSync("git", ["status", "--porcelain"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  const modified = [];
  const untracked = [];
  for (const line of porcelain.split("\n").filter(Boolean)) {
    const status = line.slice(0, 2);
    let relativePath = line.slice(3);
    if (relativePath.includes(" -> ")) relativePath = relativePath.split(" -> ").at(-1);
    relativePath = normalizeRepoRelativePath(relativePath);
    if (!relativePath || isIgnoredRepoStatePath(relativePath)) continue;
    if (status === "??") {
      untracked.push(relativePath);
    } else {
      modified.push(relativePath);
    }
  }

  return {
    modified: modified.sort(),
    untracked: untracked.sort(),
    clean: modified.length === 0 && untracked.length === 0,
  };
}

function arraysEqual(left, right) {
  if (left.length !== right.length) return false;
  return left.every((entry, index) => entry === right[index]);
}

function validateMarkdownSections(markdown) {
  const requiredSections = [
    "## Objective",
    "## Current Snapshot",
    "## Current Repo State",
    "## User Preferences And Working Norms",
    "## Immediate Next Step For A New Agent",
    "## Recursive Summary Lineage",
  ];

  for (const section of requiredSections) {
    if (!markdown.includes(section)) fail(`current.md is missing required section heading: ${section}`);
  }
}

function validateHistoryFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n").filter(Boolean);
  if (!lines.length) fail("history.ndjson must contain at least one event.");

  lines.forEach((line, index) => {
    try {
      const parsed = JSON.parse(line);
      if (!parsed.ts) fail(`history.ndjson line ${index + 1} is missing ts.`);
      if (!parsed.type) fail(`history.ndjson line ${index + 1} is missing type.`);
      if (!parsed.summary) fail(`history.ndjson line ${index + 1} is missing summary.`);
    } catch (error) {
      fail(`history.ndjson line ${index + 1} is not valid JSON: ${error.message}`);
    }
  });

  const trackedHistory = getTrackedFileContents(path.relative(rootDir, filePath));
  if (!trackedHistory) return;

  const trackedLines = trackedHistory.split("\n").filter(Boolean);
  if (lines.length < trackedLines.length) {
    fail("history.ndjson must remain append-only relative to the tracked version in HEAD.");
    return;
  }

  for (let index = 0; index < trackedLines.length; index += 1) {
    if (lines[index] !== trackedLines[index]) {
      fail(`history.ndjson must preserve tracked line ${index + 1} exactly and only append new events.`);
      return;
    }
  }
}

function getTrackedFileContents(relativePath) {
  try {
    execFileSync("git", ["cat-file", "-e", `HEAD:${relativePath}`], {
      cwd: rootDir,
      stdio: "ignore",
    });
  } catch (_error) {
    return null;
  }

  try {
    return execFileSync("git", ["show", `HEAD:${relativePath}`], {
      cwd: rootDir,
      encoding: "utf8",
    });
  } catch (error) {
    fail(`Could not read tracked ${relativePath} from HEAD: ${error.message}`);
    return null;
  }
}

function main() {
  for (const requiredPath of [currentMdPath, currentJsonPath, historyPath, schemaPath]) {
    if (!fs.existsSync(requiredPath)) fail(`Required handoff file is missing: ${requiredPath}`);
  }

  if (errors.length) return;

  const markdown = fs.readFileSync(currentMdPath, "utf8");
  validateMarkdownSections(markdown);

  const schema = readJson(schemaPath, "handoff/schema.json");
  const current = readJson(currentJsonPath, "handoff/current.json");
  if (!schema || !current) return;

  validateSchema(current, schema);
  validateHistoryFile(historyPath);

  const actualBranch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
  const actualHead = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
  const actualTag = execFileSync("git", ["describe", "--tags", "--abbrev=0"], {
    cwd: rootDir,
    encoding: "utf8",
  }).trim();
  const gitStatus = readGitStatus();
  const repoRoot = resolveRepoRelativePath(current.project?.repo_path || ".", "$.project.repo_path");

  if (current.repo_state?.branch !== actualBranch) {
    fail(`repo_state.branch must match git branch. Expected ${actualBranch}, saw ${current.repo_state?.branch}.`);
  }
  if (current.repo_state?.latest_tag !== actualTag) {
    fail(`repo_state.latest_tag must match git describe output. Expected ${actualTag}, saw ${current.repo_state?.latest_tag}.`);
  }
  if (repoRoot && repoRoot.relativePath !== ".") {
    fail(`project.repo_path must be "." for the current checkout. Saw ${current.project?.repo_path}.`);
  }

  if (current.repo_state?.worktree_clean !== gitStatus.clean) {
    fail(`repo_state.worktree_clean must match the real non-handoff git worktree state. Expected ${gitStatus.clean}, saw ${current.repo_state?.worktree_clean}.`);
  }

  const declaredModified = (current.repo_state?.modified_files || []).map((entry, index) => {
    const resolved = resolveRepoRelativePath(entry, `$.repo_state.modified_files[${index}]`);
    return resolved?.relativePath || null;
  }).filter(Boolean).sort();
  const declaredUntracked = (current.repo_state?.untracked_paths || []).map((entry, index) => {
    const resolved = resolveRepoRelativePath(entry, `$.repo_state.untracked_paths[${index}]`);
    return resolved?.relativePath || null;
  }).filter(Boolean).sort();

  if (!current.repo_state?.worktree_clean) {
    if (!declaredModified.length && !declaredUntracked.length) {
      fail("repo_state must list modified_files and/or untracked_paths when worktree_clean is false.");
    }
    if (!arraysEqual(declaredModified, gitStatus.modified)) {
      fail(`repo_state.modified_files does not match git status.\nExpected: ${JSON.stringify(gitStatus.modified, null, 2)}\nSaw: ${JSON.stringify(declaredModified, null, 2)}`);
    }
    if (!arraysEqual(declaredUntracked, gitStatus.untracked)) {
      fail(`repo_state.untracked_paths does not match git status.\nExpected: ${JSON.stringify(gitStatus.untracked, null, 2)}\nSaw: ${JSON.stringify(declaredUntracked, null, 2)}`);
    }
  }

  for (const [index, filePath] of (current.files_to_read || []).entries()) {
    const resolved = resolveRepoRelativePath(filePath, `$.files_to_read[${index}]`);
    if (resolved && !fs.existsSync(resolved.absolutePath)) {
      fail(`files_to_read entry does not exist: ${resolved.relativePath}`);
    }
  }

  if (current.summary_lineage !== undefined && (!Array.isArray(current.summary_lineage) || !current.summary_lineage.length)) {
    fail("summary_lineage must contain at least one entry when present.");
  }
  if (typeof current.resume_prompt !== "string" || !current.resume_prompt.trim()) {
    fail("resume_prompt must be a non-empty string.");
  }

  if (errors.length) {
    console.error("handoff validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log("handoff validation passed.");
}

main();
