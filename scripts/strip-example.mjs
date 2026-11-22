#!/usr/bin/env node
/**
 * scripts/strip-example.mjs
 * Reduces the template to a minimal app: removes the example guide and the
 * demo dashboard, keeps the UI kit, navigation shell, auth and data layer.
 *
 *   npm run strip-example             preview, ask, strip, type-check
 *   npm run strip-example -- --dry-run   preview only, changes nothing
 *
 * Flags:
 *   --dry-run      show the plan and stop
 *   --yes          skip the confirmation prompt
 *   --skip-tsc     skip the type-checks (before and after)
 *
 * It never runs on a dirty working tree or outside a git repository: commit
 * or stash first, so everything it does can be undone.
 *
 * What it does:
 *   deletes   screens/dev, components/dev, lib/constants/dev,
 *             app/(dashboard)/dev, app/(tabs)/data.tsx, and every resource
 *             in hooks/resources that nothing imports any more
 *   creates   a Hello world Home screen and a Hello dashboard screen
 *   rewrites  the Data tab out of app/(tabs)/_layout.tsx, and the
 *             /(dashboard)/dev group name to /(dashboard)/user everywhere
 *
 * The plan is computed in memory first, so the preview is exactly what will
 * be written. Undo with: git restore . && git clean -fd
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

// ─── Configuration ──────────────────────────────────────────────
const OLD_GROUP = "dev";
const NEW_GROUP = "user";
const DEV_DIRS = [
  "screens/dev",
  "components/dev",
  "lib/constants/dev",
  `app/(dashboard)/${OLD_GROUP}`,
];
const EXTRA_DELETE = ["app/(tabs)/data.tsx"];
const TABS_LAYOUT = "app/(tabs)/_layout.tsx";
const DASH_LAYOUT = "app/(dashboard)/_layout.tsx";
const OLD_GROUP_LAYOUT = `app/(dashboard)/${OLD_GROUP}/_layout.tsx`;
const NEW_GROUP_LAYOUT = `app/(dashboard)/${NEW_GROUP}/_layout.tsx`;
const REMOVED_TAB_NAMES = ["data"];
const REMOVED_GROUP_SCREENS = ["items", "profile"];
const RESOURCES_DIR = "hooks/resources/";
const SCRIPT_PATH = "scripts/strip-example.mjs";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".expo",
  ".upgrade",
  "android",
  "ios",
  "dist",
  "web-build",
]);
const CODE_EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
const TEXT_EXT = new Set([...CODE_EXT, ".json", ".md", ".yaml", ".yml"]);

// ─── Templates ──────────────────────────────────────────────────
const TEMPLATES = {
  "screens/HomeScreen.tsx": `/**
 * screens/HomeScreen.tsx
 * Placeholder for the Home tab. Replace it with your own screen.
 */
import { TAB_BAR_CLEARANCE } from "@/components/navigation/tabbar";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        padding: spacing.md,
        paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
        backgroundColor: theme.background,
      }}
    >
      <Text size="xxl" bold>
        Hello world
      </Text>
      <Text dim>Edit screens/HomeScreen.tsx to get started.</Text>
    </View>
  );
}
`,
  "app/(tabs)/index.tsx": `/**
 * app/(tabs)/index.tsx
 * Route file for the Home tab. The screen lives in screens/.
 */
export { default } from "@/screens/HomeScreen";
`,
  "screens/dashboard/DashboardHomeScreen.tsx": `/**
 * screens/dashboard/DashboardHomeScreen.tsx
 * Placeholder for the dashboard. Replace it with your own screen.
 */
import { Text } from "@/components/ui/text";
import { useTheme } from "@/theme";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardHomeScreen() {
  const { theme, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xs,
        padding: spacing.md,
        paddingBottom: insets.bottom + spacing.md,
        backgroundColor: theme.background,
      }}
    >
      <Text size="xxl" bold>
        Hello dashboard
      </Text>
      <Text dim>Edit screens/dashboard/DashboardHomeScreen.tsx to get started.</Text>
    </View>
  );
}
`,
  [`app/(dashboard)/${NEW_GROUP}/index.tsx`]: `/**
 * app/(dashboard)/${NEW_GROUP}/index.tsx
 * Route file for the dashboard home. The screen lives in screens/dashboard.
 */
export { default } from "@/screens/dashboard/DashboardHomeScreen";
`,
};

const FALLBACK_GROUP_LAYOUT = `/**
 * app/(dashboard)/${NEW_GROUP}/_layout.tsx
 * Layout of the ${NEW_GROUP} dashboard group.
 */
import { Stack } from "expo-router";

export default function UserLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
`;

// ─── Small helpers ──────────────────────────────────────────────
const toPosix = (p) => p.split(path.sep).join("/");
const abs = (p) => path.join(process.cwd(), ...p.split("/"));
const say = (s = "") => console.log(s);
const fail = (s) => {
  console.error(`\n[strip] ${s}\n`);
  process.exit(1);
};

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(abs(dir), { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const p = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function listTree() {
  const files = new Map();
  for (const p of walk("")) {
    const ext = path.extname(p);
    files.set(p, TEXT_EXT.has(ext) ? fs.readFileSync(abs(p), "utf8") : null);
  }
  return files;
}

// ─── JSX element removal (bracket-aware) ────────────────────────
/** Finds where the opening tag and the whole element end, or null. */
function elementEnd(src, start, tag) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (depth === 0 && c === "/" && src[i + 1] === ">")
      return { openEnd: i + 2, end: i + 2 };
    else if (depth === 0 && c === ">" && src[i - 1] !== "=") {
      const close = src.indexOf(`</${tag}>`, i);
      return close === -1
        ? null
        : { openEnd: i + 1, end: close + `</${tag}>`.length };
    }
  }
  return null;
}

/** Removes every <tag name="X" ...> element whose name is in `names`. */
function removeScreens(src, tag, names) {
  const removed = [];
  let out = src;
  let from = 0;
  for (;;) {
    const start = out.indexOf(`<${tag}`, from);
    if (start === -1) break;
    const found = elementEnd(out, start, tag);
    if (!found) break;
    const match = /name\s*=\s*["']([^"']+)["']/.exec(
      out.slice(start, found.openEnd),
    );
    if (match && names.includes(match[1])) {
      let a = start;
      let b = found.end;
      const lineStart = out.lastIndexOf("\n", a - 1) + 1;
      if (/^[ \t]*$/.test(out.slice(lineStart, a))) a = lineStart;
      const rest = /^[ \t]*\r?\n/.exec(out.slice(b));
      if (rest) b += rest[0].length;
      out = out.slice(0, a) + out.slice(b);
      removed.push(match[1]);
      from = a;
    } else {
      from = found.end;
    }
  }
  return { src: out, removed };
}

// ─── Plan ───────────────────────────────────────────────────────
function buildPlan(files) {
  const warnings = [];
  const deleted = new Set();
  const created = new Map();
  const modified = new Map();
  const moved = [];

  const state = new Map(files);
  const setContent = (p, content) => {
    if (!state.has(p)) created.set(p, content);
    else if (!created.has(p)) modified.set(p, content);
    else created.set(p, content);
    state.set(p, content);
  };
  const del = (p) => {
    deleted.add(p);
    state.delete(p);
    modified.delete(p);
    created.delete(p);
  };

  // 1. The group layout is kept: moved to the new group, minus the demo screens.
  let groupLayout = state.get(OLD_GROUP_LAYOUT);
  if (typeof groupLayout !== "string") {
    warnings.push(
      `${OLD_GROUP_LAYOUT} not found: a default group layout will be created.`,
    );
    groupLayout = FALLBACK_GROUP_LAYOUT;
  } else {
    const r = removeScreens(groupLayout, "Stack.Screen", REMOVED_GROUP_SCREENS);
    groupLayout = r.src;
    groupLayout = groupLayout.replaceAll(
      `/(dashboard)/${OLD_GROUP}`,
      `/(dashboard)/${NEW_GROUP}`,
    );
    moved.push([OLD_GROUP_LAYOUT, NEW_GROUP_LAYOUT]);
  }

  // 2. Deletions.
  for (const p of [...state.keys()]) {
    if (DEV_DIRS.some((d) => p.startsWith(`${d}/`)) || EXTRA_DELETE.includes(p))
      del(p);
  }
  setContent(NEW_GROUP_LAYOUT, groupLayout);

  // 3. New screens.
  for (const [p, content] of Object.entries(TEMPLATES)) setContent(p, content);

  // 4. Data tab out of the tabs layout.
  const tabs = state.get(TABS_LAYOUT);
  if (typeof tabs !== "string") {
    warnings.push(`${TABS_LAYOUT} not found: remove the Data tab by hand.`);
  } else {
    const r = removeScreens(tabs, "Tabs.Screen", REMOVED_TAB_NAMES);
    if (r.removed.length === 0) {
      warnings.push(
        `No <Tabs.Screen name="data"> found in ${TABS_LAYOUT}: remove the Data tab by hand.`,
      );
    } else {
      setContent(TABS_LAYOUT, r.src);
    }
  }

  // 5. The guard constants and every link to the old group.
  const dash = state.get(DASH_LAYOUT);
  if (typeof dash === "string") {
    let next = dash
      .replace(
        /(VALID_DASHBOARD_GROUPS\s*(?::[^=]+)?=\s*\[)\s*["']dev["']\s*(\])/,
        `$1"${NEW_GROUP}"$2`,
      )
      .replace(
        /(DEFAULT_GROUP\s*(?::[^=]+)?=\s*)["']dev["']/,
        `$1"${NEW_GROUP}"`,
      );
    if (next === dash)
      warnings.push(
        `Could not update VALID_DASHBOARD_GROUPS / DEFAULT_GROUP in ${DASH_LAYOUT}: set them to "${NEW_GROUP}" by hand.`,
      );
    else setContent(DASH_LAYOUT, next);
  } else {
    warnings.push(`${DASH_LAYOUT} not found.`);
  }
  for (const [p, content] of [...state]) {
    if (typeof content !== "string" || !CODE_EXT.includes(path.extname(p)))
      continue;
    if (p === NEW_GROUP_LAYOUT || p === SCRIPT_PATH || p in TEMPLATES) continue;
    if (content.includes(`/(dashboard)/${OLD_GROUP}`)) {
      setContent(
        p,
        content.replaceAll(
          `/(dashboard)/${OLD_GROUP}`,
          `/(dashboard)/${NEW_GROUP}`,
        ),
      );
    }
  }

  // 5b. Anything else still named after the old group.
  // 6. Resources nothing imports any more.
  const { reachable, importers } = reachability(state);
  const unusedResources = [...state.keys()].filter(
    (p) =>
      p.startsWith(RESOURCES_DIR) && /\.r\.tsx?$/.test(p) && !reachable.has(p),
  );
  for (const p of unusedResources) del(p);
  const keptResources = [...state.keys()]
    .filter((p) => p.startsWith(RESOURCES_DIR) && /\.r\.tsx?$/.test(p))
    .map((p) => [p, [...(importers.get(p) ?? [])].slice(0, 3)]);

  return {
    state,
    deleted,
    created,
    modified,
    moved,
    warnings,
    unusedResources,
    keptResources,
  };
}

// ─── Import graph ───────────────────────────────────────────────
const IMPORT_RE =
  /(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g;

function resolveImport(spec, importer, state) {
  let base;
  if (spec.startsWith("@/")) base = spec.slice(2);
  else if (spec.startsWith("."))
    base = path.posix.normalize(
      path.posix.join(path.posix.dirname(importer), spec),
    );
  else return null;
  const candidates = [
    base,
    ...CODE_EXT.map((e) => base + e),
    ...CODE_EXT.map((e) => `${base}/index${e}`),
  ];
  return candidates.find((c) => state.has(c)) ?? null;
}

function reachability(state) {
  const edges = new Map();
  const importers = new Map();
  for (const [p, content] of state) {
    if (typeof content !== "string" || !CODE_EXT.includes(path.extname(p)))
      continue;
    const deps = new Set();
    for (const m of content.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
      const target = spec && resolveImport(spec, p, state);
      if (target) {
        deps.add(target);
        if (!importers.has(target)) importers.set(target, new Set());
        importers.get(target).add(p);
      }
    }
    edges.set(p, deps);
  }
  const reachable = new Set();
  const stack = [...edges.keys()].filter((p) => p.startsWith("app/"));
  while (stack.length) {
    const p = stack.pop();
    if (reachable.has(p)) continue;
    reachable.add(p);
    for (const d of edges.get(p) ?? []) stack.push(d);
  }
  return { reachable, importers };
}

// ─── Type-check ─────────────────────────────────────────────────
function runTsc() {
  try {
    execSync("npx tsc --noEmit", {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, errors: [], raw: "" };
  } catch (e) {
    const raw = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    const errors = [
      ...raw.matchAll(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/gm),
    ].map((m) => ({
      file: toPosix(m[1]),
      line: Number(m[2]),
      code: m[4],
      message: m[5],
    }));
    return { ok: false, errors, raw };
  }
}

const HINTS = {
  TS2307:
    "Cannot find module: an import still points at a file that was removed.",
  TS2305: "A file no longer exports a name that something imports.",
  TS2322:
    "If it mentions Href or a route path, the typed routes are stale: run npx expo start -c.",
  TS2345:
    "If it mentions Href or a route path, the typed routes are stale: run npx expo start -c.",
};

function tscInsight(result, label) {
  if (result.ok) {
    say(`tsc ${label}: clean, 0 errors.`);
    return;
  }
  say(`tsc ${label}: ${result.errors.length} error(s).`);
  if (result.errors.length === 0) {
    say(result.raw.split("\n").slice(0, 15).join("\n"));
    return;
  }
  const byFile = new Map();
  const byCode = new Map();
  for (const e of result.errors) {
    byFile.set(e.file, (byFile.get(e.file) ?? 0) + 1);
    byCode.set(e.code, (byCode.get(e.code) ?? 0) + 1);
  }
  say("  By file:");
  for (const [f, n] of [...byFile].sort((a, b) => b[1] - a[1]).slice(0, 10))
    say(`    ${n}  ${f}`);
  say("  By code:");
  for (const [c, n] of [...byCode].sort((a, b) => b[1] - a[1]))
    say(`    ${n}  ${c}${HINTS[c] ? `: ${HINTS[c]}` : ""}`);
  say("  First errors:");
  for (const e of result.errors.slice(0, 8))
    say(`    ${e.file}:${e.line} ${e.code} ${e.message}`);
}

// ─── Main ───────────────────────────────────────────────────────
const KNOWN = ["--dry-run", "--yes", "--skip-tsc", "--help"];
const argv = process.argv.slice(2);
const unknown = argv.filter((a) => !KNOWN.includes(a));
if (unknown.length)
  fail(`Unknown option: ${unknown.join(" ")}. Options: ${KNOWN.join(" ")}`);
const flag = (name) => argv.includes(name);
if (flag("--help")) {
  say(
    fs
      .readFileSync(new URL(import.meta.url), "utf8")
      .split("*/")[0]
      .replace(/^\/\*\*|^ \* ?/gm, ""),
  );
  process.exit(0);
}

// Preflight: right place, something to strip.
if (!fs.existsSync(abs("package.json")) || !fs.existsSync(abs(DASH_LAYOUT))) {
  fail(
    "Run this from the project root (the folder with package.json and app/).",
  );
}
if (!DEV_DIRS.some((d) => fs.existsSync(abs(d)))) {
  fail("Nothing to strip: the example folders are already gone.");
}

// Preflight: git.
const inRepo = git("rev-parse --is-inside-work-tree") === "true";
if (!inRepo) {
  fail(
    "This is not a git repository, so there would be no way back. Run git init, commit, then try again.",
  );
}
const dirty = git("status --porcelain");
if (dirty) {
  fail(
    `The working tree has uncommitted changes:\n${dirty.split("\n").slice(0, 10).join("\n")}\n\nCommit or stash them first, so the strip can be undone cleanly.`,
  );
}
say(
  `Git: branch ${git("rev-parse --abbrev-ref HEAD") ?? "?"}, working tree clean.`,
);

// Plan.
const plan = buildPlan(listTree());
const devFiles = plan.deleted;
say("\nStrip plan");
say("==========");
say(`\nDelete (${devFiles.size} files):`);
for (const p of [...devFiles].sort()) say(`  - ${p}`);
say(`\nCreate (${plan.created.size}):`);
for (const p of [...plan.created.keys()].sort()) {
  const from = plan.moved.find(([, to]) => to === p);
  say(`  + ${p}${from ? `   (from ${from[0]})` : ""}`);
}
say(`\nModify (${plan.modified.size}):`);
for (const p of [...plan.modified.keys()].sort()) say(`  ~ ${p}`);
say("\nKept resources (still imported):");
for (const [p, by] of plan.keptResources)
  say(`  = ${p}   <- ${by.join(", ") || "?"}`);
if (plan.unusedResources.length) {
  say("Removed as unused:");
  for (const p of plan.unusedResources) say(`  - ${p}`);
}
if (plan.warnings.length) {
  say("\nWarnings:");
  for (const w of plan.warnings) say(`  ! ${w}`);
}

if (flag("--dry-run")) {
  say("\nDry run: nothing was changed.");
  process.exit(0);
}

// Confirm.
if (!flag("--yes")) {
  if (!process.stdin.isTTY)
    fail("No terminal to ask for confirmation. Pass --yes to proceed.");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = (
    await rl.question(`\nApply this plan? Type "yes" to continue: `)
  )
    .trim()
    .toLowerCase();
  rl.close();
  if (answer !== "yes") fail("Cancelled. Nothing was changed.");
}

// Baseline type-check.
let baseline = null;
if (!flag("--skip-tsc")) {
  say("\nType-checking before the change...");
  baseline = runTsc();
  tscInsight(baseline, "before");
}

// Apply.
say("\nApplying...");
for (const d of DEV_DIRS) fs.rmSync(abs(d), { recursive: true, force: true });
for (const p of plan.deleted) fs.rmSync(abs(p), { force: true });
for (const p of [...plan.deleted, ...DEV_DIRS]) {
  let dir = path.posix.dirname(p);
  while (dir && dir !== ".") {
    const full = abs(dir);
    if (fs.existsSync(full) && fs.readdirSync(full).length === 0)
      fs.rmdirSync(full);
    else break;
    dir = path.posix.dirname(dir);
  }
}
for (const [p, content] of [...plan.created, ...plan.modified]) {
  fs.mkdirSync(path.dirname(abs(p)), { recursive: true });
  fs.writeFileSync(abs(p), content);
}
const staleRoutes = abs(".expo/types/router.d.ts");
if (fs.existsSync(staleRoutes)) {
  fs.rmSync(staleRoutes);
  say(
    "Removed the generated .expo/types/router.d.ts (it is rebuilt on the next npx expo start).",
  );
}

// Type-check after.
let after = null;
if (!flag("--skip-tsc")) {
  say("\nType-checking after the change...");
  after = runTsc();
  tscInsight(after, "after");
  if (baseline && !baseline.ok && !after.ok)
    say(
      `  (${baseline.errors.length} error(s) were already there before the strip.)`,
    );
}

// Leftover mentions in docs and comments.
const stale =
  /screens\/dev|components\/dev|lib\/constants\/dev|\(dashboard\)\/dev|app\/\(dashboard\)\/dev/;
const mentions = [...listTree()]
  .filter(
    ([p, c]) => typeof c === "string" && p !== SCRIPT_PATH && stale.test(c),
  )
  .map(([p]) => p);
if (mentions.length) {
  say("\nStill mention the removed example folders (update by hand):");
  for (const p of mentions) say(`  ${p}`);
}

say("\nDone. Next:");
say(
  "  1. npx expo start -c   (rebuilds the typed routes and clears the cache)",
);
say("  2. Review with git status and git diff, then commit.");
say("  3. Update the docs that still describe the example.");
say("  Undo everything: git restore . && git clean -fd");
process.exit(after && !after.ok ? 2 : 0);
