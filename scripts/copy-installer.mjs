import { cp, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const nsisDir = path.join(root, "src-tauri", "target", "release", "bundle", "nsis");
const publicDownloadsDir = path.join(root, "public", "downloads");
const distDownloadsDir = path.join(root, "dist", "downloads");
const outputName = "NovaMind-AI-Setup.exe";

async function main() {
  const installerName = await findInstaller(nsisDir);
  const source = path.join(nsisDir, installerName);

  await mkdir(publicDownloadsDir, { recursive: true });
  await cp(source, path.join(publicDownloadsDir, outputName));

  await mkdir(distDownloadsDir, { recursive: true });
  await cp(source, path.join(distDownloadsDir, outputName));

  console.log(`Copied installer to public/downloads/${outputName}`);
  console.log(`Copied installer to dist/downloads/${outputName}`);
}

async function findInstaller(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const installers = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".exe"))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  if (installers.length === 0) {
    throw new Error(`No installer .exe file was found in ${directory}`);
  }

  return installers[0];
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
