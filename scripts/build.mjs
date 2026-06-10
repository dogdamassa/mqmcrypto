import { cp, mkdir, rm } from "node:fs/promises";

const outputDir = "dist";
const entries = [
  "index.html",
  "comunidade.html",
  "manual.html",
  "mentoria.html",
  "dashboard.html",
  "assets",
  "public",
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of entries) {
  await cp(entry, `${outputDir}/${entry}`, { recursive: true });
}
