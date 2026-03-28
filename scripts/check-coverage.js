const fs = require("node:fs");
const path = require("node:path");

const COVERAGE_PATH = path.resolve(__dirname, "..", "coverage", "coverage-final.json");
const SOURCE_DIR = `${path.sep}src${path.sep}`;
const THRESHOLDS = {
  statements: 99.5,
  functions: 100,
  branches: 85,
};

function percentage(covered, total) {
  if (!total) return 100;
  return (covered / total) * 100;
}

function summarizeCounterGroups(counterGroups) {
  const values = counterGroups.flatMap(counter => Object.values(counter));
  const total = values.length;
  const covered = values.filter(value => value > 0).length;
  return {
    covered,
    total,
    percentage: percentage(covered, total),
  };
}

function summarizeBranchGroups(counterGroups) {
  const values = counterGroups.flatMap(counter => Object.values(counter).flat());
  const total = values.length;
  const covered = values.filter(value => value > 0).length;
  return {
    covered,
    total,
    percentage: percentage(covered, total),
  };
}

if (!fs.existsSync(COVERAGE_PATH)) {
  console.error(`Coverage file not found at ${COVERAGE_PATH}`);
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(COVERAGE_PATH, "utf8"));
const sourceEntries = Object.entries(coverage).filter(([filePath]) => filePath.includes(SOURCE_DIR));

if (!sourceEntries.length) {
  console.error("Could not find coverage entries for src/");
  process.exit(1);
}

const metrics = {
  statements: summarizeCounterGroups(sourceEntries.map(([, info]) => info.s)),
  functions: summarizeCounterGroups(sourceEntries.map(([, info]) => info.f)),
  branches: summarizeBranchGroups(sourceEntries.map(([, info]) => info.b)),
};

const failures = Object.entries(THRESHOLDS)
  .filter(([metric, threshold]) => metrics[metric].percentage < threshold)
  .map(([metric, threshold]) => ({
    metric,
    threshold,
    actual: metrics[metric].percentage,
  }));

const summary = Object.entries(metrics)
  .map(([metric, value]) => `${metric} ${value.percentage.toFixed(2)}% (${value.covered}/${value.total})`)
  .join(", ");

console.log(`Coverage for src runtime: ${summary}`);

if (failures.length) {
  for (const failure of failures) {
    console.error(`Coverage check failed for ${failure.metric}: expected at least ${failure.threshold}% but saw ${failure.actual.toFixed(2)}%`);
  }
  process.exit(1);
}
