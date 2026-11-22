import * as esbuild from "esbuild";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = join(root, "../..");

execSync("pnpm --filter @ahoy/database db:generate", {
  cwd: monorepoRoot,
  stdio: "inherit",
});

await esbuild.build({
  entryPoints: [join(root, "src/index.ts")],
  outfile: join(root, "dist/index.cjs"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  logLevel: "info",
  external: ["bcryptjs"],
  alias: {
    "@ahoy/shared": join(monorepoRoot, "packages/shared/dist/index.js"),
  },
});

console.log("Built @ahoy/database -> dist/index.cjs");
