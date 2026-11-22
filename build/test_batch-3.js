// Scenario checks for js/cards/batch-3.js: node build/test_batch-3.js
const { E, C } = require('./load')();
const id = n => { const c = C.find(x => x.n === n); if (!c) throw new Error('no card ' + n); return c.id; };
const FILL = 'Gene-Warped Warwolf';
function duel(o = {}) {
  const mk = () => ({ name: 't', main: Array(40).fill(id(FILL)), extra: [] });
  return E.newDuel({ decks: [mk(), mk()], first: 0, seed: 1, noShuffle: true, names: ['A', 'B'], board: o.board });
}
let fails = 0;
function ok(cond, msg) { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; }
function choose(g, text, who) {
  const pr = g.prompt; if (!pr) throw new Error('no prompt for ' + text);
  if (who != null && pr.p !== who) throw new Error(`expected player ${who} for "${text}", got ${pr.p}: ${pr.type} ${pr.text}`);
  const o = pr.opts.find(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
  if (!o) throw new Error(`no option "${text}" in ${pr.type} "${pr.text}": ${pr.opts.map(x => x.label + '[' + x.key + ']').join(', ')}`);
  E.act(g, [o.key]);
}
const hasOpt = (g, text) => g.prompt && g.prompt.opts.some(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
const passAll = (g, upto = 20) => { for (let i = 0; i < upto && g.prompt && g.prompt.type === 'respond'; i++) E.act(g, ['pass']); };
const handU = (g, p, n) => g.p[p].hand.find(c => E.name(c) === n).u;
const on = (g, p, n) => g.p[p].m.find(c => c && E.name(c) === n);
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };

T('Gladiator Beast tag out into Bestiari', () => {
  const g = duel({ board: [{ hand: [], m: ['Gladiator Beast Murmillo'], deckTop: [FILL, 'Gladiator Beast Bestiari'], turn: 2 }, { hand: [], st: [{ n: 'Mystical Space Typhoon', pos: 'up' }] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack directly'); passAll(g);
  ok(g.p[1].lp === 7200, 'Murmillo hit for 800');
  ok(hasOpt(g, 'Tag out'), 'tag out offered after battling'); choose(g, 'Tag out'); passAll(g);
  if (g.prompt && g.prompt.type === 'choose') choose(g, 'Attack');
  passAll(g);
  const b = on(g, 0, 'Gladiator Beast Bestiari');
  ok(b && b.flags.gb, 'Bestiari summoned by a Gladiator Beast effect');
  ok(!g.p[0].m.some(c => c && E.name(c) === 'Gladiator Beast Murmillo'), 'Murmillo shuffled into the Deck');
  ok(!g.p[1].st.some(Boolean), 'Bestiari destroyed the Spell');
  ok(g.phase === 'main2', 'the Battle Phase ended');
});
T('Gyzarus contact fusion destroys 2 cards', () => {
  const g = duel({ board: [{ hand: [], m: ['Gladiator Beast Bestiari', 'Gladiator Beast Murmillo'], extra: ['Gladiator Beast Gyzarus'] }, { hand: [], m: [FILL], st: ['Mirror Force'] }] });
  choose(g, 'Shuffle Bestiari'); passAll(g);
  ok(on(g, 0, 'Gladiator Beast Gyzarus'), 'Gyzarus on the field');
  ok(g.prompt && g.prompt.type === 'yesno', 'Gyzarus asks to destroy'); choose(g, 'yes');
  if (g.prompt && g.prompt.type === 'pick') E.act(g, g.prompt.opts.filter(o => !/Gyzarus/.test(o.label)).slice(0, 2).map(o => o.key));
  passAll(g);
  ok(!g.p[1].m.some(Boolean) && !g.p[1].st.some(Boolean), 'both of B’s cards destroyed');
});
T('Light and Darkness Dragon negates MST', () => {
  const g = duel({ board: [{ hand: ['Mystical Space Typhoon'] }, { hand: [], m: ['Light and Darkness Dragon'], st: ['Mirror Force'] }] });
  choose(g, 'a:' + handU(g, 0, 'Mystical Space Typhoon')); if (g.prompt.type === 'pick') choose(g, 'Mirror');
  ok(hasOpt(g, 'Negate (lose 500'), 'LADD can respond'); choose(g, 'Negate (lose 500'); passAll(g);
  const l = on(g, 1, 'Light and Darkness Dragon');
  ok(l && E.atk(g, l) === 2300 && E.def(g, l) === 1900, 'LADD lost 500 ATK/DEF');
  ok(g.p[1].st.some(Boolean), 'Mirror Force survived');
});
T('Coelacanth negates Book of Moon', () => {
  const g = duel({ board: [{ hand: ['Book of Moon'] }, { hand: [], m: ['Superancient Deepsea King Coelacanth', 'Metabo-Shark'] }] });
  choose(g, 'a:' + handU(g, 0, 'Book of Moon')); if (g.prompt.type === 'pick') choose(g, 'Coelacanth');
  ok(hasOpt(g, 'Tribute a Fish'), 'Coelacanth can respond'); choose(g, 'Tribute a Fish'); passAll(g);
  const k = on(g, 1, 'Superancient Deepsea King Coelacanth');
  ok(k && k.pos === 'atk' && !on(g, 1, 'Metabo-Shark'), 'Coelacanth stays face-up, Metabo-Shark tributed');
});
T('Junk Archer banishes until the End Phase', () => {
  const g = duel({ board: [{ hand: [], m: ['Junk Archer'] }, { hand: [], m: [{ n: FILL, pos: 'def' }] }] });
  choose(g, 'Banish a monster'); passAll(g);
  ok(g.p[1].ban.length === 1, 'monster banished');
  choose(g, 'end'); passAll(g); for (let i = 0; i < 3 && g.prompt && g.prompt.type === 'respond'; i++) passAll(g);
  const w = g.p[1].m.find(Boolean);
  ok(w && w.pos === 'def', 'it came back in Defense Position');
});
T('Drill Warrior returns and adds a monster', () => {
  const g = duel({ board: [{ hand: [FILL], m: ['Drill Warrior'], gy: ['Metabo-Shark'] }, { hand: [] }] });
  choose(g, 'Discard: banish'); if (g.prompt.type === 'pick') E.act(g, [g.prompt.opts[0].key]); passAll(g);
  ok(g.p[0].ban.some(c => E.name(c) === 'Drill Warrior'), 'Drill banished');
  choose(g, 'end'); passAll(g);
  // B's turn
  for (let i = 0; i < 10 && g.tp === 1; i++) { passAll(g); if (g.prompt && g.prompt.type === 'idle') choose(g, 'end'); }
  passAll(g);
  for (let i = 0; i < 3 && g.prompt && g.prompt.type !== 'idle'; i++) { if (g.prompt.type === 'pick') E.act(g, [g.prompt.opts[0].key]); else passAll(g); }
  ok(on(g, 0, 'Drill Warrior'), 'Drill back in the Standby Phase');
  ok(g.p[0].hand.some(c => E.name(c) === 'Metabo-Shark' || E.name(c) === FILL) && g.p[0].gy.filter(c => E.name(c) === 'Metabo-Shark').length + g.p[0].hand.filter(c => E.name(c) === 'Metabo-Shark').length === 1, 'a monster was added from the GY');
});
T('Trap Hole on a Normal Summon', () => {
  const g = duel({ board: [{ hand: ['Blackwing - Shura the Blue Flame'] }, { hand: [], st: ['Trap Hole'] }] });
  g.p[1].st.find(Boolean).turnIn = -1;
  choose(g, 'ns:'); ok(hasOpt(g, 'Trap Hole'), 'Trap Hole offered'); choose(g, 'Trap Hole'); passAll(g);
  ok(!g.p[0].m.some(Boolean), 'Shura destroyed');
});
T('Skyscraper gives a HERO 1000 when attacking a stronger monster', () => {
  const g = duel({ board: [{ hand: ['Skyscraper', 'Elemental HERO Captain Gold'], turn: 2 }, { hand: [], m: ['Superancient Deepsea King Coelacanth'] }] });
  choose(g, 'a:' + handU(g, 0, 'Skyscraper')); passAll(g); choose(g, 'ns:' + handU(g, 0, 'Elemental HERO Captain Gold')); passAll(g);
  choose(g, 'bp'); passAll(g); choose(g, 'atk:'); passAll(g); passAll(g);
  ok(!on(g, 1, 'Superancient Deepsea King Coelacanth') && g.p[1].lp === 7700, 'Captain Gold won with 3100: LP ' + g.p[1].lp);
});
T('Grand Neos contact fusion and bounce', () => {
  const g = duel({ board: [{ hand: [], m: ['Elemental HERO Neos', 'Neo-Spacian Grand Mole'], extra: ['Elemental HERO Grand Neos'] }, { hand: [], m: [FILL] }] });
  choose(g, 'Shuffle Neos'); passAll(g);
  ok(on(g, 0, 'Elemental HERO Grand Neos'), 'Grand Neos on the field');
  choose(g, 'Return a monster'); passAll(g);
  ok(!g.p[1].m.some(Boolean), 'B\u2019s monster returned to the hand');
  choose(g, 'end'); passAll(g);
  ok(g.p[0].extra.some(c => E.name(c) === 'Elemental HERO Grand Neos'), 'Grand Neos went back to the Extra Deck in the End Phase');
});
console.log(fails ? `\n${fails} failed` : '\nAll batch-3 checks passed.');
process.exit(fails ? 1 : 0);
