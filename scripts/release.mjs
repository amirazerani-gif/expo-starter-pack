#!/usr/bin/env node
/**
 * scripts/release.mjs
 * Builds, verifies and (optionally) publishes the template to npm.
 * Maintainers only: it is marked export-ignore in .gitattributes, so it is
 * not part of the published template.
 *
 *   node scripts/release.mjs 58.0.0                 build, verify, scaffold-test
 *   node scripts/release.mjs 58.0.0 --publish       ...then publish to npm
 *   node scripts/release.mjs 58.0.0 --publish --latest
 *
 * Options:
 *   --publish         publish after the checks pass (asks you to confirm)
 *   --latest          also point the "latest" dist-tag at this version
 *   --ref <ref>       release an older commit or tag (e.g. sdk-57) instead of main
 *   --skip-scaffold   skip the scaffold test with create-expo-app
 *
 * What it does, in order:
 *   1. checks that git is clean, you are on main and main is pushed
 *   2. extracts the committed files (git archive) into a temporary folder,
 *      so uncommitted or ignored files can never leak into the package
 *   3. adapts that copy for publishing: package name, version, metadata,
 *      the gitignore file name and the app.json placeholders
 *   4. runs npm pack and checks the file list
 *   5. scaffolds a test app from the tarball and checks the result
 *   6. with --publish: publishes, sets dist-tags, creates and pushes the
 *      git tag
 * Your working tree is never modified.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";

// ─── Configuration ──────────────────────────────────────────────
const PACKAGE_NAME = "@amirgazerani/expo-starter-pack";
const DESCRIPTION =
  "Production-ready Expo starter: tabs, an auth-gated dashboard, a typed OpenAPI data layer with TanStack Query, and a themed UI kit.";
const REPOSITORY = {
  type: "git",
  url: "git+https://github.com/amirazerani-gif/expo-starter-pack.git",
};
const KEYWORDS = [
  "expo",
  "expo-template",
  "react-native",
  "template",
  "starter",
  "typescript",
  "expo-router",
  "tanstack-query",
  "openapi",
];
/** The placeholder create-expo-app replaces with the new app's name. */
const PLACEHOLDER = "helloworld";

const REQUIRED_IN_PACKAGE = [
  "package.json",
  "app.json",
  "gitignore",
  ".env.example",
  "README.md",
  "LICENSE",
  "AGENTS.md",
  "scripts/strip-example.mjs",
];
const FORBIDDEN_IN_PACKAGE = [
  /^\.env$/,
  /^\.env\..*local$/,
  /^package-lock\.json$/,
  /^scripts\/release\.mjs$/,
  /^node_modules\//,
  /^android\//,
  /^ios\//,
  /^\.expo\//,
  /^\.git\//,
];

// ─── Helpers ────────────────────────────────────────────────────
const say = (s = "") => console.log(s);
const fail = (s) => {
  console.error(`\n[release] ${s}\n`);
  process.exit(1);
};
const q = (p) => `"${p}"`;

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  }).trim();
}
function tryGit(args) {
  try {
    return sh(`git ${args}`);
  } catch {
    return null;
  }
}
function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, data) {
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
}

// ─── Arguments ──────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flags = new Set();
let version = null;
let ref = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--ref") ref = argv[++i];
  else if (["--publish", "--latest", "--skip-scaffold", "--help"].includes(a))
    flags.add(a);
  else if (/^\d+\.\d+\.\d+$/.test(a)) version = a;
  else
    fail(
      `Unknown argument: ${a}. Use: node scripts/release.mjs <version> [--publish] [--latest] [--ref <ref>] [--skip-scaffold]`,
    );
}
if (flags.has("--help") || !version) {
  say(
    "Usage: node scripts/release.mjs <version> [--publish] [--latest] [--ref <ref>] [--skip-scaffold]",
  );
  say("Example: node scripts/release.mjs 58.0.0");
  process.exit(flags.has("--help") ? 0 : 1);
}
if (flags.has("--latest") && !flags.has("--publish"))
  fail("--latest only makes sense with --publish.");

// ─── 1. Preflight ───────────────────────────────────────────────
say(`Release ${PACKAGE_NAME}@${version}`);
say("=".repeat(40));
if (tryGit("rev-parse --is-inside-work-tree") !== "true")
  fail("Run this inside the git repository.");
const dirty = tryGit("status --porcelain");
if (dirty)
  fail(
    `The working tree has uncommitted changes:\n${dirty.split("\n").slice(0, 10).join("\n")}\n\nCommit or stash them first.`,
  );

const source = ref ?? "HEAD";
if (!ref) {
  const branch = tryGit("rev-parse --abbrev-ref HEAD");
  if (branch !== "main")
    fail(
      `You are on "${branch}". Releases come from main (or pass --ref <tag> for an older release).`,
    );
  if (tryGit("fetch origin main") === null)
    fail("Could not reach origin to check that main is pushed.");
  const local = tryGit("rev-parse HEAD");
  const remote = tryGit("rev-parse origin/main");
  if (local !== remote)
    fail(
      "Local main and origin/main differ. Push (or pull) first, so what you publish is what is on GitHub.",
    );
} else if (tryGit(`rev-parse --verify ${ref}^{commit}`) === null) {
  fail(`Unknown ref: ${ref}`);
}
const commit = tryGit(`rev-parse --short ${source}`);
say(`Source: ${source} (${commit}), working tree clean.`);

// ─── 2. Extract the committed files ─────────────────────────────
const work = fs.mkdtempSync(path.join(os.tmpdir(), "esp-release-"));
const stage = path.join(work, "package");
const tarFile = path.join(work, "source.tar");
fs.mkdirSync(stage);
try {
  sh(`git archive --format=tar -o ${q(tarFile)} ${source}`);
  sh(`tar -xf ${q(tarFile)} -C ${q(stage)}`);
} catch (e) {
  fail(`Could not extract the committed files: ${e.stderr || e.message}`);
}
say(`Extracted to ${stage}`);

// ─── 3. Adapt the copy ──────────────────────────────────────────
const pkgPath = path.join(stage, "package.json");
const appPath = path.join(stage, "app.json");
if (!fs.existsSync(pkgPath) || !fs.existsSync(appPath))
  fail("package.json or app.json is missing from the commit.");

const pkg = readJson(pkgPath);
const sdk = Number(/\d+/.exec(pkg.dependencies?.expo ?? "")?.[0]);
if (!sdk) fail("Could not read the Expo SDK version from package.json.");
const major = Number(version.split(".")[0]);
if (major !== sdk)
  fail(
    `Version ${version} does not match the SDK: this commit uses Expo SDK ${sdk}, so the version must start with ${sdk}.`,
  );

// Version must be new.
let published = true;
try {
  sh(`npm view ${PACKAGE_NAME}@${version} version`);
} catch (e) {
  if (/E404/.test(`${e.stderr}${e.stdout}`)) published = false;
  else fail(`Could not check the npm registry:\n${e.stderr || e.message}`);
}
if (published)
  fail(
    `${PACKAGE_NAME}@${version} is already published. Versions cannot be reused: pick a new one.`,
  );

// gitignore: npm never packs ".gitignore", and create-expo-app renames this file back.
const dotIgnore = path.join(stage, ".gitignore");
if (!fs.existsSync(dotIgnore)) fail("The commit has no .gitignore.");
fs.renameSync(dotIgnore, path.join(stage, "gitignore"));

// package.json: publish identity. create-expo-app rewrites name, version and
// private, and drops description and repository; keywords and license remain.
delete pkg.private;
pkg.name = PACKAGE_NAME;
pkg.version = version;
pkg.description = DESCRIPTION;
pkg.license = pkg.license ?? "MIT";
pkg.repository = REPOSITORY;
pkg.keywords = KEYWORDS;
writeJson(pkgPath, pkg);

// app.json: replace the real identifiers with placeholders, so every app
// scaffolded from the template gets its own scheme and bundle ids.
const app = readJson(appPath);
const expo = app.expo ?? app;
expo.scheme = PLACEHOLDER;
if (expo.ios) expo.ios.bundleIdentifier = `com.${PLACEHOLDER}`;
if (expo.android) expo.android.package = `com.${PLACEHOLDER}`;
writeJson(appPath, app);
say("Adapted package.json, app.json and gitignore in the copy.");

// ─── 4. Pack and check the file list ────────────────────────────
for (const f of REQUIRED_IN_PACKAGE) {
  if (!fs.existsSync(path.join(stage, f)))
    fail(`Required file missing from the commit: ${f}`);
}
let packInfo;
try {
  const out = sh(`npm pack --json --pack-destination ${q(work)}`, {
    cwd: stage,
  });
  packInfo = JSON.parse(out.slice(out.indexOf("[")))[0];
} catch (e) {
  fail(`npm pack failed:\n${e.stderr || e.message}`);
}
const files = packInfo.files.map((f) => f.path);
const missing = REQUIRED_IN_PACKAGE.filter((f) => !files.includes(f));
const forbidden = files.filter((f) =>
  FORBIDDEN_IN_PACKAGE.some((re) => re.test(f)),
);
if (missing.length) fail(`Missing from the package: ${missing.join(", ")}`);
if (forbidden.length)
  fail(`Must not be in the package: ${forbidden.join(", ")}`);
const tarball = path.join(
  work,
  packInfo.filename.replace(/^@/, "").replace("/", "-"),
);
if (!fs.existsSync(tarball)) fail(`Expected tarball not found: ${tarball}`);
say(
  `Packed ${files.length} files, ${(packInfo.size / 1024).toFixed(0)} kB (${(packInfo.unpackedSize / 1024).toFixed(0)} kB unpacked).`,
);
say(`Tarball: ${tarball}`);

// ─── 5. Scaffold test ───────────────────────────────────────────
if (!flags.has("--skip-scaffold")) {
  say("\nScaffolding a test app from the tarball (no install)...");
  const appName = "scaffold-test";
  const out = path.join(work, "scaffold");
  fs.mkdirSync(out);
  try {
    sh(
      `npx --yes create-expo-app@latest ${appName} --template ${q(tarball)} --no-install --yes`,
      {
        cwd: out,
        env: { ...process.env, CI: "1" },
      },
    );
  } catch (e) {
    fail(`create-expo-app failed:\n${e.stderr || e.stdout || e.message}`);
  }
  const root = path.join(out, appName);
  const problems = [];
  const has = (p) => fs.existsSync(path.join(root, p));
  if (!has(".gitignore"))
    problems.push(".gitignore was not created (the gitignore rename failed)");
  if (has("gitignore"))
    problems.push("a stray gitignore file is left in the app");
  if (!has("scripts/strip-example.mjs"))
    problems.push("scripts/strip-example.mjs is missing");
  if (has("scripts/release.mjs"))
    problems.push("scripts/release.mjs must not ship");
  if (has(".env")) problems.push(".env must not ship");
  try {
    const a = readJson(path.join(root, "app.json"));
    const e = a.expo ?? a;
    if (e.name !== appName || e.slug !== appName)
      problems.push(`app.json name/slug are not "${appName}"`);
    if (e.scheme !== "scaffoldtest")
      problems.push(
        `scheme is "${e.scheme}", expected "scaffoldtest" (placeholder not replaced)`,
      );
    if (e.ios?.bundleIdentifier !== "com.scaffoldtest")
      problems.push(`iOS bundleIdentifier is "${e.ios?.bundleIdentifier}"`);
    if (e.android?.package !== "com.scaffoldtest")
      problems.push(`Android package is "${e.android?.package}"`);
    const p = readJson(path.join(root, "package.json"));
    if (p.name !== appName) problems.push(`package.json name is "${p.name}"`);
    if (p.private !== true)
      problems.push("package.json is not private in the scaffolded app");
    if (!p.scripts?.["strip-example"])
      problems.push(
        'the "strip-example" script is missing from the scaffolded package.json',
      );
    if (p.scripts?.release)
      problems.push(
        'a "release" script leaked into the scaffolded package.json',
      );
  } catch (e) {
    problems.push(`could not read the scaffolded config: ${e.message}`);
  }
  const log = (() => {
    try {
      return sh("git log --oneline", { cwd: root });
    } catch {
      return "";
    }
  })();
  if (!log) problems.push("the scaffolded app has no initial git commit");
  const status = (() => {
    try {
      return sh("git status --porcelain", { cwd: root });
    } catch {
      return "?";
    }
  })();
  if (status)
    problems.push(
      "the scaffolded app starts with a dirty git tree (strip-example would refuse to run)",
    );
  if (problems.length)
    fail(
      `Scaffold test failed:\n  - ${problems.join("\n  - ")}\n\nScaffolded app: ${root}`,
    );
  say(
    `Scaffold test passed: names and placeholders replaced, gitignore renamed, clean initial commit.`,
  );
  say(`Scaffolded app (no node_modules): ${root}`);
}

say("\nTry it yourself:");
say(`  npx create-expo-app my-test --template ${q(tarball)}`);

// ─── 6. Publish ─────────────────────────────────────────────────
if (!flags.has("--publish")) {
  say("\nChecks passed. Nothing was published (add --publish to publish).");
  process.exit(0);
}

let who;
try {
  who = sh("npm whoami");
} catch {
  fail("You are not logged in to npm. Run npm login, then try again.");
}
const distTag = `sdk-${major}`;
say(`\nReady to publish ${PACKAGE_NAME}@${version} as ${who}`);
say(`  dist-tags: ${distTag}${flags.has("--latest") ? ", latest" : ""}`);
say(`  git tag:   v${version} on ${commit}, pushed to origin`);
if (!process.stdin.isTTY)
  fail("No terminal to confirm in. Run this from an interactive terminal.");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const answer = (
  await rl.question(
    '\nPublishing cannot be undone. Type "publish" to continue: ',
  )
)
  .trim()
  .toLowerCase();
rl.close();
if (answer !== "publish") fail("Cancelled. Nothing was published.");

try {
  // stdio inherit: npm asks for your one-time password here.
  execSync(`npm publish ${q(tarball)} --access public --tag ${distTag}`, {
    stdio: "inherit",
  });
} catch {
  fail("npm publish failed. Nothing else was changed.");
}
if (flags.has("--latest")) {
  try {
    execSync(`npm dist-tag add ${PACKAGE_NAME}@${version} latest`, {
      stdio: "inherit",
    });
  } catch {
    say(
      `Could not set the latest tag. Run: npm dist-tag add ${PACKAGE_NAME}@${version} latest`,
    );
  }
}

const tag = `v${version}`;
if (tryGit(`rev-parse --verify refs/tags/${tag}`) !== null) {
  say(`Git tag ${tag} already exists: not recreated.`);
} else {
  try {
    sh(`git tag -a ${tag} ${source} -m "Release ${version}"`);
    sh(`git push origin ${tag}`);
    say(`Created and pushed git tag ${tag}.`);
  } catch (e) {
    say(
      `Published, but the git tag failed: ${e.stderr || e.message}\nRun: git tag -a ${tag} ${source} -m "Release ${version}" && git push origin ${tag}`,
    );
  }
}

const spec = flags.has("--latest")
  ? PACKAGE_NAME
  : `${PACKAGE_NAME}@${distTag}`;
say("\nPublished. Verify with a clean scaffold:");
say(`  npx create-expo-app verify-app --template ${spec}`);
say(`  npm view ${PACKAGE_NAME} dist-tags`);
