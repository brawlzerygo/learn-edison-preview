// Scenario checks for js/cards/batch-6.js: node build/test_batch-6.js
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
  if (who != null && pr.p !== who) throw new Error(`expected player ${who} prompt for "${text}", got ${pr.p}: ${pr.type} ${pr.text}`);
  const o = pr.opts.find(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
  if (!o) throw new Error(`no option "${text}" in ${pr.type} "${pr.text}": ${pr.opts.map(x => x.label + '[' + x.key + ']').join(', ')}`);
  E.act(g, [o.key]);
}
const hasOpt = (g, text) => g.prompt && g.prompt.opts.some(x => (x.label + ' ' + x.key).toLowerCase().includes(text.toLowerCase()));
const card = (g, p, zone, n) => (zone === 'fz' ? [g.p[p].fz] : g.p[p][zone]).find(c => c && E.name(c) === n);
const pickCard = (g, p, zone, n) => { if (g.prompt && g.prompt.type === 'pick') E.act(g, ['u' + card(g, p, zone, n).u]); };
const passAll = (g, upto = 30) => { for (let i = 0; i < upto && g.prompt && g.prompt.type === 'respond'; i++) E.act(g, ['pass']); };
const T = (name, f) => { try { f(); } catch (e) { fails++; console.log('FAIL ' + name + ': ' + e.message); } };
const inZone = (g, p, zone, n) => !!card(g, p, zone, n);
const act = (g, p, zone, n, ei = 0) => choose(g, `a:${card(g, p, zone, n).u}:${ei}`);

T('Dark Calling: Dark Gaia from the GY, ATK = materials', () => {
  const g = duel({ board: [{ hand: ['Dark Calling'], gy: ['Evil HERO Malicious Edge', 'Big Piece Golem'], extra: ['Evil HERO Dark Gaia'] }, {}] });
  act(g, 0, 'hand', 'Dark Calling'); passAll(g);
  const dg = card(g, 0, 'm', 'Evil HERO Dark Gaia');
  ok(!!dg && E.atk(g, dg) === 4700, 'Dark Gaia summoned with 4700 ATK');
  ok(g.p[0].ban.length === 2, 'both materials banished');
});

T('Earthbound Immortal: no Field Spell destroys it, without its leave effect', () => {
  const g = duel({ board: [{ hand: ['Earthbound Immortal Aslla piscu', 'Necrovalley', 'Mystical Space Typhoon'], m: [FILL, FILL] }, { m: [FILL, FILL] }] });
  act(g, 0, 'hand', 'Necrovalley'); passAll(g);
  choose(g, 'ns:' + card(g, 0, 'hand', 'Earthbound Immortal Aslla piscu').u); if (g.prompt && g.prompt.type === 'pick') E.act(g, g.prompt.opts.slice(0, 2).map(o => o.key)); passAll(g);
  ok(inZone(g, 0, 'm', 'Earthbound Immortal Aslla piscu'), 'Aslla piscu stays with a Field Spell');
  act(g, 0, 'hand', 'Mystical Space Typhoon'); pickCard(g, 0, 'fz', 'Necrovalley'); passAll(g);
  ok(inZone(g, 0, 'gy', 'Earthbound Immortal Aslla piscu'), 'Aslla piscu destroyed once the Field Spell is gone');
  ok(g.p[1].m.filter(Boolean).length === 2 && g.p[1].lp === 8000, 'its leave effect did not apply');
});

T('Aslla piscu leaving the field destroys their face-up monsters', () => {
  const g = duel({ board: [{ hand: ['Earthbound Immortal Aslla piscu', 'Necrovalley', FILL], m: [FILL, FILL], st: ['Raigeki Break'] }, { m: [FILL, FILL] }] });
  act(g, 0, 'hand', 'Necrovalley'); passAll(g);
  choose(g, 'ns:' + card(g, 0, 'hand', 'Earthbound Immortal Aslla piscu').u); if (g.prompt && g.prompt.type === 'pick') E.act(g, g.prompt.opts.slice(0, 2).map(o => o.key)); passAll(g);
  act(g, 0, 'st', 'Raigeki Break'); E.act(g, [g.prompt.opts[0].key]); pickCard(g, 0, 'm', 'Earthbound Immortal Aslla piscu'); passAll(g);
  ok(g.p[1].m.filter(Boolean).length === 0, 'their 2 monsters destroyed');
  ok(g.p[1].lp === 8000 - 1600, '1600 damage');
});

T('Ccarayhua destroyed by an effect destroys all cards', () => {
  const g = duel({ board: [{ hand: ['Earthbound Immortal Ccarayhua', 'Necrovalley', FILL], m: [FILL, FILL], st: ['Raigeki Break'] }, { m: [FILL, FILL] }] });
  act(g, 0, 'hand', 'Necrovalley'); passAll(g);
  choose(g, 'ns:' + card(g, 0, 'hand', 'Earthbound Immortal Ccarayhua').u); if (g.prompt && g.prompt.type === 'pick') E.act(g, g.prompt.opts.slice(0, 2).map(o => o.key)); passAll(g);
  act(g, 0, 'st', 'Raigeki Break'); E.act(g, [g.prompt.opts[0].key]); pickCard(g, 0, 'm', 'Earthbound Immortal Ccarayhua'); passAll(g);
  ok(g.p[1].m.filter(Boolean).length === 0 && !g.p[0].fz, 'every card on the field destroyed');
});

T('Double Coston counts as 2 Tributes for a DARK', () => {
  const g = duel({ board: [{ hand: ['Dark Magician'], m: ['Double Coston'] }, {}] });
  act(g, 0, 'm', 'Double Coston'); passAll(g);
  ok(inZone(g, 0, 'm', 'Dark Magician') && inZone(g, 0, 'gy', 'Double Coston'), 'Dark Magician Tribute Summoned with Coston alone');
  ok(!hasOpt(g, 'ns:'), 'that used the Normal Summon');
});

T("Koa'ki Meiru maintenance", () => {
  const g = duel({ board: [{ hand: [FILL], m: ["Koa'ki Meiru Guardian", "Koa'ki Meiru Crusader"] }, {}] });
  choose(g, 'end'); passAll(g);
  if (g.prompt && g.prompt.type === 'choose') choose(g, 'Reveal');
  if (g.prompt && g.prompt.type === 'pick') E.act(g, [g.prompt.opts[0].key]);
  passAll(g);
  ok(inZone(g, 0, 'gy', "Koa'ki Meiru Guardian"), 'Guardian destroyed (no Iron Core or Rock)');
  ok(inZone(g, 0, 'm', "Koa'ki Meiru Crusader"), 'Crusader kept by revealing a Beast-Warrior');
});

T('Underground Arachnid: equip, then the equip is destroyed instead', () => {
  const g = duel({ board: [{ m: ['Underground Arachnid'], turn: 3 }, { m: [FILL, 'Blue-Eyes White Dragon'] }] });
  act(g, 0, 'm', 'Underground Arachnid'); pickCard(g, 1, 'm', FILL); passAll(g);
  ok(g.p[0].st.some(c => c && E.name(c) === FILL), 'Warwolf equipped');
  choose(g, 'bp'); passAll(g);
  choose(g, 'Attack Blue-Eyes'); passAll(g, 60);
  for (let i = 0; i < 10 && g.prompt && g.prompt.type !== 'idle'; i++) { if (g.prompt.type === 'yesno') choose(g, 'y'); else passAll(g); }
  ok(inZone(g, 0, 'm', 'Underground Arachnid'), 'Arachnid survives');
  ok(!g.p[0].st.some(Boolean) && g.p[0].lp === 7400, 'equip destroyed instead, 600 damage taken');
});

T('Fortune Lady Light: ATK by Level, Level up in the Standby Phase', () => {
  const g = duel({ board: [{ m: ['Fortune Lady Light'] }, {}] });
  const fl = card(g, 0, 'm', 'Fortune Lady Light');
  ok(E.lv(fl) === 2 && E.atk(g, fl) === 400, 'Level 2 after the first Standby Phase: 400 ATK');
  choose(g, 'end'); passAll(g); choose(g, 'end'); passAll(g);
  for (let i = 0; i < 6 && g.prompt && g.prompt.type !== 'idle'; i++) passAll(g);
  ok(E.lv(fl) === 3 && E.atk(g, fl) === 600, 'Level 3 after the next one: 600 ATK');
});

T('Earthbound Wave negates a Spell', () => {
  const g = duel({ board: [{ hand: ['Earthbound Immortal Aslla piscu', 'Necrovalley'], m: [FILL, FILL], st: ['Earthbound Wave'] }, { hand: ['Mystical Space Typhoon'] }] });
  act(g, 0, 'hand', 'Necrovalley'); passAll(g);
  choose(g, 'ns:' + card(g, 0, 'hand', 'Earthbound Immortal Aslla piscu').u); if (g.prompt && g.prompt.type === 'pick') E.act(g, g.prompt.opts.slice(0, 2).map(o => o.key)); passAll(g);
  choose(g, 'end'); passAll(g);
  for (let i = 0; i < 6 && g.prompt && g.prompt.p !== 1; i++) passAll(g);
  act(g, 1, 'hand', 'Mystical Space Typhoon'); pickCard(g, 0, 'fz', 'Necrovalley');
  ok(hasOpt(g, 'Earthbound Wave'), 'Earthbound Wave offered'); choose(g, 'Earthbound Wave'); passAll(g);
  ok(!!g.p[0].fz && inZone(g, 1, 'gy', 'Mystical Space Typhoon'), 'MST negated, Future Visions stays');
});

console.log(fails ? `\n${fails} check(s) failed.` : '\nAll batch-6 checks passed.');
process.exit(fails ? 1 : 0);
