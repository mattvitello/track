import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const projectRoot = process.cwd();
const traces = [
  ".next/server/pages/api/trpc/[trpc].js.nft.json",
  ".next/server/pages/api/music/cover/[id].js.nft.json",
];

// Run outside the checkout: a complete local node_modules hides missing files
// that fail only when Vercel packages the traced serverless function.
const smokeTest = `
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import sharp from 'sharp';
const require = createRequire(import.meta.url);
for (const factory of [sharp, require('sharp')]) {
  const bytes = await factory({ create: {
    width: 2, height: 2, channels: 3, background: '#fff'
  }}).webp().toBuffer();
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
}
`;

for (const traceFile of traces) {
  const tracePath = path.resolve(projectRoot, traceFile);
  /** @type {{ files: string[] }} */
  const trace = JSON.parse(await readFile(tracePath, "utf8"));
  const bundleRoot = await mkdtemp(path.join(tmpdir(), "track-sharp-bundle-"));
  try {
    for (const entry of trace.files) {
      const source = path.resolve(path.dirname(tracePath), entry);
      const relative = path.relative(projectRoot, source);
      // Never copy .env or application secrets into the test fixture.
      if (!relative.startsWith(`node_modules${path.sep}`)) continue;
      const destination = path.join(bundleRoot, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }
    const smokePath = path.join(bundleRoot, "smoke.mjs");
    await writeFile(smokePath, smokeTest);
    try {
      execFileSync(process.execPath, [smokePath], {
        cwd: bundleRoot,
        env: { ...process.env, NODE_PATH: "" },
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch (error) {
      const detail = error && typeof error === "object" && "stderr" in error
        ? String(error.stderr)
        : String(error);
      throw new Error(`Sharp deployment bundle failed: ${traceFile}\n${detail}`);
    }
    console.log(`Sharp deployment bundle passed: ${traceFile}`);
  } finally {
    await rm(bundleRoot, { recursive: true, force: true });
  }
}
