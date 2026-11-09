#!/usr/bin/env node
// talalevel — Tala Level from the command line (MCP plan §5c, task 10; Bassel, 2026-11-08: "all four liked"). It
// speaks the REST API with a workspace's key, through one door that runs the same tools an AI app's connection runs
// (`/api/v1/tools`): the key's grant decides what is listed and what is refused, and every call is logged and counted
// as the app's are. No dependencies, so `npx talalevel` starts at once. Output is the tool's own short text; --json
// gives its fields. Coding agents learn it from `talalevel tools` and `talalevel help <command>`.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const VERSION = "0.1.0";
const BASE = (process.env.TALALEVEL_URL || "https://app.talalevel.com").replace(/\/+$/, "");
const KEY_FILE = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "talalevel", "key");

const USAGE = `talalevel ${VERSION} — Tala Level from the command line, with a workspace's API key.

Usage:
  talalevel login                    Save a key, read from stdin (never type it as an argument)
  talalevel tools                    Every command this key may run, one line each
  talalevel help <command>           What a command does and the options it takes
  talalevel <command> [--option value ...] [--json] [--yes]

Examples:
  talalevel search_leads --query "acme"
  talalevel get_lead --lead_id 123
  talalevel add_note --lead_id 123 --text "Owner back Monday"
  talalevel send_text --lead_id 123 --text "Hi Sam, Dan here." --yes

Options take text, numbers, true/false, or JSON for lists: --lead_ids '[1,2,3]'.
A command that sends to a merchant or starts a batch or a run asks first; --yes answers yes (an agent passes it only
once the person has said yes). Batches, waves and AI caller runs are previewed first: the preview gives the id the
start takes.

Key: TALALEVEL_KEY, else the one saved by login (${KEY_FILE}). Owners make keys in Settings → API and webhooks.
App: TALALEVEL_URL (default ${BASE}).`;

const fail = (words, code = 1) => { process.stderr.write(`${words}\n`); process.exit(code); };

function key() {
  const fromEnv = process.env.TALALEVEL_KEY?.trim();
  if (fromEnv) return fromEnv;
  if (existsSync(KEY_FILE)) return readFileSync(KEY_FILE, "utf8").trim();
  return fail("No key. Run `talalevel login` and paste the key, or set TALALEVEL_KEY.");
}

async function call(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}/api/v1${path}`, { method, headers: { authorization: `Bearer ${key()}`, "content-type": "application/json", "user-agent": `talalevel-cli/${VERSION}` }, body: body ? JSON.stringify(body) : undefined });
  } catch (error) { return fail(`Could not reach ${BASE}: ${error instanceof Error ? error.message : String(error)}`); }
  const answer = await res.json().catch(() => ({}));
  if (res.status === 429) return fail(`Too many calls; try again in ${res.headers.get("retry-after") ?? "a minute"} seconds.`);
  if (!res.ok) return fail(answer.error ? `${answer.error}${answer.needs ? ` (the key needs ${answer.area} at ${answer.needs})` : ""}` : `The app answered ${res.status}.`, res.status === 422 ? 3 : 1);
  return answer;
}

/** --name value pairs, read as the tool's own types would take them. */
function options(argv) {
  const out = {}; const flags = { json: false, yes: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") { flags.json = true; continue; }
    if (arg === "--yes" || arg === "-y") { flags.yes = true; continue; }
    const m = /^--([a-z_]+)(?:=(.*))?$/.exec(arg);
    if (!m) fail(`Not an option: ${arg}. Options look like --lead_id 123.`);
    let value = m[2] ?? argv[i + 1];
    if (m[2] === undefined) { if (value === undefined || value.startsWith("--")) value = "true"; else i++; }
    out[m[1]] = value;
  }
  return { args: out, flags };
}

/** A value as the tool's input schema says it should be: a number, a boolean, a list, or text. */
function typed(raw, schema = {}) {
  const kinds = [schema.type, ...(schema.anyOf ?? []).map((s) => s.type)].flat().filter(Boolean);
  if (kinds.includes("array") || kinds.includes("object")) { try { return JSON.parse(raw); } catch { return fail(`Expected JSON, like '[1,2]', got ${raw}`); } }
  if ((kinds.includes("integer") || kinds.includes("number")) && /^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if (kinds.includes("boolean") && /^(true|false)$/.test(raw)) return raw === "true";
  return raw;
}

async function ask(question) {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const answer = await new Promise((resolve) => rl.question(`${question} [y/N] `, resolve));
  rl.close();
  return /^y(es)?$/i.test(String(answer).trim());
}

function describe(tool) {
  const props = tool.input?.properties ?? {}; const required = new Set(tool.input?.required ?? []);
  const lines = [`${tool.name} — ${tool.title}${tool.sends ? " (sends: asks first)" : tool.changes ? " (changes)" : ""}`, "", tool.description, ""];
  const names = Object.keys(props);
  if (!names.length) lines.push("No options.");
  for (const name of names) {
    const p = props[name]; const kind = p.enum ? p.enum.join("|") : (p.type ?? (p.anyOf ?? []).map((s) => s.type).filter(Boolean).join("|")) || "value";
    lines.push(`  --${name} <${kind}>${required.has(name) ? " (required)" : ""}${p.default !== undefined ? ` (default ${JSON.stringify(p.default)})` : ""}${p.description ? `\n      ${p.description}` : ""}`);
  }
  return lines.join("\n");
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h" || (command === "help" && !rest[0])) return console.log(USAGE);
  if (command === "--version" || command === "-v") return console.log(VERSION);
  if (command === "login") {
    process.stderr.write("Paste the key (Settings → API and webhooks), then Enter: ");
    const line = await new Promise((resolve) => { const rl = createInterface({ input: process.stdin }); rl.once("line", (l) => { rl.close(); resolve(l.trim()); }); });
    if (!/^tl_(live|test)_\S+$/.test(line)) return fail("That is not a Tala Level key (they start tl_live_).");
    mkdirSync(join(KEY_FILE, ".."), { recursive: true });
    writeFileSync(KEY_FILE, `${line}\n`, { mode: 0o600 }); chmodSync(KEY_FILE, 0o600);
    process.env.TALALEVEL_KEY = line;
    const { tools } = await call("GET", "/tools");
    return console.log(`Saved. This key may run ${tools.length} commands; \`talalevel tools\` lists them.`);
  }
  const { tools } = await call("GET", "/tools");
  if (command === "tools") {
    const width = Math.max(...tools.map((t) => t.name.length));
    return console.log(tools.map((t) => `${t.name.padEnd(width)}  ${t.title}${t.sends ? " (sends)" : t.changes ? " (changes)" : ""}`).join("\n"));
  }
  if (command === "help") {
    const tool = tools.find((t) => t.name === rest[0]);
    return tool ? console.log(describe(tool)) : fail(`No command ${rest[0]} for this key. \`talalevel tools\` lists them.`);
  }
  const tool = tools.find((t) => t.name === command || t.name === command.replace(/-/g, "_"));
  if (!tool) return fail(`No command ${command} for this key (its grant may not allow it). \`talalevel tools\` lists them.`);
  const { args, flags } = options(rest);
  if (args.help) return console.log(describe(tool));
  const props = tool.input?.properties ?? {};
  const input = Object.fromEntries(Object.entries(args).map(([name, raw]) => {
    if (!props[name]) fail(`${tool.name} takes no --${name}. \`talalevel help ${tool.name}\` lists its options.`);
    return [name, typed(raw, props[name])];
  }));
  if (tool.sends && !flags.yes && !(await ask(`${tool.title}: this reaches a merchant or starts something that does. Go ahead?`))) {
    return fail(`Not run. ${process.stdin.isTTY ? "" : "Pass --yes once the person has said yes."}`.trim(), 2);
  }
  const answer = await call("POST", `/tools/${tool.name}`, input);
  console.log(flags.json ? JSON.stringify(answer.data ?? answer, null, 2) : answer.text);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
