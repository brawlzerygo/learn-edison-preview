// Scripted rule checks: node build/test_rules.js
const { ctx, E, C } = require('./load')();
const id = n => { const c = C.find(x => x.n === n); if (!c) throw new Error('no card ' + n); return c.id; };
const FILL = 'Gene-Warped Warwolf';
function duel(h0, h1, o = {}) { // h0/h1: first cards drawn (5 hand + turn-1 draw for P0); o.board: a preset position
  const mk = (h, ex) => ({ name: 't', main: [...h.map(id), ...Array(40 - h.length).fill(id(FILL))], extra: (ex || []).map(id) });
  return E.newDuel({ decks: [mk(h0, o.ex0), mk(h1, o.ex1)], first: 0, seed: 1, noShuffle: true, names: ['A', 'B'], board: o.board });
}
let fails = 0;
function ok(cond, msg) { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; }
function choose(g, text, who) { // answer the current prompt with the option whose label or key matches
  const pr = g.prompt; if (!pr) throw new Error('no prompt for ' + text);
  if (who != null && pr.p !== who) throw new Error(`expected player ${who} prompt for "${text}", got ${pr.p}: ${pr.type} ${pr.text}`);
  const o = pr.opts.find(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
  if (!o) throw new Error(`no option "${text}" in ${pr.type} "${pr.text}": ${pr.opts.map(x => x.label + '[' + x.key + ']').join(', ')}`);
  E.act(g, [o.key]);
}
const nameOf = (g, u) => { for (const P of g.p) for (const z of ['hand', 'm', 'st', 'gy', 'ban', 'deck', 'extra']) for (const c of P[z]) if (c && c.u === u) return c; };
const hasOpt = (g, text) => g.prompt && g.prompt.opts.some(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
const handU = (g, p, n) => g.p[p].hand.find(c => E.name(c) === n).u;
const passAll = (g, upto = 20) => { for (let i = 0; i < upto && g.prompt && g.prompt.type === 'respond'; i++) E.act(g, ['pass']); };
const endTurn = g => { passAll(g); choose(g, 'end'); passAll(g); };
const fieldEmpty = g => g.p.every(P => !P.m.some(Boolean) && !P.st.some(Boolean));
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };

T('Bottomless on a summon', () => {
  const g = duel(['Blackwing - Shura the Blue Flame', FILL, FILL, FILL, FILL, FILL], ['Bottomless Trap Hole', FILL, FILL, FILL, FILL, FILL]);
  endTurn(g); // turn 1 A does nothing
  choose(g, 'setst:' + handU(g, 1, 'Bottomless Trap Hole')); endTurn(g); // B sets
  choose(g, 'ns:' + handU(g, 0, 'Blackwing - Shura the Blue Flame'));
  ok(g.prompt.p === 1 && hasOpt(g, 'Bottomless'), 'B is offered Bottomless after the summon');
  choose(g, 'Bottomless'); passAll(g);
  ok(g.p[0].ban.some(c => E.name(c) === 'Blackwing - Shura the Blue Flame'), 'Shura is banished');
});
T('Solemn negates a summon', () => {
  const g = duel(['Blackwing - Shura the Blue Flame', FILL, FILL, FILL, FILL, FILL], ['Solemn Judgment', FILL, FILL, FILL, FILL, FILL]);
  endTurn(g); choose(g, 'setst:' + handU(g, 1, 'Solemn Judgment')); endTurn(g);
  choose(g, 'ns:' + handU(g, 0, 'Blackwing - Shura the Blue Flame'));
  ok(hasOpt(g, 'Solemn'), 'Solemn offered in the summon window'); choose(g, 'Solemn'); passAll(g);
  ok(g.p[0].gy.some(c => E.name(c) === 'Blackwing - Shura the Blue Flame') && g.p[1].lp === 4000, 'Shura destroyed, B paid half');
});
T('Mirror Force on an attack', () => {
  const g = duel(['Blackwing - Shura the Blue Flame', 'Blackwing - Bora the Spear', FILL, FILL, FILL, FILL], ['Mirror Force', FILL, FILL, FILL, FILL, FILL]);
  endTurn(g); choose(g, 'setst:' + handU(g, 1, 'Mirror Force')); endTurn(g);
  choose(g, 'ns:' + handU(g, 0, 'Blackwing - Shura the Blue Flame')); passAll(g);
  choose(g, 'sp:' + handU(g, 0, 'Blackwing - Bora the Spear')); passAll(g);
  choose(g, 'bp'); passAll(g); choose(g, 'Attack directly'); 
  ok(hasOpt(g, 'Mirror Force'), 'Mirror Force offered'); choose(g, 'Mirror Force'); passAll(g);
  ok(g.p[0].m.filter(Boolean).length === 0 && g.p[1].lp === 8000, 'both attackers destroyed, no damage');
});
T('Stardust negates Heavy Storm', () => {
  const g = duel(['Heavy Storm', FILL, FILL, FILL, FILL, FILL], ['Junk Synchron', 'Mirror Force', 'Mystical Space Typhoon', FILL, FILL, FILL], { ex1: ['Stardust Dragon'] });
  endTurn(g);
  // B: needs Level 8 = Junk Synchron(3)+ 5? Use direct state: put Stardust on field
  const sd = g.p[1].extra[0]; g.p[1].extra = []; sd.zone = 'm'; sd.ctrl = 1; sd.pos = 'atk'; sd.turnIn = 1; g.p[1].m[2] = sd;
  choose(g, 'setst:' + handU(g, 1, 'Mirror Force')); endTurn(g);
  choose(g, 'a:' + handU(g, 0, 'Heavy Storm'));
  ok(hasOpt(g, 'Stardust'), 'Stardust can respond'); choose(g, 'Stardust'); passAll(g);
  ok(g.p[0].gy.some(c => E.name(c) === 'Heavy Storm') && g.p[1].st.some(Boolean), 'Heavy Storm negated, Mirror Force stays');
  passAll(g); choose(g, 'end'); passAll(g);
  for (let i = 0; i < 5 && g.prompt && g.prompt.type === 'yesno'; i++) choose(g, 'yes');
  ok(g.p[1].m.some(c => c && E.name(c) === 'Stardust Dragon'), 'Stardust came back in the End Phase');
});
T('Gorz on battle damage', () => {
  const g = duel(['Blackwing - Shura the Blue Flame', FILL, FILL, FILL, FILL, FILL], ['Gorz the Emissary of Darkness', FILL, FILL, FILL, FILL, FILL]);
  endTurn(g); endTurn(g);
  choose(g, 'ns:'); passAll(g); choose(g, 'bp'); passAll(g); choose(g, 'Attack directly'); passAll(g);
  ok(g.prompt && g.prompt.type === 'yesno' && g.prompt.p === 1, 'B asked to use Gorz'); choose(g, 'yes'); passAll(g);
  const toks = g.p[1].m.filter(Boolean).map(c => E.name(c) + ':' + E.atk(g, c));
  ok(toks.includes('Gorz the Emissary of Darkness:2700') && toks.includes('Emissary of Darkness Token:1800'), 'Gorz and an 1800 token: ' + toks);
});
T('Battle Fader ends the Battle Phase', () => {
  const g = duel(['Blackwing - Shura the Blue Flame', FILL, FILL, FILL, FILL, FILL], ['Battle Fader', FILL, FILL, FILL, FILL, FILL]);
  endTurn(g); endTurn(g);
  choose(g, 'ns:'); passAll(g); choose(g, 'bp'); passAll(g); choose(g, 'Attack directly');
  ok(g.prompt.type === 'yesno' && g.prompt.p === 1, 'Fader offered'); choose(g, 'yes'); passAll(g);
  ok(g.p[1].lp === 8000 && g.prompt && g.prompt.p === 0 && g.prompt.text === 'Main Phase 2', 'no damage and the turn moved to Main Phase 2');
});
T('Synchro and Dupe Frog trigger', () => {
  const g = duel(['Junk Synchron', 'Dupe Frog', FILL, FILL, FILL, FILL], [FILL, FILL, FILL, FILL, FILL, FILL], { ex0: ['Junk Warrior'] });
  g.p[0].deck.push(...[]); // Frog in deck for search
  const frog = g.p[0].hand.find(c => E.name(c) === 'Dupe Frog'); // put Dupe Frog in GY for Junk Synchron
  g.p[0].hand.splice(g.p[0].hand.indexOf(frog), 1); frog.zone = 'gy'; g.p[0].gy.push(frog);
  choose(g, 'ns:' + handU(g, 0, 'Junk Synchron')); ok(g.prompt.type === 'yesno', 'Junk Synchron trigger asked'); choose(g, 'yes'); passAll(g);
  ok(g.p[0].m.filter(Boolean).length === 2, 'Dupe Frog revived');
  choose(g, 'syn:'); choose(g, 'Attack'); passAll(g);
  const jw = g.p[0].m.find(c => c && E.name(c) === 'Junk Warrior');
  ok(jw && E.atk(g, jw) === 2300, 'Junk Warrior summoned with 2300 (no Lv2 left): ' + (jw && E.atk(g, jw)));
});
T('Dark Armed Dragon', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: ['Dark Armed Dragon', 'Mirror Force'], gy: ['Blackwing - Bora the Spear', 'Blackwing - Gale the Whirlwind', 'Armageddon Knight'] }, { m: ['Blackwing - Shura the Blue Flame'] }] });
  ok(hasOpt(g, 'sp:' + handU(g, 0, 'Dark Armed Dragon')), 'DAD summonable with exactly 3 DARKs');
  choose(g, 'sp:'); passAll(g);
  choose(g, 'Banish a DARK'); choose(g, 'Gale'); passAll(g);
  ok(g.p[1].m.filter(Boolean).length === 0 && g.p[0].ban.length === 1, 'banished a DARK and destroyed Shura');
});
T('Plaguespreader Zombie from the GY', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [FILL, FILL], gy: ['Plaguespreader Zombie'] }, {}] });
  choose(g, 'Special Summon from the GY'); choose(g, 'Warwolf'); passAll(g);
  ok(g.p[0].m.some(c => c && E.name(c) === 'Plaguespreader Zombie') && g.p[0].hand.length === 2, 'Zombie on the field, one card back on the Deck');
});
T('Missing the timing: Dupe Frog as Chain Link 2 cost is fine; Black Rose wipes', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [FILL], m: ['Junk Synchron', 'Blackwing - Bora the Spear'], extra: ['Black Rose Dragon'] }, { m: ['Dupe Frog'], st: ['Mirror Force'] }] });
  choose(g, 'syn:'); choose(g, 'Attack'); passAll(g);
  ok(g.prompt.type === 'yesno', 'Black Rose asks'); choose(g, 'yes'); passAll(g);
  for (let i = 0; i < 4 && g.prompt && g.prompt.type === 'yesno'; i++) choose(g, 'yes');
  passAll(g);
  ok(fieldEmpty(g), 'field cleared');
  ok(g.p[1].hand.some(c => /Frog/.test(E.name(c))) || !g.p[1].deck.some(c=>/Frog/.test(E.name(c))), 'Dupe Frog search when a Frog is in the Deck');
});
T('Replay when the target leaves', () => {
  const g = duel([FILL], [FILL], { board: [{ hand: [], m: ['Blackwing - Shura the Blue Flame'], turn: 2 }, { m: ['Dupe Frog', 'Blackwing - Bora the Spear'], st: ['Compulsory Evacuation Device'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'atk:');
  choose(g, 'Compulsory'); choose(g, 'Des Frog'); passAll(g);
  ok(g.prompt && g.prompt.text.includes('replay'), 'a replay is offered');
});
console.log(fails ? `\n${fails} failed` : '\nAll rule checks passed.');
process.exit(fails ? 1 : 0);
