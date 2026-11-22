// Scenario checks for batch 7: node build/test_batch-7.js
const { E, C } = require('./load')();
const id = n => { const c = C.find(x => x.n === n); if (!c) throw new Error('no card ' + n); return c.id; };
const FILL = 'Gene-Warped Warwolf';
function duel(o = {}) {
  const mk = ex => ({ name: 't', main: Array(40).fill(id(FILL)), extra: (ex || []).map(id) });
  return E.newDuel({ decks: [mk(o.ex0), mk(o.ex1)], first: 0, seed: 1, noShuffle: true, names: ['A', 'B'], board: o.board });
}
let fails = 0;
function ok(cond, msg) { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; }
function choose(g, text, who) {
  const pr = g.prompt; if (!pr) throw new Error('no prompt for ' + text);
  if (who != null && pr.p !== who) throw new Error(`expected player ${who} prompt for "${text}", got ${pr.p}: ${pr.type} ${pr.text}`);
  const o = pr.opts.find(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
  if (!o) throw new Error(`no option "${text}" in ${pr.type} "${pr.text}": ${pr.opts.map(x => x.label + '[' + x.key + ']').join(', ')}`);
  E.act(g, [o.key]);
}
const hasOpt = (g, text) => g.prompt && g.prompt.opts.some(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
const passAll = (g, upto = 20) => { for (let i = 0; i < upto && g.prompt && g.prompt.type === 'respond'; i++) E.act(g, ['pass']); };
const yesAll = g => { for (let i = 0; i < 10 && g.prompt && g.prompt.type === 'yesno'; i++) choose(g, 'yes'); };
const act = (g, p, n) => choose(g, 'a:' + [...g.p[p].hand, ...g.p[p].st].find(c => c && E.name(c) === n).u + ':');
const on = (g, p, n) => g.p[p].m.find(c => c && E.name(c) === n);
const inZ = (g, p, z, n) => g.p[p][z].some(c => c && E.name(c) === n);
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };

T('Relinquished equips, survives battle, reflects damage', () => {
  const g = duel({ board: [{ hand: [], m: ['Relinquished'], turn: 2 }, { m: ['Cyber Dragon', 'Dark Armed Dragon'] }] });
  choose(g, 'Equip a monster'); choose(g, 'Cyber Dragon'); passAll(g);
  const r = on(g, 0, 'Relinquished');
  ok(r && E.atk(g, r) === 2100 && inZ(g, 0, 'st', 'Cyber Dragon'), 'Relinquished has 2100 ATK with Cyber Dragon equipped');
  choose(g, 'bp'); passAll(g); choose(g, 'Attack Dark Armed Dragon'); passAll(g); passAll(g); passAll(g);
  passAll(g);
  ok(on(g, 0, 'Relinquished') && inZ(g, 1, 'gy', 'Cyber Dragon'), 'Relinquished stays, Cyber Dragon destroyed instead');
  ok(g.p[0].lp === 7300 && g.p[1].lp === 7300, `both players took 700 (A ${g.p[0].lp}, B ${g.p[1].lp})`);
});
T('Fake Trap protects Traps from Heavy Storm', () => {
  const g = duel({ board: [{ hand: ['Heavy Storm'], turn: 2 }, { st: ['Fake Trap', 'Mirror Force'] }] });
  act(g, 0, 'Heavy Storm'); ok(hasOpt(g, 'Fake Trap'), 'Fake Trap offered'); choose(g, 'Fake Trap'); passAll(g);
  ok(inZ(g, 1, 'st', 'Mirror Force') && inZ(g, 1, 'gy', 'Fake Trap'), 'Mirror Force stays, Fake Trap destroyed');
});
T('Morphtronic Forcefield negates Mirror Force', () => {
  const g = duel({ board: [{ hand: [], m: ['Morphtronic Radion'], st: ['Morphtronic Forcefield'], deckTop: [FILL, 'Morphtronic Celfon'], turn: 2 }, { st: ['Mirror Force'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack directly');
  choose(g, 'Mirror Force', 1); ok(hasOpt(g, 'Forcefield'), 'Forcefield offered'); choose(g, 'Forcefield');
  passAll(g); for (let i = 0; i < 3 && g.prompt && g.prompt.type === 'pick'; i++) choose(g, 'Celfon');
  passAll(g);
  ok(inZ(g, 1, 'gy', 'Mirror Force') && inZ(g, 0, 'hand', 'Morphtronic Celfon'), 'Mirror Force destroyed, Celfon added');
});
T('Black Illusion Ritual with Djinn from the GY locks Special Summons', () => {
  const g = duel({ board: [{ hand: ['Black Illusion Ritual', 'Relinquished'], gy: ['Djinn Releaser of Rituals'] }, {}] });
  act(g, 0, 'Black Illusion Ritual'); passAll(g); choose(g, 'Djinn'); passAll(g);
  ok(on(g, 0, 'Relinquished') && inZ(g, 0, 'ban', 'Djinn Releaser of Rituals'), 'Relinquished summoned, Djinn banished');
  const wolf = g.p[1].deck[0];
  ok(E.lib.forbid(g, { type: 'ss', c: wolf, p: 1 }) && !E.lib.forbid(g, { type: 'ss', c: wolf, p: 0 }), 'B cannot Special Summon, A can');
});
T('Hyper Psychic Blaster: Psychic-only Synchro, pierces and gains LP', () => {
  const g = duel({ ex0: ['Hyper Psychic Blaster'], board: [{ hand: [], m: ['Psychic Commander', 'Overdrive Teleporter'], turn: 2 }, { m: [{ n: FILL, pos: 'set' }] }] });
  ok(hasOpt(g, 'Synchro Summon'), 'Synchro offered with Psychic materials'); choose(g, 'Synchro Summon'); passAll(g);
  choose(g, 'bp'); passAll(g); choose(g, 'Attack the face-down'); for (let i = 0; i < 10 && g.prompt && g.prompt.type === 'respond'; i++) E.act(g, ['pass']);
  ok(g.p[1].lp === 8000 - 2900 && g.p[0].lp === 8000 + 2900, `2900 piercing damage and 2900 LP gained (A ${g.p[0].lp}, B ${g.p[1].lp})`);
  const g2 = duel({ ex0: ['Hyper Psychic Blaster'], board: [{ hand: [], m: ['Psychic Commander', 'Dark Armed Dragon'], turn: 2 }, {}] });
  ok(!hasOpt(g2, 'Synchro Summon'), 'no Synchro with a non-Psychic non-Tuner');
});
T('Zanji destroys the monster it attacked even after losing', () => {
  const g = duel({ board: [{ hand: [], m: ['The Six Samurai - Zanji', 'The Six Samurai - Kamon'], turn: 2 }, { m: [FILL] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'atk:' + on(g, 0, 'The Six Samurai - Zanji').u); passAll(g); passAll(g); passAll(g);
  ok(inZ(g, 0, 'gy', 'The Six Samurai - Zanji') && inZ(g, 1, 'gy', FILL), 'both Zanji and the Warwolf are in the GY');
});
T('Gravity Bind stops Level 4 attackers', () => {
  const g = duel({ board: [{ hand: [], m: [FILL], turn: 2 }, { st: [{ n: 'Gravity Bind', pos: 'up' }] }] });
  choose(g, 'bp'); passAll(g);
  ok(!hasOpt(g, 'Attack'), 'no attack offered');
});
T('Witch of the Black Rose draws and destroys itself on a non-monster', () => {
  const g = duel({ board: [{ hand: ['Witch of the Black Rose'], deckTop: [FILL, 'Heavy Storm'] }, {}] });
  choose(g, 'ns:'); passAll(g); passAll(g);
  ok(inZ(g, 0, 'gy', 'Witch of the Black Rose') && inZ(g, 0, 'gy', 'Heavy Storm'), 'Witch and the drawn Heavy Storm are in the GY');
});
console.log(fails ? `\n${fails} failed` : '\nAll batch 7 checks passed.');
process.exit(fails ? 1 : 0);
