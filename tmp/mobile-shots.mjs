import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "tmp/shots";
fs.mkdirSync(OUT, { recursive: true });

const shots = process.argv.slice(2); // e.g. landing login
const base = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

async function snap(name, url) {
  await page.goto(base + url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`saved ${name}.png  (${url})`);
}

if (shots.includes("landing")) await snap("landing", "/");
if (shots.includes("login")) await snap("login", "/login");

console.log("CONSOLE_ERRORS:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();
