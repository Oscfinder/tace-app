// Usage: node cdp.mjs <url> [cookieJson]
// Opens the URL in headless Edge over the DevTools protocol and prints every
// console message, log entry (this is where CSP violations appear) and page
// exception, plus whether the React app hydrated (a hydrated page has React
// props on its DOM nodes).
import { spawn } from "node:child_process";

const url = process.argv[2];
const cookie = process.argv[3];
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = `${process.env.TEMP}/cdp-profile-${port}`;
const proc = spawn(EDGE, [
  "--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--disable-extensions", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {}
  await sleep(250);
}
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const seen = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); return; }
  if (d.method === "Log.entryAdded") seen.push(`LOG[${d.params.entry.source}/${d.params.entry.level}] ${d.params.entry.text} ${d.params.entry.url ?? ""}`);
  if (d.method === "Runtime.consoleAPICalled") seen.push(`CONSOLE[${d.params.type}] ${d.params.args.map((a) => a.value ?? a.description).join(" ")}`);
  if (d.method === "Runtime.exceptionThrown") seen.push(`EXCEPTION ${d.params.exceptionDetails.text} ${d.params.exceptionDetails.exception?.description ?? ""}`);
};
await send("Log.enable"); await send("Runtime.enable"); await send("Network.enable");
if (cookie) {
  const c = JSON.parse(cookie);
  await send("Network.setCookie", c);
}
await send("Page.navigate", { url });
await sleep(7000);
const r = await send("Runtime.evaluate", {
  expression: `JSON.stringify({title: document.title, h1: document.querySelector('h1')?.textContent?.slice(0,60) ?? null,
    hydrated: [...document.querySelectorAll('*')].some(n => Object.keys(n).some(k => k.startsWith('__reactFiber') || k.startsWith('__reactProps'))),
    inputs: document.querySelectorAll('input').length})`,
  returnByValue: true,
});
console.log("PAGE:", r.result.value);
const csp = seen.filter((s) => /content security policy|refused to/i.test(s));
console.log("CSP violations:", csp.length);
for (const s of csp) console.log("  ", s.slice(0, 260));
const other = seen.filter((s) => !csp.includes(s));
console.log("FULL:", seen.filter((s) => s.startsWith("EXCEPTION")).join(" | ").slice(0, 6000));
console.log("Other messages:", other.length);
for (const s of other.slice(0, 8)) console.log("  ", s.slice(0, 200));
ws.close(); proc.kill();
process.exit(0);
