// Per-card check: node build/test_cards.js js/cards/batch-3.js [games per card]   (or: node build/test_cards.js "Card A" "Card B")
// For each card it plays random duels with decks that run it (plus a deck built around it), steering the random player
// toward that card, and reports: crashes (with the stack), stuck games, and cards whose effect never happened.
const fs = require('fs'), path = require('path');
const load = require('./load');
const { E, C, DECKS } = load();
const args = process.argv.slice(2); let names = [], per = 12;
for (const a of args) { if (/^\d+$/.test(a)) per = +a; else if (a.endsWith('.js')) { const src = fs.readFileSync(a, 'utf8'); for (const m of src.matchAll(/^\s{2}(['"])((?:(?!\1)[^\\]|\\.)+)\1:\s*\{/gm)) names.push(m[2].replace(/\\(.)/g, '$1')); } else names.push(a); }
const byName = new Map(C.map(c => [c.n, c]));
const FILLERS = DECKS.find(d => d.name === 'Blackwing');
let rnd = 7; const R = () => { rnd = (rnd * 1103515245 + 12345) & 0x7fffffff; return rnd / 0x7fffffff; };
let bad = 0;
for (const n of names) {
  const card = byName.get(n); if (!card) { console.log(`?? ${n}: not in the card data`); bad++; continue; }
  if (!E.hasScript(n)) { console.log(`-- ${n}: no script`); bad++; continue; }
  const decks = DECKS.filter(d => [...d.main, ...d.extra, ...(d.side || [])].includes(card.id));
  const extraSide = card.k === 'synchro' || card.k === 'fusion';
  const built = { name: 'test', main: [...Array(3).fill(card.id).filter(() => !extraSide), ...(decks[0] || FILLERS).main].slice(0, 40), extra: [...(extraSide ? [card.id, card.id] : []), ...(decks[0] || FILLERS).extra].slice(0, 15) };
  const pool = [built, ...decks.map(d => ({ ...d, main: d.main.concat((d.side || []).filter(x => x === card.id)).slice(0, 60) }))];
  let used = 0, crashes = new Map(), stuck = 0;
  const lc = n.toLowerCase();
  for (let i = 0; i < per; i++) {
    const d0 = pool[i % pool.length], d1 = DECKS[Math.floor(R() * DECKS.length)];
    try {
      const g = E.newDuel({ decks: [d0, d1], first: i % 2, seed: 1000 + i, names: ['A', 'B'] });
      let k = 0;
      while (g.prompt && k++ < 3000) {
        const pr = g.prompt; const o = pr.opts;
        const mine = o.filter(x => (x.label + ' ' + (x.u != null ? (cardName(g, x.u) || '') : '')).toLowerCase().includes(lc));
        let ans;
        if ((pr.type === 'idle' || pr.type === 'respond') && mine.length && R() < 0.85) ans = [mine[Math.floor(R() * mine.length)].key];
        else if (pr.type === 'idle') { const a = o.filter(x => !['end', 'endbp'].includes(x.key)); const bp = o.find(x => x.key === 'bp'); ans = bp && R() < .35 ? ['bp'] : a.length && R() < .75 ? [a[Math.floor(R() * a.length)].key] : [(o.find(x => x.key === 'endbp') || o.find(x => x.key === 'end') || o[0]).key]; }
        else if (pr.type === 'respond') ans = R() < .6 ? ['pass'] : [o[Math.floor(R() * o.length)].key];
        else if (pr.type === 'yesno') ans = [R() < .8 ? 'y' : 'n'];
        else { const m = pr.min + Math.floor(R() * (pr.max - pr.min + 1)); ans = o.slice().sort(() => R() - .5).slice(0, m).map(x => x.key); }
        E.act(g, ans);
      }
      if (g.prompt) stuck++;
      used += g.log.filter(l => l.toLowerCase().includes(lc) && /activated|summoned|took control|banished|destroyed|gained|returned|added|sent|equipped|special summon/i.test(l)).length > 0 ? 1 : 0;
    } catch (e) { const key = (e.stack || String(e)).split('\n').slice(0, 4).join(' | '); crashes.set(key, (crashes.get(key) || 0) + 1); }
  }
  const ok = !crashes.size && !stuck;
  if (!ok) bad++;
  console.log(`${ok ? (used ? 'ok ' : 'ok?') : 'BAD'} ${n}: used in ${used}/${per} duels${stuck ? `, ${stuck} stuck` : ''}${crashes.size ? '' : ''}`);
  for (const [k, c] of crashes) console.log(`    crash x${c}: ${k}`);
}
function cardName(g, u) { for (const P of g.p) for (const z of ['hand', 'm', 'st', 'gy', 'ban', 'extra', 'deck']) for (const c of P[z]) if (c && c.u === u) return E.data(c).n; return null; }
console.log(bad ? `\n${bad} card(s) need work.` : '\nAll cards ran clean.');
process.exit(bad ? 1 : 0);
