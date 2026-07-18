#!/usr/bin/env node
/**
 * Captures desktop + mobile screenshots of every Sydef page and builds:
 *   docs/SCREENSHOTS.md
 *   docs/Screenshots.pdf
 *
 * Usage: npm run screenshots
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "docs", "screenshots");
const PORT = 3010;
const BASE = `http://127.0.0.1:${PORT}`;

const PAGES = [
  { audience: "Users & members", name: "Home — browse locations", path: "/" },
  { audience: "Users & members", name: "Sign in (phone OTP)", path: "/auth" },
  { audience: "Users & members", name: "Member portal", path: "/portal" },
  {
    audience: "Users & members",
    name: "Payment success (portal)",
    path: "/portal?payment=success",
  },
  {
    audience: "Users & members",
    name: "Mock checkout",
    path: "/checkout/mock?reference=mock_demo_001&amount=85000",
  },
  {
    audience: "Users & members",
    name: "Checkout callback",
    path: "/checkout/callback?provider=mock&reference=mock_demo_001",
  },
  { audience: "Admin", name: "Super admin login", path: "/admin/login" },
  {
    audience: "Admin",
    name: "Super admin — verification step",
    path: "/admin/login?verify=1",
  },
  { audience: "Admin", name: "Admin dashboard", path: "/admin" },
  { audience: "Admin", name: "Content CMS", path: "/admin/content" },
  { audience: "Admin", name: "Analytics", path: "/admin/analytics" },
  { audience: "Admin", name: "Financial portal", path: "/admin/financial" },
  { audience: "Admin", name: "Bookings", path: "/admin/bookings" },
  { audience: "Admin", name: "Super admin settings", path: "/admin/settings/superadmin" },
  { audience: "Admin", name: "Platform settings", path: "/admin/settings" },
  {
    audience: "Corporate & brands",
    name: "Corporate packages & brand orders",
    path: "/admin/corporate",
  },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, label: "Desktop" },
  mobile: { width: 390, height: 844, label: "Mobile", isMobile: true },
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // keep waiting
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not start at ${url}`);
}

function startServer() {
  const env = {
    ...process.env,
    SCREENSHOT_MODE: "1",
    PORT: String(PORT),
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
  };

  return spawn("npm", ["run", "start", "--", "-p", String(PORT)], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Building app…");
  await new Promise((resolve, reject) => {
    const build = spawn("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });
    build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("build failed"))));
  });

  console.log("Starting server on port", PORT);
  const server = startServer();
  await waitForServer(`${BASE}/`);

  const browser = await chromium.launch({ channel: "chrome" });
  const captures = [];

  for (const pageDef of PAGES) {
    for (const [key, viewport] of Object.entries(VIEWPORTS)) {
      const slug = `${slugify(pageDef.audience)}-${slugify(pageDef.name)}-${key}`;
      const filename = `${slug}.png`;
      const filepath = join(OUT_DIR, filename);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: Boolean(viewport.isMobile),
        deviceScaleFactor: viewport.isMobile ? 2 : 1,
      });
      const page = await context.newPage();
      await page.goto(`${BASE}${pageDef.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.screenshot({ path: filepath, fullPage: true });
      await context.close();

      captures.push({
        ...pageDef,
        viewport: viewport.label,
        file: `screenshots/${filename}`,
      });
      console.log("Captured", filename);
    }
  }

  await browser.close();
  server.kill("SIGTERM");

  const audiences = ["Users & members", "Admin", "Corporate & brands"];
  let md = `# Sydef — Screenshots\n\n`;
  md += `Visual walkthrough of every Sydef screen, captured **${new Date().toISOString().slice(0, 10)}**.\n\n`;
  md += `Each page is shown in **desktop (1440×900)** and **mobile (390×844)** viewports.\n\n`;
  md += `> Screenshots use \`SCREENSHOT_MODE=1\` with representative mock data for documentation.\n\n`;

  for (const audience of audiences) {
    md += `## ${audience}\n\n`;
    const items = captures.filter((c) => c.audience === audience);
    for (const item of items) {
      md += `### ${item.name} — ${item.viewport}\n\n`;
      md += `Route: \`${item.path}\`\n\n`;
      md += `![${item.name} (${item.viewport})](${item.file})\n\n`;
    }
  }

  writeFileSync(join(ROOT, "docs", "SCREENSHOTS.md"), md);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Screenshots</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #171717; margin: 0; }
    .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #fafafa; page-break-after: always; }
    .cover h1 { font-size: 42px; margin: 0 0 12px; }
    .cover p { color: #525252; font-size: 16px; }
    section { padding: 48px 56px; page-break-before: always; }
    h2 { font-size: 28px; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
    h3 { font-size: 18px; margin-top: 32px; }
    .meta { color: #737373; font-size: 13px; margin-bottom: 12px; }
    .shot { margin: 16px 0 32px; }
    .shot img { max-width: 100%; border: 1px solid #e5e5e5; border-radius: 12px; }
    .label { display: inline-block; background: #171717; color: white; font-size: 11px; padding: 4px 8px; border-radius: 999px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>Screenshots</h1>
    <p>Sydef — Psychology of Self Defence</p>
    <p>Users · Admin · Corporate &amp; brands · Desktop &amp; mobile</p>
    <p>${new Date().toISOString().slice(0, 10)}</p>
  </div>
  ${audiences
    .map((audience) => {
      const items = captures.filter((c) => c.audience === audience);
      return `<section>
        <h2>${audience}</h2>
        ${items
          .map(
            (item) => `<div class="shot">
              <span class="label">${item.viewport}</span>
              <h3>${item.name}</h3>
              <p class="meta">Route: <code>${item.path}</code></p>
              <img src="${item.file}" alt="${item.name} (${item.viewport})" />
            </div>`
          )
          .join("")}
      </section>`;
    })
    .join("")}
</body>
</html>`;

  const htmlPath = join(ROOT, "docs", "Screenshots.html");
  writeFileSync(htmlPath, html);

  const pdfBrowser = await chromium.launch({ channel: "chrome" });
  const pdfPage = await pdfBrowser.newPage();
  await pdfPage.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await pdfPage.pdf({
    path: join(ROOT, "docs", "Screenshots.pdf"),
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", bottom: "16mm", left: "12mm", right: "12mm" },
  });
  await pdfBrowser.close();

  console.log("\nDone:");
  console.log("  docs/SCREENSHOTS.md");
  console.log("  docs/Screenshots.pdf");
  console.log(`  ${captures.length} images in docs/screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
