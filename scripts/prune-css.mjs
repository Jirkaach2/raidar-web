/**
 * Removes CSS rules belonging to the deleted AppWindow/TiltStage hero mock.
 *
 * Deliberately conservative: a rule is dropped ONLY when every one of its
 * comma-separated selector parts is rooted at a class prefix in PREFIXES,
 * AND no class named in the rule appears anywhere in the remaining source.
 * Anything ambiguous is kept. Prints a full report; writes nothing unless
 * --write is passed.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const CSS = 'src/index.css';
const PREFIXES = ['aw-', 'aw', 'tpl-', 'tpl'];
const WRITE = process.argv.includes('--write');

/* ── 1. Collect every class token referenced in the surviving source ── */
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(tsx?|html)$/.test(e.name)) out.push(p);
  }
  return out;
}

const srcFiles = [...(await walk('src')), 'index.html'];
const referenced = new Set();
for (const f of srcFiles) {
  const txt = await readFile(f, 'utf8');
  for (const m of txt.matchAll(/[a-zA-Z][a-zA-Z0-9_-]*/g)) referenced.add(m[0]);
}

/* ── 2. Tokenize the stylesheet into top-level rules / at-rules ── */
const css = await readFile(CSS, 'utf8');
const nodes = [];
let i = 0;
while (i < css.length) {
  // Comments and whitespace pass straight through as literal nodes.
  if (css.startsWith('/*', i)) {
    const end = css.indexOf('*/', i + 2);
    const stop = end === -1 ? css.length : end + 2;
    nodes.push({ kind: 'raw', text: css.slice(i, stop) });
    i = stop;
    continue;
  }
  const braceAt = css.indexOf('{', i);
  if (braceAt === -1) {
    nodes.push({ kind: 'raw', text: css.slice(i) });
    break;
  }
  // Anything before the selector that is pure whitespace stays raw.
  const prelude = css.slice(i, braceAt);
  const nlCut = prelude.lastIndexOf('\n');
  if (nlCut !== -1) {
    nodes.push({ kind: 'raw', text: prelude.slice(0, nlCut + 1) });
  }
  const selector = prelude.slice(nlCut + 1);

  // Walk to the matching close brace, tracking nesting and comments.
  let depth = 0, j = braceAt;
  for (; j < css.length; j++) {
    if (css.startsWith('/*', j)) { const e = css.indexOf('*/', j + 2); j = e === -1 ? css.length : e + 1; continue; }
    if (css[j] === '{') depth++;
    else if (css[j] === '}') { depth--; if (depth === 0) break; }
  }
  const body = css.slice(braceAt, Math.min(j + 1, css.length));
  nodes.push({ kind: 'rule', selector, body, text: selector + body });
  i = j + 1;
}

/* ── 3. Decide per rule ── */
const rooted = (sel) =>
  sel.split(',').every((part) => {
    const first = part.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/);
    if (!first) return false;
    return PREFIXES.some((p) => first[1] === p || first[1].startsWith(p));
  });

const kept = [];
const dropped = [];
const keptBecauseUsed = [];

for (const n of nodes) {
  if (n.kind !== 'rule') { kept.push(n.text); continue; }
  const sel = n.selector.trim();
  if (!sel || sel.startsWith('@') || !rooted(sel)) { kept.push(n.text); continue; }

  /* Only the PREFIXED classes decide the verdict. Generic co-selectors like
     `.active` / `.on` / `.dead` appear all over the app and would otherwise
     produce false "still used" hits for rules that are unreachable now that
     their `.aw-*` / `.tpl-*` root no longer exists in any component. */
  const roots = [...n.selector.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)]
    .map((m) => m[1])
    .filter((c) => PREFIXES.some((p) => c === p || c.startsWith(p)));
  const stillUsed = roots.filter((c) => referenced.has(c));
  if (stillUsed.length) {
    keptBecauseUsed.push(`${sel}  <-- still referenced: ${[...new Set(stillUsed)].join(', ')}`);
    kept.push(n.text);
    continue;
  }
  dropped.push(sel);
}

console.log(`rules dropped:            ${dropped.length}`);
console.log(`rules kept (still used):  ${keptBecauseUsed.length}`);
if (keptBecauseUsed.length) {
  console.log('\n--- KEPT despite prefix match ---');
  for (const k of keptBecauseUsed) console.log('  ' + k);
}

const before = Buffer.byteLength(css, 'utf8');
const out = kept.join('');
const after = Buffer.byteLength(out, 'utf8');
console.log(`\nsize: ${(before / 1024).toFixed(1)} KB -> ${(after / 1024).toFixed(1)} KB  (-${((1 - after / before) * 100).toFixed(1)}%)`);

// Sanity: brace balance must survive.
const bal = (s) => (s.match(/\{/g) || []).length - (s.match(/\}/g) || []).length;
console.log(`brace balance: before=${bal(css)} after=${bal(out)}`);

if (WRITE) {
  if (bal(out) !== 0) { console.error('ABORT: unbalanced braces, not writing.'); process.exit(1); }
  await writeFile(CSS, out, 'utf8');
  console.log('\nWROTE ' + CSS);
} else {
  console.log('\n(dry run — pass --write to apply)');
}
