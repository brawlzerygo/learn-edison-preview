// Scenario checks for js/cards/batch-1.js: node build/test_batch-1.js
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
const hasOpt = (g, text) => !!g.prompt && g.prompt.opts.some(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
const handU = (g, p, n) => g.p[p].hand.find(c => E.name(c) === n).u;
const fieldU = (g, p, n) => E.fieldOf(g, p).find(c => E.name(c) === n).u;
const passAll = (g, upto = 30) => { for (let i = 0; i < upto && g.prompt && g.prompt.type === 'respond'; i++) E.act(g, ['pass']); };
const endTurn = g => { passAll(g); if (g.prompt && g.prompt.type === 'idle' && hasOpt(g, 'endbp')) choose(g, 'endbp'); passAll(g); choose(g, 'end'); passAll(g); while (g.prompt && g.prompt.type === 'pick' && /hand limit/.test(g.prompt.text)) { E.act(g, g.prompt.opts.slice(0, g.prompt.min).map(o => o.key)); passAll(g); } };
const inZone = (g, p, z, n) => (Array.isArray(g.p[p][z]) ? g.p[p][z] : [g.p[p][z]]).some(c => c && E.name(c) === n);
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };

T('Starlight Road negates Heavy Storm and summons Stardust', () => {
  const g = duel({ ex1: ['Stardust Dragon'], board: [{ hand: ['Heavy Storm'] }, { st: ['Starlight Road', 'Mirror Force'] }] });
  choose(g, 'a:' + handU(g, 0, 'Heavy Storm'));
  ok(hasOpt(g, 'Starlight Road'), 'Starlight Road is offered'); choose(g, 'Starlight Road'); passAll(g);
  ok(g.prompt && g.prompt.type === 'yesno', 'asks to summon Stardust'); choose(g, 'yes'); passAll(g);
  ok(inZone(g, 1, 'st', 'Mirror Force') && inZone(g, 1, 'm', 'Stardust Dragon') && inZone(g, 0, 'gy', 'Heavy Storm'), 'Storm negated, Mirror Force kept, Stardust summoned');
});
T('Starlight Road is not offered against a 1-card Storm', () => {
  const g = duel({ board: [{ hand: ['Heavy Storm'] }, { st: ['Starlight Road'] }] });
  choose(g, 'a:' + handU(g, 0, 'Heavy Storm'));
  ok(!hasOpt(g, 'Starlight Road'), 'not offered');
});
T('Pulling the Rug negates Armageddon Knight', () => {
  const g = duel({ board: [{ hand: ['Armageddon Knight'], deckTop: [FILL, 'Sangan'] }, { st: ['Pulling the Rug'] }] });
  choose(g, 'ns:' + handU(g, 0, 'Armageddon Knight')); passAll(g);
  if (g.prompt.type === 'yesno') choose(g, 'yes');
  ok(hasOpt(g, 'Pulling the Rug'), 'Pulling the Rug offered on the trigger'); choose(g, 'Pulling the Rug'); passAll(g);
  ok(inZone(g, 0, 'gy', 'Armageddon Knight') && !inZone(g, 0, 'gy', 'Sangan'), 'Knight destroyed, nothing sent');
});
T('Super Polymerization uses both fields and can\'t be chained to', () => {
  const g = duel({ ex0: ['Elemental HERO Mariner'], board: [{ hand: ['Super Polymerization', FILL], m: ['Elemental HERO Bubbleman'] }, { m: ['Elemental HERO Avian'], st: ['Dark Bribe'] }] });
  choose(g, 'a:' + handU(g, 0, 'Super Polymerization')); choose(g, FILL);
  ok(!(g.prompt.type === 'respond' && hasOpt(g, 'Dark Bribe')), 'Dark Bribe not offered'); passAll(g);
  ok(inZone(g, 0, 'm', 'Elemental HERO Mariner') && inZone(g, 1, 'gy', 'Elemental HERO Avian'), 'Mariner summoned with their Avian');
});
T('Revived King Ha Des negates Mystic Tomato', () => {
  const g = duel({ board: [{ hand: [], m: ['Revived King Ha Des'], turn: 2 }, { m: ['Mystic Tomato'], deckTop: ['Sangan'] }] });
  passAll(g); choose(g, 'bp'); passAll(g); choose(g, 'Attack Mystic Tomato'); passAll(g);
  ok(!(g.prompt && g.prompt.type === 'yesno'), 'no Mystic Tomato prompt');
  ok(inZone(g, 1, 'gy', 'Mystic Tomato') && !g.p[1].m.some(Boolean), 'Tomato destroyed, nothing summoned');
});
T('Mystic Tomato works without Ha Des', () => {
  const g = duel({ board: [{ hand: [], m: ['Dark Armed Dragon'], turn: 2 }, { m: ['Mystic Tomato'], deckTop: ['Sangan'] }] });
  passAll(g); choose(g, 'bp'); passAll(g); choose(g, 'Attack Mystic Tomato'); passAll(g);
  ok(g.prompt && g.prompt.type === 'yesno', 'Mystic Tomato asks'); choose(g, 'yes'); passAll(g);
  ok(inZone(g, 1, 'm', 'Sangan'), 'Sangan summoned');
});
T('Royal Decree stops Mirror Force', () => {
  const g = duel({ board: [{ hand: [], m: [FILL], turn: 2 }, { st: [{ n: 'Royal Decree', pos: 'up' }, 'Mirror Force'] }] });
  passAll(g); choose(g, 'bp'); passAll(g); choose(g, 'Attack directly');
  ok(!hasOpt(g, 'Mirror Force'), 'Mirror Force not offered'); passAll(g);
  ok(g.p[1].lp === 6000, 'direct damage went through');
});
T('Prime Material Dragon turns effect damage into a gain', () => {
  const g = duel({ board: [{ hand: [], m: ['Tempest Magician'] }, { m: ['Prime Material Dragon'] }] });
  choose(g, 'Discard for Spell Counters'); choose(g, '1'); passAll(g);
  ok(E.lib.ctr(g.p[0].m[0], 'spell') === 1, 'Tempest got a Spell Counter');
  choose(g, 'Remove all Spell Counters'); passAll(g);
  ok(g.p[1].lp === 8500, 'B gained 500 instead of taking it');
});
T('Exploder Dragonwing destroys and burns', () => {
  const g = duel({ board: [{ hand: [], m: ['Exploder Dragonwing'], turn: 2 }, { m: [FILL] }] });
  passAll(g); choose(g, 'bp'); passAll(g); choose(g, 'Attack Gene-Warped'); passAll(g);
  ok(g.prompt && g.prompt.type === 'yesno', 'Exploder asks'); choose(g, 'yes'); passAll(g);
  ok(g.p[1].lp === 6000 && !g.p[1].m.some(Boolean) && g.p[0].lp === 8000, 'monster destroyed, 2000 effect damage');
});
T('Debris Dragon material limits', () => {
  const g = duel({ ex0: ['Stardust Dragon', 'Black Rose Dragon'], board: [{ hand: [], m: ['Debris Dragon', FILL] }, {}] });
  ok(!hasOpt(g, 'syn:'), 'no Stardust with a Level 4 beside Debris');
  const h = duel({ ex0: ['Black Rose Dragon'], board: [{ hand: [], m: ['Debris Dragon', 'Sangan'] }, {}] });
  ok(hasOpt(h, 'syn:'), 'Black Rose with Debris + Level 3 is offered');
});
T('Deck Devastation Virus hits the field, the hand and draws', () => {
  const g = duel({ board: [{ hand: [], m: ['Dark Armed Dragon'], st: ['Deck Devastation Virus'] }, { hand: ['Mystic Tomato', 'Heavy Storm'], m: [FILL, 'Mezuki', 'Deep Sea Diva'], deckTop: ['Sangan'] }] });
  choose(g, 'a:' + fieldU(g, 0, 'Deck Devastation Virus')); passAll(g);
  ok(inZone(g, 1, 'gy', 'Deep Sea Diva') && inZone(g, 1, 'gy', 'Mezuki') === false && inZone(g, 1, 'm', 'Mezuki') && inZone(g, 1, 'm', FILL) && inZone(g, 1, 'gy', 'Mystic Tomato') && inZone(g, 1, 'hand', 'Heavy Storm'), 'Diva and Tomato destroyed; Mezuki (1700) and Warwolf and Storm kept');
  endTurn(g);
  ok(inZone(g, 1, 'gy', 'Sangan'), 'the drawn Sangan was destroyed');
});
T('Future Fusion sends materials, then summons 2 Standby Phases later', () => {
  const g = duel({ ex0: ['Darkfire Dragon'], board: [{ hand: ['Future Fusion'], deckTop: [FILL, 'Firegrass', 'Petit Dragon'] }, {}] });
  choose(g, 'a:' + handU(g, 0, 'Future Fusion')); passAll(g);
  ok(inZone(g, 0, 'gy', 'Firegrass') && inZone(g, 0, 'gy', 'Petit Dragon'), 'materials sent');
  for (let i = 0; i < 4; i++) endTurn(g);
  passAll(g);
  ok(inZone(g, 0, 'm', 'Darkfire Dragon'), 'Darkfire Dragon summoned on the 2nd Standby Phase');
});
T('Mask of Restrict stops Tribute Summons', () => {
  const g = duel({ board: [{ hand: ["Vanity's Fiend"], m: [FILL, FILL], st: [{ n: 'Mask of Restrict', pos: 'up' }] }, {}] });
  ok(!hasOpt(g, 'ns:' + handU(g, 0, "Vanity's Fiend")), 'no Tribute Summon');
});
T('Return from the Different Dimension banishes them again', () => {
  const g = duel({ board: [{ hand: [], ban: ['Sangan', 'Mezuki'], st: ['Return from the Different Dimension'] }, {}] });
  choose(g, 'a:' + fieldU(g, 0, 'Return from the Different Dimension')); passAll(g);
  ok(g.p[0].m.filter(Boolean).length === 2 && g.p[0].lp === 4000, 'both summoned, half LP paid');
  endTurn(g);
  ok(g.p[0].ban.length === 2 && !g.p[0].m.some(Boolean), 'banished in the End Phase');
});
T('Trident Dragion: Synchro Summon, destroy a card, extra attack', () => {
  const g = duel({ ex0: ['Trident Dragion'], board: [{ hand: [], m: ['Debris Dragon', 'Prime Material Dragon'], st: ['Mirror Force'] }, {}] });
  choose(g, 'syn:'); choose(g, 'Attack Position'); passAll(g);
  ok(g.prompt && g.prompt.type === 'yesno', 'Trident asks'); choose(g, 'yes');
  const t = g.p[0].m.find(c => c && E.name(c) === 'Trident Dragion');
  ok(t && t.flags.extraAttack === g.turnNo && E.lib.allCards(g, 'gy').some(c => E.name(c) === 'Mirror Force'), 'Mirror Force destroyed, Trident gets an extra attack');
});
T('Trident Dragion can\'t be revived by Call of the Haunted', () => {
  const g = duel({ board: [{ hand: [], gy: ['Trident Dragion'], st: ['Call of the Haunted'] }, {}] });
  choose(g, 'a:'); passAll(g);
  ok(!g.p[0].m.some(Boolean), 'not summoned');
});
console.log(fails ? `\n${fails} check(s) failed.` : '\nAll batch-1 checks passed.');
process.exit(fails ? 1 : 0);
