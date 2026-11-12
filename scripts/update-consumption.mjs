#!/usr/bin/env node
// Updates the "This week's update consumed ..." banner in index.html (issue #110).
//
// Flow:
//   1. Download the pinned ccusage native binary from npm, verify its sha512
//      against scripts/consumption.lock.json, and read this Claude Code
//      session's token usage.
//   2. Download a fresh copy of the AI consumption calculator from GitHub and
//      verify its sha256 against the lock file. A mismatch means the calculator
//      changed (legitimately or not); the script stops and changes nothing.
//   3. Run the calculator's own JavaScript against a stub DOM, using the Claude
//      provider, and read the floor (lower-bound) water/energy figures it renders.
//   4. Rewrite the banner in index.html. Git is left to the caller.
//
// Usage: node scripts/update-consumption.mjs [--session <uuid>] [--dry-run]
// The session defaults to $CLAUDE_CODE_SESSION_ID, which Claude Code sets.
//
// No npm dependencies, only Node built-ins. Requires Node 18+ and `tar`.

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import vm from 'node:vm';

const run = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK = JSON.parse(await readFile(join(ROOT, 'scripts', 'consumption.lock.json'), 'utf8'));
const INDEX = join(ROOT, 'index.html');
const BANNER_RE = /This week's update consumed 💧 [\d.,]+ mL of water and ⚡ [\d.,]+ Wh of energy/g;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class Fatal extends Error {}

function parseArgs(argv) {
  const opts = { session: process.env.CLAUDE_CODE_SESSION_ID, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dry-run') opts.dryRun = true;
    else if (argv[i] === '--session') opts.session = argv[++i];
    else throw new Fatal(`Unknown argument: ${argv[i]}`);
  }
  if (!opts.session) throw new Fatal('No session id: pass --session <uuid> or run inside Claude Code (CLAUDE_CODE_SESSION_ID).');
  if (!UUID_RE.test(opts.session)) throw new Fatal(`Session id is not a UUID: ${opts.session}`);
  return opts;
}

async function download(url) {
  if (!url.startsWith('https://')) throw new Fatal(`Refusing non-HTTPS URL: ${url}`);
  const res = await fetch(url, { redirect: 'error', cache: 'no-store' });
  if (!res.ok) throw new Fatal(`Download failed (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

// --- 1. Token usage via pinned, hash-verified ccusage ----------------------

async function getTokenUsage(sessionId, workDir) {
  const platform = `${process.platform}-${process.arch}`;
  const pkg = LOCK.ccusage.packages[platform];
  if (!pkg) throw new Fatal(`No pinned ccusage binary for ${platform}; add one to consumption.lock.json.`);

  const tgz = await download(pkg.tarball);
  const actual = 'sha512-' + createHash('sha512').update(tgz).digest('base64');
  if (actual !== pkg.integrity) {
    throw new Fatal(`ccusage tarball hash mismatch for ${platform}.\n  expected ${pkg.integrity}\n  actual   ${actual}`);
  }

  const tgzPath = join(workDir, 'ccusage.tgz');
  await writeFile(tgzPath, tgz);
  await run('tar', ['-xzf', tgzPath, '-C', workDir, 'package/bin/ccusage']);
  const bin = join(workDir, 'package', 'bin', 'ccusage');
  await chmod(bin, 0o755);

  // --offline / --no-cost: no pricing fetch, we only need token counts.
  const { stdout } = await run(bin, ['session', '--id', sessionId, '--json', '--offline', '--no-cost', '--no-color'],
    { maxBuffer: 64 * 1024 * 1024, timeout: 120_000 });
  const report = JSON.parse(stdout);
  if (!report || !Array.isArray(report.entries) || report.entries.length === 0) {
    throw new Fatal(`ccusage found no usage for session ${sessionId}.`);
  }
  let input = 0, output = 0;
  for (const e of report.entries) {
    input += Number(e.inputTokens) || 0;
    output += Number(e.outputTokens) || 0;
  }
  return { input, output, messages: report.entries.length };
}

// --- 2 & 3. Hash-verified calculator, run against a stub DOM ---------------

async function fetchVerifiedCalculator() {
  const html = await download(LOCK.calculator.url);
  const actual = createHash('sha256').update(html).digest('hex');
  if (actual !== LOCK.calculator.sha256) {
    throw new Fatal(
      `Calculator hash mismatch: the page at ${LOCK.calculator.url} has changed.\n` +
      `  expected ${LOCK.calculator.sha256}\n  actual   ${actual}\n` +
      `Review the upstream diff since ${LOCK.calculator.reviewedCommit}. If it is legitimate, ` +
      `update calculator.sha256 and reviewedCommit in scripts/consumption.lock.json.`);
  }
  return { html: html.toString('utf8'), sha256: actual };
}

function runCalculator(html, outputTokens, inputTokens) {
  // The calculator logic lives in the page's last inline <script>.
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const code = scripts.find(s => s.includes('function calc()'));
  if (!code) throw new Fatal('Could not find calculator script in the page.');

  // Minimal DOM: just enough for the page's script to run headless.
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        id, value: '', innerHTML: '', textContent: '',
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener() {}, setAttribute() {},
      });
    }
    return elements.get(id);
  };
  el('outTok').value = String(outputTokens);
  el('inTok').value = String(inputTokens);
  el('nQ').value = '';

  const document = {
    getElementById: el,
    querySelector: sel => el(sel),
    querySelectorAll: () => [],
  };
  const window = { innerWidth: 1200, addEventListener() {} };
  // Hash verification is the security boundary; the vm context only keeps the
  // page's code away from require/process/fs and caps its runtime.
  const context = vm.createContext(
    { document, window, requestAnimationFrame() {} },
    { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(code + '\n;sel("claude");', context, { timeout: 2000 });

  // Claude renders an estimated range, "floor–ceiling <span ...>unit</span>".
  // The PitchMap banner shows the floor (lower bound, Oviedo et al. 2026).
  const floor = (id, unit) => {
    const m = el(id).innerHTML.match(/^([\d.]+)–([\d.]+) <span class="ru">(\w+)<\/span>$/);
    if (!m || m[3] !== unit) throw new Fatal(`Unexpected calculator output in #${id}: ${el(id).innerHTML}`);
    if (!Number.isFinite(Number(m[1]))) throw new Fatal(`Non-numeric ${unit} value: ${m[1]}`);
    return m[1];
  };
  return { waterMl: floor('wtD', 'mL'), energyWh: floor('etD', 'Wh') };
}

// --- 4. Update index.html ---------------------------------------------------

async function updateBanner(waterMl, energyWh, dryRun) {
  const html = await readFile(INDEX, 'utf8');
  const matches = html.match(BANNER_RE) || [];
  if (matches.length !== 1) throw new Fatal(`Expected exactly one consumption banner in index.html, found ${matches.length}.`);
  const replacement = `This week's update consumed 💧 ${waterMl} mL of water and ⚡ ${energyWh} Wh of energy`;
  if (!dryRun) await writeFile(INDEX, html.replace(BANNER_RE, replacement));
  return { before: matches[0], after: replacement };
}

// --- main -------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const workDir = await mkdtemp(join(tmpdir(), 'pitchmap-consumption-'));
  try {
    // Verify the calculator first so a tampered page fails fast.
    const calc = await fetchVerifiedCalculator();
    const tokens = await getTokenUsage(opts.session, workDir);
    if (tokens.output <= 0) throw new Fatal('Session reported zero output tokens; refusing to update.');
    const result = runCalculator(calc.html, tokens.output, tokens.input);
    const banner = await updateBanner(result.waterMl, result.energyWh, opts.dryRun);
    console.log(JSON.stringify({
      ok: true,
      dryRun: opts.dryRun,
      session: opts.session,
      tokens,
      waterMl: result.waterMl,
      energyWh: result.energyWh,
      calculatorSha256: calc.sha256,
      ccusageVersion: LOCK.ccusage.version,
      banner,
    }, null, 2));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(`update-consumption: ${err instanceof Fatal ? err.message : err.stack}`);
  console.error('index.html was not modified.');
  process.exit(1);
});
