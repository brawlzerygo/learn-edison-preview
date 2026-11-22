// Engine soak test: node build/test_engine.js [games] [tier]
// Plays full duels between random legal players (any answer from each prompt) and reports crashes, stuck games and stats.
const { ctx, E } = require('./load')();
const N = +process.argv[2] || 200, tier = process.argv[3] || 'Best';
const decks = ctx.window.EDISON_DECKS.filter(d => tier === 'all' || d.tier === tier);
let rnd = 12345; const R = () => { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; };
const stats = { done: 0, stuck: 0, crash: 0, turns: 0, prompts: 0, kinds: {}, why: {} };
const errors = new Map();
function answer(pr) {
  const o = pr.opts; let k;
  if (pr.type === 'idle') { // lean toward doing things, end turn sometimes
    const act = o.filter(x => !['end', 'endbp'].includes(x.key));
    const bp = o.find(x => x.key === 'bp');
    if (bp && R() < 0.35) return ['bp'];
    if (act.length && R() < 0.8) return [act[Math.floor(R() * act.length)].key];
    return [(o.find(x => x.key === 'endbp') || o.find(x => x.key === 'end') || o[o.length - 1]).key];
  }
  if (pr.type === 'respond') { if (R() < 0.6) return ['pass']; const a = o.filter(x => x.key !== 'pass'); return [a[Math.floor(R() * a.length)].key]; }
  const n = pr.min + Math.floor(R() * (pr.max - pr.min + 1));
  const sh = o.slice().sort(() => R() - 0.5); return sh.slice(0, n).map(x => x.key);
}
for (let i = 0; i < N; i++) {
  const d0 = decks[Math.floor(R() * decks.length)], d1 = decks[Math.floor(R() * decks.length)];
  let g;
  try {
    g = E.newDuel({ decks: [d0, d1], first: i % 2, seed: i + 1, names: ['P1', 'P2'], quiet: true });
    let n = 0;
    while (g.prompt && n < 4000) { const pr = g.prompt; stats.kinds[pr.type] = (stats.kinds[pr.type] || 0) + 1; E.act(g, answer(pr)); n++; }
    stats.prompts += n; stats.turns += g.turnNo;
    if (g.prompt) { stats.stuck++; if (stats.stuck < 4) console.log('STUCK', d0.name, 'vs', d1.name, 'turn', g.turnNo, g.prompt.type, g.prompt.text); }
    else { stats.done++; const w = (g.why || '').replace(/P[12]/, 'P'); stats.why[w] = (stats.why[w] || 0) + 1; }
  } catch (e) {
    stats.crash++; const key = (e.stack || String(e)).split('\n').slice(0, 3).join(' | ');
    errors.set(key, (errors.get(key) || 0) + 1);
  }
}
console.log(JSON.stringify(stats, null, 1));
for (const [k, n] of errors) console.log(n + 'x', k);
// cloning check
const g = E.newDuel({ decks: [decks[0], decks[1 % decks.length]], first: 0, seed: 99, quiet: true });
for (let n = 0; n < 150 && g.prompt; n++) E.act(g, answer(g.prompt));
const h = E.clone(g);
console.log('clone matches:', JSON.stringify(h.prompt) === JSON.stringify(g.prompt) && h.p[0].lp === g.p[0].lp && h.p[1].hand.length === g.p[1].hand.length);
