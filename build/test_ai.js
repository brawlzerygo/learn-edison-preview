// AI check: node build/test_ai.js [games] [level] [opponent: random|easy|normal|hard]
const { ctx, E, AI } = require('./load')({ ai: true });
const N = +process.argv[2] || 10, lvl = process.argv[3] || 'normal', oppL = process.argv[4] || 'random';
const decks = ctx.window.EDISON_DECKS.filter(d => d.tier === 'Best');
const rand = pr => { const o = pr.opts; if (pr.type === 'idle') { const a = o.filter(x => !['end', 'endbp'].includes(x.key)); if (a.length && Math.random() < .7) return [a[Math.floor(Math.random() * a.length)].key]; return [(o.find(x => x.key === 'endbp') || o.find(x => x.key === 'end') || o[0]).key]; } if (pr.type === 'respond') return Math.random() < .6 ? ['pass'] : [o[0].key]; const n = pr.min; return o.slice().sort(() => Math.random() - .5).slice(0, Math.max(n, 1)).map(x => x.key); };
let wins = 0, t0 = Date.now(), decisions = 0, slow = 0, maxMs = 0, turns = 0;
for (let i = 0; i < N; i++) {
  const g = E.newDuel({ decks: [decks[i % 5], decks[(i + 2) % 5]], first: i % 2, quiet: true, names: ['AI', 'Opp'] });
  let n = 0;
  while (g.prompt && n++ < 3000) {
    if (g.prompt.p === 0) { const t = Date.now(); E.act(g, AI.decide(g, 0, lvl)); const ms = Date.now() - t; decisions++; maxMs = Math.max(maxMs, ms); if (ms > 1500) slow++; }
    else E.act(g, oppL === 'random' ? rand(g.prompt) : AI.decide(g, 1, oppL));
  }
  if (g.winner === 0) wins++; turns += g.turnNo;
  console.log(`game ${i + 1}: ${decks[i % 5].name} vs ${decks[(i + 2) % 5].name}: ${g.winner === 0 ? 'AI won' : g.winner === 1 ? 'opponent won' : 'unfinished'} in ${g.turnNo} turns (${g.why})`);
}
console.log(`AI (${lvl}) won ${wins}/${N} vs ${oppL}. ${decisions} decisions, ${((Date.now() - t0) / decisions).toFixed(0)} ms avg incl. opponent, max ${maxMs} ms, ${slow} over 1.5 s, ${(turns / N).toFixed(1)} turns per game.`);
