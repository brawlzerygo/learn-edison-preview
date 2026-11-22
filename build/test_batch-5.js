// Scenario checks for js/cards/batch-5.js: node build/test_batch-5.js
const { E, C } = require('./load')();
const id = n => { const c = C.find(x => x.n === n); if (!c) throw new Error('no card ' + n); return c.id; };
const FILL = 'Gene-Warped Warwolf';
function duel(h0, h1, o = {}) {
  const mk = (h, ex) => ({ name: 't', main: [...h.map(id), ...Array(40 - h.length).fill(id(FILL))], extra: (ex || []).map(id) });
  return E.newDuel({ decks: [mk(h0, o.ex0), mk(h1, o.ex1)], first: 0, seed: 1, noShuffle: true, names: ['A', 'B'], board: o.board });
}
let fails = 0;
function ok(cond, msg) { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; }
function choose(g, text) {
  const pr = g.prompt; if (!pr) throw new Error('no prompt for ' + text);
  const o = pr.opts.find(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
  if (!o) throw new Error(`no option "${text}" in ${pr.type} "${pr.text}": ${pr.opts.map(x => x.label + '[' + x.key + ']').join(', ')}`);
  E.act(g, [o.key]);
}
const hasOpt = (g, text) => g.prompt && g.prompt.opts.some(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
const handU = (g, p, n) => g.p[p].hand.find(c => E.name(c) === n).u;
const passAll = (g, upto = 20) => { for (let i = 0; i < upto && g.prompt && g.prompt.type === 'respond'; i++) E.act(g, ['pass']); };
const yes = g => { if (g.prompt && g.prompt.type === 'yesno') E.act(g, ['y']); };
const names = (arr) => arr.filter(Boolean).map(c => E.name(c));
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };

T('King Tiger Wanghu destroys a 1400 or less summon', () => {
  const g = duel([FILL, FILL, FILL, FILL, FILL, FILL], [FILL], { board: [{ hand: ['Mother Grizzly'] }, { m: ['King Tiger Wanghu'] }] });
  choose(g, 'ns:' + handU(g, 0, 'Mother Grizzly')); passAll(g); yes(g); passAll(g);
  ok(g.p[0].gy.some(c => E.name(c) === 'Mother Grizzly'), 'Mother Grizzly is destroyed by Wanghu');
});
T('Breaker gets a counter, then destroys a Spell/Trap', () => {
  const g = duel([FILL, FILL, FILL, FILL, FILL, FILL], [FILL], { board: [{ hand: ['Breaker the Magical Warrior'] }, { st: ['Mirror Force'] }] });
  choose(g, 'ns:' + handU(g, 0, 'Breaker the Magical Warrior')); passAll(g);
  const b = g.p[0].m.find(Boolean);
  ok(E.atk(g, b) === 1900, 'Breaker has 1900 ATK with a Spell Counter');
  choose(g, 'Remove a Spell Counter'); passAll(g);
  ok(g.p[1].gy.some(c => E.name(c) === 'Mirror Force') && E.atk(g, b) === 1600, 'Mirror Force destroyed, Breaker back to 1600');
});
T('Herald of Purple Light negates a Trap', () => {
  const g2 = duel([FILL, FILL, FILL, FILL, FILL, FILL], [FILL], { board: [{ st: ['Jar of Greed'] }, { hand: ['Herald of Purple Light', 'Herald of Orange Light'] }] });
  choose(g2, 'a:' + g2.p[0].st[0].u + ':');
  ok(hasOpt(g2, 'Negate a Trap'), 'Herald is offered'); choose(g2, 'Negate a Trap'); passAll(g2);
  ok(g2.p[1].gy.length === 2 && g2.p[0].gy.some(c => E.name(c) === 'Jar of Greed') && g2.p[0].hand.length === 6, 'Jar of Greed negated, no draw');
});
T('Crystal Beast is placed as a Continuous Spell when destroyed', () => {
  const g = duel(['Mystical Space Typhoon', FILL, FILL, FILL, FILL, FILL], [FILL], { board: [{ hand: ['Crystal Beacon', 'Rare Value', FILL], m: ['Gene-Warped Warwolf'], turn: 3 }, { m: ['Crystal Beast Topaz Tiger'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack Crystal Beast'); passAll(g, 40); yes(g); passAll(g);
  const st = g.p[1].st.find(Boolean);
  ok(st && E.name(st) === 'Crystal Beast Topaz Tiger' && st.pos === 'up', 'Topaz Tiger sits face-up in the Spell & Trap Zone');
});
T('Overload Fusion: Chimeratech Overdragon with 3 materials', () => {
  const g = duel([FILL, FILL, FILL, FILL, FILL, FILL], [FILL], { ex0: ['Chimeratech Overdragon'], board: [{ hand: ['Overload Fusion'], gy: ['Cyber Dragon', 'Dekoichi the Battlechanted Locomotive', 'Black Salvo'] }, null] });
  choose(g, 'a:' + handU(g, 0, 'Overload Fusion') + ':'); passAll(g);
  if (g.prompt && g.prompt.type === 'pick' && /Machine monsters/.test(g.prompt.text)) E.act(g, g.prompt.opts.map(o => o.key));
  passAll(g);
  const od = g.p[0].m.find(c => c && E.name(c) === 'Chimeratech Overdragon');
  ok(od && E.atk(g, od) === 2400 && E.def(g, od) === 2400, 'Overdragon is 2400/2400');
  ok(g.p[0].ban.length === 3, '3 materials banished');
});
T('Wall of Revealing Light stops weaker attackers', () => {
  const g = duel([FILL, FILL, FILL, FILL, FILL, FILL], [FILL], { board: [{ m: ['Gene-Warped Warwolf'], turn: 3 }, { st: ['Wall of Revealing Light'] }] });
  const w = g.p[1].st[0]; w.turnIn = -5; w.pos = 'up'; w.flags.wall = 2000; g.seq++;
  choose(g, 'bp'); passAll(g);
  ok(!hasOpt(g, 'Attack'), 'Warwolf (2000) cannot attack');
});
console.log(fails ? `\n${fails} check(s) failed.` : '\nAll batch-5 checks passed.');
process.exit(fails ? 1 : 0);
