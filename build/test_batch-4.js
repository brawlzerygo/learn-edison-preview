// Scenario checks for js/cards/batch-4.js: node build/test_batch-4.js
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
const endTurn = g => { passAll(g); choose(g, 'end'); passAll(g); };
const on = (g, p, n) => g.p[p].m.find(c => c && E.name(c) === n);
const inZ = (g, p, z, n) => g.p[p][z].some(c => c && E.name(c) === n);
const uOf = (g, p, n) => { for (const z of ['hand', 'm', 'st', 'gy']) for (const c of g.p[p][z]) if (c && E.name(c) === n) return c.u; throw new Error('no ' + n); };
const act = (g, p, n, ei = 0) => choose(g, `a:${uOf(g, p, n)}:${ei}`);
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };

T('Krebons negates an attack', () => {
  const g = duel({ board: [{ m: [FILL], turn: 2 }, { m: ['Krebons'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack Krebons');
  choose(g, 'yes', 1); passAll(g);
  ok(g.p[1].lp === 7200 && on(g, 1, 'Krebons'), 'B paid 800 and Krebons survives');
});
T('Scrap-Iron Scarecrow negates and Sets itself again', () => {
  const g = duel({ board: [{ m: [FILL], turn: 2 }, { st: ['Scrap-Iron Scarecrow'] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack directly');
  choose(g, 'Scrap-Iron', 1); passAll(g);
  const s = g.p[1].st.find(Boolean);
  ok(g.p[1].lp === 8000 && s && s.pos === 'set', 'no damage, Scarecrow Set again');
});
T('Cyber Valley ends the Battle Phase', () => {
  const g = duel({ board: [{ m: [FILL, FILL], turn: 2 }, { m: ['Cyber Valley'] }] });
  const h = g.p[1].hand.length;
  choose(g, 'bp'); passAll(g); choose(g, 'Attack Cyber Valley');
  choose(g, 'yes', 1); passAll(g);
  ok(inZ(g, 1, 'ban', 'Cyber Valley') && g.p[1].hand.length === h + 1, 'banished and drew 1');
  ok(g.phase === 'main2', 'the Battle Phase ended');
});
T('Doomcaliber Knight negates a monster effect', () => {
  const g = duel({ board: [{ m: ['Card Trooper'] }, { m: ['Doomcaliber Knight'] }] });
  const deck = g.p[0].deck.length;
  choose(g, 'Send 1-3'); choose(g, '1');
  choose(g, 'Doomcaliber', 1); passAll(g);
  ok(inZ(g, 0, 'gy', 'Card Trooper') && inZ(g, 1, 'gy', 'Doomcaliber Knight') && g.p[0].deck.length === deck - 1, 'Card Trooper negated and destroyed, nothing sent (it draws 1 for being destroyed)');
});
T('Gemini Soldier survives and summons a Gemini', () => {
  const g = duel({ board: [{ m: ['Gemini Soldier'], deckTop: [FILL, 'Dark Valkyria'], turn: 2 }, { m: [FILL] }] });
  on(g, 0, 'Gemini Soldier').flags.gemini = true;
  choose(g, 'bp'); passAll(g); choose(g, 'Attack Gene-Warped');
  passAll(g); choose(g, 'yes', 0); passAll(g);
  ok(on(g, 0, 'Gemini Soldier') && on(g, 0, 'Dark Valkyria') && g.p[0].lp === 6500, 'Soldier stays, Valkyria summoned, A took 1500');
});
T('Black Brutdrago Synchro Summon (Gemini non-Tuner)', () => {
  const g = duel({ ex0: ['Black Brutdrago'], board: [{ m: ['Nettles', 'Gigaplant'] }, {}] });
  ok(!hasOpt(g, 'syn:'), 'no plain Synchro option'); choose(g, 'Synchro Summon'); passAll(g);
  ok(on(g, 0, 'Black Brutdrago') && inZ(g, 0, 'gy', 'Nettles') && inZ(g, 0, 'gy', 'Gigaplant'), 'Brutdrago summoned');
});
T('Drillroid destroys a Defense Position monster before damage', () => {
  const g = duel({ board: [{ m: ['Drillroid'], turn: 2 }, { m: [{ n: 'Krebons', pos: 'set' }] }] });
  choose(g, 'bp'); passAll(g); choose(g, 'Attack the face-down'); passAll(g);
  ok(inZ(g, 1, 'gy', 'Krebons') && g.p[0].lp === 8000 && on(g, 0, 'Drillroid'), 'face-down monster destroyed, no damage');
});
T('Legendary Jujitsu Master puts the attacker on the Deck', () => {
  const g = duel({ board: [{ m: [FILL], turn: 2 }, { m: [{ n: 'Legendary Jujitsu Master', pos: 'def' }] }] });
  const deck = g.p[0].deck.length;
  choose(g, 'bp'); passAll(g); choose(g, 'Attack Legendary'); passAll(g);
  ok(!on(g, 0, FILL) && g.p[0].deck.length === deck + 1, 'attacker on top of the Deck');
});
T('Supervise: Gemini gains effects, then revives a Normal Monster', () => {
  const g = duel({ board: [{ hand: ['Supervise', 'Mystical Space Typhoon'], m: ['Dark Valkyria'], gy: ['Gemini Soldier'] }, {}] });
  act(g, 0, 'Supervise'); passAll(g);
  const v = on(g, 0, 'Dark Valkyria');
  ok(v.flags.gemini === true && hasOpt(g, 'Place a Spell Counter'), 'Valkyria is an Effect Monster');
  act(g, 0, 'Mystical Space Typhoon'); passAll(g);
  passAll(g);
  ok(!v.flags.gemini && on(g, 0, 'Gemini Soldier'), 'Valkyria normal again, Gemini Soldier revived');
});
T('Eradicator Epidemic Virus: hand, field and draws', () => {
  const g = duel({ board: [{ m: ['Dark Horus'], st: ['Eradicator Epidemic Virus'] }, { hand: ['Heavy Storm', FILL], st: ['Mystical Space Typhoon'], deckTop: ['Pot of Avarice'] }] });
  act(g, 0, 'Eradicator Epidemic Virus'); choose(g, 'Spell'); passAll(g);
  ok(inZ(g, 1, 'gy', 'Heavy Storm') && inZ(g, 1, 'gy', 'Mystical Space Typhoon'), 'Spells in hand and on the field destroyed');
  endTurn(g); passAll(g);
  ok(inZ(g, 1, 'gy', 'Pot of Avarice'), 'the drawn Spell is destroyed');
});
T('Planet Pollutant Virus', () => {
  const g = duel({ board: [{ m: ['Alien Warrior'], st: ['Planet Pollutant Virus'] }, { hand: [FILL], m: [FILL] }] });
  act(g, 0, 'Planet Pollutant Virus'); passAll(g);
  ok(g.p[1].m.filter(Boolean).length === 0 && inZ(g, 0, 'gy', 'Alien Warrior'), 'their monster destroyed, Alien Tributed');
  endTurn(g); choose(g, 'ns:'); passAll(g);
  const m = g.p[1].m.find(Boolean);
  ok(m && m.ctr && m.ctr.A === 1, 'their new monster got an A-Counter');
});
T('Fiendish Chain', () => {
  const g = duel({ board: [{ m: ['Card Trooper'], turn: 2 }, { st: ['Fiendish Chain'] }] });
  passAll(g);
  const ct = on(g, 0, 'Card Trooper');
  // B activates Fiendish Chain at the start of the Battle Phase
  choose(g, 'bp'); choose(g, 'Fiendish', 1); passAll(g); passAll(g);
  ok(ct.flags.negated && !hasOpt(g, 'atk:'), 'Card Trooper negated and can’t attack');
});
T('Necrovalley negates a GY-targeting effect but not Rite of Spirit', () => {
  const g = duel({ board: [{ hand: ['Necrovalley'], st: ['Rite of Spirit'], gy: ["Gravekeeper's Commandant"] }, {}] });
  act(g, 0, 'Necrovalley'); passAll(g);
  endTurn(g);
  passAll(g); choose(g, 'end'); // B's turn
  if (g.prompt && g.prompt.type === 'respond' && hasOpt(g, 'Rite')) { choose(g, 'Rite', 0); passAll(g); }
  else { passAll(g); }
  const gk = on(g, 0, "Gravekeeper's Commandant");
  ok(gk && E.atk(g, gk) === 2100, 'Rite of Spirit works under Necrovalley and the Gravekeeper gets +500');
});
console.log(fails ? `\n${fails} failed` : '\nAll batch-4 checks passed.');
process.exit(fails ? 1 : 0);
