// Scenario checks for js/cards/batch-2.js: node build/test_batch-2.js
const { E, C } = require('./load')();
const id = n => { const c = C.find(x => x.n === n); if (!c) throw new Error('no card ' + n); return c.id; };
const FILL = 'Gene-Warped Warwolf';
function duel(h0, h1, o = {}) {
  const mk = (h, deck) => ({ name: 't', main: [...h.map(id), ...(deck || []).map(id), ...Array(Math.max(0, 40 - h.length - (deck || []).length)).fill(id(FILL))], extra: [] });
  return E.newDuel({ decks: [mk(h0, o.deck0), mk(h1, o.deck1)], first: 0, seed: 1, noShuffle: true, names: ['A', 'B'], board: o.board });
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
const onF = (g, p, n) => g.p[p].m.find(c => c && E.name(c) === n);
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };
const idOfExtra = (g, p, n) => g.p[p].extra.find(c => E.name(c) === n).u;

T('Arcanite Magician: Synchro with a Spellcaster, 2 counters, destroy a card', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['X-Saber Airbellum', 'Lyla, Lightsworn Sorceress'], extra: ['Arcanite Magician'] }, { st: ['Mirror Force'] }] });
  choose(g, 'sp:' + idOfExtra(g, 0, 'Arcanite Magician')); passAll(g);
  const am = onF(g, 0, 'Arcanite Magician');
  ok(am && E.atk(g, am) === 2400, 'Arcanite on the field with 2400 ATK: ' + (am && E.atk(g, am)));
  choose(g, 'Remove a Spell Counter'); passAll(g);
  ok(!g.p[1].st.some(Boolean) && E.atk(g, am) === 1400, 'Mirror Force destroyed, Arcanite at 1400');
});
T('Arcanite Magician needs non-Tuner Spellcasters', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['X-Saber Airbellum', 'Garoth, Lightsworn Warrior'], extra: ['Arcanite Magician'] }, {}] });
  ok(!hasOpt(g, 'sp:'), 'no Synchro option with a Warrior');
});
T('Ancient Sacred Wyvern: LIGHT Tuner, ATK follows the LP gap', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], lp: 9000, m: ['Herald of Orange Light', 'Celestia, Lightsworn Angel'], extra: ['Ancient Sacred Wyvern'] }, { lp: 8000 }] });
  choose(g, 'sp:'); passAll(g);
  const w = onF(g, 0, 'Ancient Sacred Wyvern');
  ok(w && E.atk(g, w) === 3100, 'Wyvern at 3100 ATK with 1000 more LP: ' + (w && E.atk(g, w)));
});
T('Tytannial negates Mystical Space Typhoon', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: ['Mystical Space Typhoon'] }, { m: ['Tytannial, Princess of Camellias', 'Botanical Lion'], st: ['Mirror Force'] }] });
  choose(g, 'a:');
  ok(hasOpt(g, 'Tytannial'), 'Tytannial can respond'); choose(g, 'Tytannial'); choose(g, 'Botanical Lion'); passAll(g);
  ok(g.p[1].st.some(Boolean) && g.p[0].gy.some(c => E.name(c) === 'Mystical Space Typhoon'), 'MST negated, Mirror Force stays');
});
T('Herald of Orange Light negates a monster effect', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['Lyla, Lightsworn Sorceress'] }, { hand: ['Herald of Orange Light', 'Shining Angel'], st: ['Mirror Force'] }] });
  choose(g, 'Go to Defense');
  ok(hasOpt(g, 'Herald'), 'Herald offered'); choose(g, 'Herald'); passAll(g);
  ok(!onF(g, 0, 'Lyla, Lightsworn Sorceress') && g.p[1].st.some(Boolean), 'Lyla destroyed, Mirror Force stays');
});
T('Thunder King Rai-Oh: no searching, negates a Synchro Summon', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: ['Charge of the Light Brigade'], m: ['X-Saber Airbellum', 'Lyla, Lightsworn Sorceress'], extra: ['Arcanite Magician'] }, { m: ['Thunder King Rai-Oh'] }], deck0: ['Garoth, Lightsworn Warrior'] });
  const ch = g.p[0].hand[0].u; ok(!hasOpt(g, 'a:' + ch + ':'), 'Charge of the Light Brigade can\u2019t be activated');
  choose(g, 'sp:'); ok(hasOpt(g, 'Rai-Oh'), 'Rai-Oh offered in the summon window'); choose(g, 'Rai-Oh'); passAll(g);
  ok(!onF(g, 0, 'Arcanite Magician') && g.p[1].gy.some(c => E.name(c) === 'Thunder King Rai-Oh'), 'Synchro negated');
});
T('Necro Gardna negates an attack', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['Jain, Lightsworn Paladin'], turn: 2 }, { gy: ['Necro Gardna'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack directly');
  ok(hasOpt(g, 'Necro'), 'Necro Gardna offered'); choose(g, 'Necro'); passAll(g);
  ok(g.p[1].lp === 8000, 'no damage');
});
T('Magic Cylinder', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['Jain, Lightsworn Paladin'], turn: 2 }, { st: ['Magic Cylinder'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack directly'); choose(g, 'Magic Cylinder'); passAll(g);
  ok(g.p[1].lp === 8000 && g.p[0].lp === 6200, 'A took 1800, B took none: ' + g.p[0].lp + '/' + g.p[1].lp);
});
T('Skill Drain stops Botanical Lion and Jain', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['Botanical Lion'] }, { st: [{ n: 'Skill Drain', pos: 'up' }] }] });
  const bl = onF(g, 0, 'Botanical Lion');
  ok(E.atk(g, bl) === 1600, 'Lion at base 1600 under Skill Drain: ' + E.atk(g, bl));
});
T('Machina Gearframe equips and unequips', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: ['Machina Gearframe'], m: ['Scrap Recycler'] }, {}] });
  choose(g, 'ns:'); if (g.prompt.type === 'yesno') choose(g, 'no'); passAll(g);
  choose(g, 'Equip to a Machine'); passAll(g);
  const gf = g.p[0].st.find(c => c && E.name(c) === 'Machina Gearframe');
  ok(gf && gf.equipTo, 'Gearframe is equipped');
  ok(!hasOpt(g, 'Unequip'), 'not again this turn');
});
T('Archlord Kristya: summon with 4 Fairies, add one, blocks Special Summons', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: ['Archlord Kristya', 'Chaos Sorcerer'], gy: ['Shining Angel', 'Nova Summoner', 'Herald of Orange Light', 'Celestia, Lightsworn Angel', 'Necro Gardna'] }, {}] });
  choose(g, 'sp:'); passAll(g); choose(g, 'Shining Angel'); passAll(g);
  ok(onF(g, 0, 'Archlord Kristya') && g.p[0].hand.some(c => E.name(c) === 'Shining Angel'), 'Kristya out, Shining Angel added');
  ok(!hasOpt(g, 'sp:'), 'Chaos Sorcerer can’t be Special Summoned');
});
T('Garoth draws off Lyla’s End Phase mill', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['Lyla, Lightsworn Sorceress', 'Garoth, Lightsworn Warrior'], deckTop: [FILL, FILL, FILL, FILL, 'Jain, Lightsworn Paladin', 'Wulf, Lightsworn Beast'] }, {}] });
  const h0 = g.p[0].hand.length; choose(g, 'end'); passAll(g);
  for (let i = 0; i < 6 && g.prompt && g.prompt.p === 0 && g.prompt.type !== 'idle'; i++) { if (g.prompt.type === 'respond') passAll(g); else E.act(g, [g.prompt.opts[0].key]); }
  ok(g.p[0].hand.length === h0 + 2, 'Garoth drew 2 for Jain and Wulf: ' + (g.p[0].hand.length - h0));
  ok(!!onF(g, 0, 'Wulf, Lightsworn Beast'), 'Wulf Special Summoned itself');
});
T('Exploder Dragon: no damage while attacking, takes the killer', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['Exploder Dragon'], turn: 2 }, { m: ['Jain, Lightsworn Paladin'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack'); passAll(g);
  for (let i = 0; i < 4 && g.prompt && g.prompt.type === 'respond'; i++) passAll(g);
  ok(g.p[0].lp === 8000 && !onF(g, 1, 'Jain, Lightsworn Paladin'), 'no damage and Jain destroyed');
});
T('Dandylion makes 2 Fluff Tokens that can’t be Tributed that turn', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: ['Monster Reincarnation', 'Dandylion', 'Celestia, Lightsworn Angel'], gy: ['Lord Poison'] }, {}] });
  choose(g, 'a:'); choose(g, 'Dandylion'); passAll(g); choose(g, 'Lord Poison'); passAll(g);
  ok(g.p[0].m.filter(Boolean).length === 2, 'two tokens');
  ok(!hasOpt(g, 'Tribute Summon'), 'no Tribute Summon with the new tokens');
});
console.log(fails ? `\n${fails} failed` : '\nAll batch-2 checks passed.');
process.exit(fails ? 1 : 0);
