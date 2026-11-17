// Menyiapkan cabang `pages` dari dist/. Tanpa --push tidak ada yang dikirim.
// Pakai: node scripts/release.mjs [--push]
import { execFileSync } from "node:child_process";
import { mkdtempSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const push = process.argv.includes("--push");

if (run("git", ["status", "--porcelain"])) { console.error("Ada perubahan yang belum di-commit di main. Commit dulu."); process.exit(1); }
execFileSync("node", ["scripts/build.mjs"], { cwd: root, stdio: "inherit" });
execFileSync("node", ["scripts/check.mjs"], { cwd: root, stdio: "inherit" });

// identitas diambil dari commit terakhir di main, git config tidak diubah
const name = run("git", ["log", "-1", "--format=%an"]), email = run("git", ["log", "-1", "--format=%ae"]);
const remote = run("git", ["remote", "get-url", "origin"]);
const sha = run("git", ["rev-parse", "--short", "HEAD"]);
const tmp = mkdtempSync(join(tmpdir(), "sylloge-pages-"));
try {
  cpSync(join(root, "dist"), tmp, { recursive: true });
  writeFileSync(join(tmp, ".nojekyll"), "");
  const g = (...a) => run("git", ["-c", `user.name=${name}`, "-c", `user.email=${email}`, ...a], tmp);
  g("init", "-q", "-b", "pages");
  g("add", "-A");
  g("commit", "-q", "-m", `chore(pages): rilis dari main ${sha}`);
  g("remote", "add", "origin", remote);
  console.log(`commit pages siap: ${g("rev-parse", "--short", "HEAD")} (${g("ls-files").split("\n").length} berkas)`);
  if (push) { g("push", "--force", "origin", "pages"); console.log("terkirim ke origin/pages"); }
  else console.log("belum dikirim. Jalankan lagi dengan --push untuk mengirim.");
} finally { rmSync(tmp, { recursive: true, force: true }); }
