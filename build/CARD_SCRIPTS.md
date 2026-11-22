# Writing card scripts for the Learn Edison engine

The duel engine is `js/engine.js`. Every card effect is a small script registered by card name. The 84 cards of the five Best decks are scripted inside `engine.js` (the `SCRIPTS` object, after the line `/* ---------- card scripts ---------- */`). Read those first: they are the reference examples. Every other card goes in a batch file `js/cards/batch-N.js`.

## Ground rules

- **Edison text only.** Script each card from the `Text:` line in your batch list (its April 2010 text) and its rulings, not from its modern text. "Remove from play" means banish. Card text written before Problem-Solving Card Text has no colons or semicolons. Read it the 2010 way: the cost is what you do "to activate", and "When ..." conditions are triggers.
- **Once per turn** only when the text says so (`opt: true`).
- **PSCT:** the part before a colon (`:`) is the activation condition, the part before a semicolon (`;`) is the cost, and the rest is the effect. Costs go in `cost`, choosing targets goes in `target`, and everything else goes in `res`.
- **Check at resolution.** By the time `res` runs, targets may have left the field. Use `live(L)` for targets that must still be on the field. For cards in the GY or hand, check `c.zone`. If the card itself must still be there (most monster effects), check `onField(c)`.
- **"When ... you can"** optional triggers use `when: true`, so they can miss the timing. **"If ..."** triggers don't. Mandatory triggers (no "you can") use `mand: true`.
- **Edit only your own batch file.** Never edit `js/engine.js`, other batch files, `index.html` or the tests. If a card truly needs a change to the engine core, script the closest correct behaviour. Then mark it with a `// ENGINE: what is missing` comment and list it in your final report.
- **Logs:** short plain sentences, no em dashes. Example: `log(g, \`${PN(g, p)} added ${name(x)} to the hand.\`)`. The helpers already log draws, destroys, summons and damage.
- **Partial cards:** when a card can't be done exactly, do the closest version and add `// PARTIAL: why`. Never leave a card out: every card in your list gets an entry.

## File shape

```js
/* Batch N: <decks>. Card scripts for js/engine.js (see build/CARD_SCRIPTS.md). */
(function () {
'use strict';
const E = window.EdisonEngine, L = E.lib;
const { pick, tgt, yn, choose, move, destroy, ss, draw, damage, gain, pay, mill, search, takeControl, setFaceDown, negate, addMod,
  equip, equippedTo, link, addCtr, ctr, negateAttack, endBattle, addRule, token, tokens, fusionSummon, canFusion, ritualSummon, canRitual,
  name, D, isMon, isST, isSpell, isTrap, onField, faceUp, attr, race, lv, baseAtk, monsOf, stOf, fieldOf, allField, fieldMons,
  freeM, freeST, nFreeM, allCards, shuffleDeck, log, PN, has, live, opp, oppFaceUp, stOnField, spellTrapAct, evSummoned,
  fromFieldToGY, battleKill, isGemini } = L;
const atk = L.atk, def = L.def;
E.addScripts({
  'Card Name': { effs: [ /* effects */ ] },
});
})();
```

## A card script

`{ effs, proc, self, cont, mats, noSynchro }`

- **`effs`**: a list of effects (below).
- **`proc`**: a summon rule of its own. Example: "You can Special Summon this card from your hand by ...".
  - `{ cond(g,c,p), cost: function*(g,c,p,group), label, pos, how, extra }`.
  - The engine offers it as an idle action and handles the summon window (Solemn, Royal Oppression).
  - Use `extra: true` for an Extra Deck monster with its own summon rule. Example: a Fusion summoned by sending materials from the field.
- **`self`**: facts about the card while face-up. Each is a value, or a function `(g, c)`.
  - Flags: `piercing`, `directAttack`, `noBattleDestroy`, `noEffectDestroy`, `cantAttack`, `noAttackTarget` (it can't be attacked), `noBattleDamage` (its controller takes no battle damage from its battles), `unaffectedSpells`, `unaffectedTraps`.
  - `atk(g,c)` and `def(g,c)` return a number added to its ATK/DEF, for "gains X for each ...".
- **`cont`**: effects on other cards while this card is face-up on the field.
  - `atk(g,src,c)` and `def(g,src,c)`: numbers added to any monster `c`.
  - `grant(g,src,c,flag)`: true gives monster `c` one of the `self` flags.
  - `forbid(g,src,action)`: true blocks an action (shapes below).
  - `dmg(g,src,p,n,o)`: return a new damage number, or `{gain: n}` to turn the damage into a gain.
  - `negates(g,src,c)`: true negates `c`'s effects (Skill Drain, Jinzo for Traps).
  - `loc: 'gy'` or `'hand'` makes it work from there instead of the field.
- **`mats`** (Fusion): a list of predicates, one per material, for when the text's first line can't be read automatically. `fusionRecipe` reads plain recipes such as `"A" + "B"` and `1 "HERO" monster + 1 WATER monster`.
- **`noSynchro: true`**: a Synchro Monster with its own summon rule that can't be Synchro Summoned normally.

**forbid actions:**
- `{type:'activate', c, eff, p}` (any card or effect activation)
- `{type:'ns', c, p}` and `{type:'set', c, p}`
- `{type:'ss', c, p, how}`, where `how` is `special`, `synchro`, `fusion` or `ritual`
- `{type:'search', p}` (add from the Deck to the hand)
- `{type:'attack', c}`, `{type:'setST', c, p}`, `{type:'draw', p}`, `{type:'pos', c}`

## An effect

```js
{ type: 'act' | 'ign' | 'quick' | 'trig',
  loc: 'm' (default for monsters) | 'st' | 'hand' | 'gy' | 'any',
  opt: true,              // once per turn
  ds: true,               // may be activated in the Damage Step
  speed: 2,               // override (rare)
  tags: { destroy: 1, ss: 1 },  // destroy: Stardust Dragon can negate it; ss: Royal Oppression can negate it
  negSummon: true,        // can be used in a summon negation window (Solemn style)
  anyPlayer: true,        // either player may use it (Royal Oppression)
  gemini: true,           // only while this Gemini is Gemini Summoned (c.flags.gemini)
  label: 'Short button text',
  cond(g, c, p, x) {},    // can it be activated now? x.top is the chain link it would respond to (for responses)
  cost: function* (g, c, p, L) {},
  target: function* (g, c, p, L) {},   // use tgt(g, p, L, text, cards, min, max, hint) so L.t holds the targets
  res: function* (g, c, p, L) {},
  // triggers only:
  on(g, ev, c) {},        // does this event trigger it? (no prompts here)
  when: true, mand: true, faceDownOk: true,
}
```

- **`act`** is a Spell or Trap card's own activation. The engine moves it from the hand or turns it face-up. A Normal Spell or Trap goes to the GY after it resolves. Continuous, Equip and Field cards stay.
  - **Equip Spells** call `equip(g, c, target)` in `res`. If no equip happens, the card goes to the GY.
  - The equipped monster's bonus goes in `cont.atk: (g, src, m) => src.equipTo === m.u ? 500 : 0`.
- **`ign`**: Ignition (Spell Speed 1, your Main Phase). **`quick`**: Spell Speed 2.
- **`trig`**: Trigger and Flip effects, which fire on events:
  - `move` `{c, from, to, wasField, reason, destroyed, battle, killer, by, prevCtrl, snap}`. `snap` is the card as it was on the field (atk, attr, lv, race, name). Reasons: draw, effect, cost, battle, tribute, synchro, fusion, ritual, discard, rule, summon, set, activate, equip.
  - `summon` `{cs, how, p, tribs, byEffect}`. `how` is one of: normal, tribute, flip, special, synchro, fusion, ritual, gemini.
  - `flip` `{c, p, battle}`: a Flip effect is `on: (g,ev,c) => ev.type==='flip' && ev.c===c`.
  - `set` `{c, p}`, `attack` `{a, t, p, direct}` (the attack declaration), `dsStart` `{a, t}`.
  - `afterCalc` `{a, t, tWasDef, flipped}`, `dsEnd` `{a, t}`.
  - `damage` `{p, n, battle, src, srcP, direct}`, `phase` `{ph: 'standby'|'end', tp}`.
- **Battle and chain state:**
  - Attack declaration window: `g.aw = {a, t}`. During battle: `g.battle = {a, t}`. In the Damage Step: `g.inDS`.
  - The monster(s) just summoned, which "when summoned" Traps can respond to: `g.sw = {cs, p, how}`.
  - A summon being attempted, which Solemn can negate: `g.attempt = {cs, how, p}`. Set `g.attempt.negated = true` to negate it.
  - The chain: `g.chain` (links `L = {c, eff, p, t, data, negated, tags, cardAct}`). The link you respond to is `x.top` in `cond`.
  - To negate a link: `L2.negBy = p; negate(g, L2, destroyIt)`.
- **Game state:**
  - Players: `g.p[p]` has `lp, deck (top = last), hand, gy, ban, extra, m[5], st[5], fz`.
  - The turn: `g.tp` (turn player), `g.turnNo`, `g.phase` (draw, standby, main1, battle, main2, end).
  - Card fields: `c.u` (unique id), `c.owner`, `c.ctrl`, `c.zone` (hand, deck, gy, ban, extra, m, st, fz), `c.pos` (atk, def, set for monsters; up, set for S/T), `c.turnIn`, `c.flags`, `c.mods`, `c.ctr`, `c.equipTo`, `c.linkTo`.
- **Turn flags:**
  - `g.noBP[p] = true` ("you can't conduct your Battle Phase").
  - `g.noSummon[p]` (can't summon).
  - `g.onlyAttacker[p] = u`.
  - `g.p[p].noBattleDamage = g.turnNo` (no battle damage this turn).
  - `c.flags.extraAttack = g.turnNo` (a second attack this turn).
  - For "until the End Phase" or "until your next turn" restrictions, use `addRule(g, forbidFn, {end: g.turnNo})` or `{startOf: p}`.

## Helpers (`E.lib`)

- **Prompts.** These are all generators, so call them with `yield*`:
  - `pick(g,p,text,cards,min,max,hint)` returns the chosen cards.
  - `tgt(...)` is the same, but also stores the targets in `L.t`.
  - `yn(g,p,text)` returns true or false. `choose(g,p,text,labels)` returns an index.
  - **Hints** guide the computer: `'good'` (best for the picker), `'bad'` (hurts the other side: pick their best), `'cost'` (what the picker can spare most).
- **Moving cards:**
  - `move(g,c,to,o)`, where `to` is hand, deck (shuffled in), deckTop, gy, ban, m, st.
  - `destroy(g,cards,{by:p, src:c})` returns the destroyed cards. Pass `src` so "unaffected by Spells/Traps" works.
  - `ss(g,p,c,pos,{negate, banishOnLeave, how})` returns false if it couldn't summon.
  - `takeControl(g,p,c,untilEnd)` and `setFaceDown(g,c)`.
- **LP and the Deck:** `draw(g,p,n)`, `damage(g,p,n,{src:c, srcP:p})`, `gain`, `pay`, `mill(g,p,n)`, and `yield* search(g,p,filter,text,to)`, where `to` is `'hand'` (the default) or `'gy'`.
- **Stats:** `addMod(g,c,{atk, def, end:true})`, or `{set: 0, which: 'atk'|'def'|'both', end:true}`. `end` means "until the End Phase". Read the current values with `atk(g,c)` and `def(g,c)`.
- **Equips, links and counters:**
  - `equip(g,eq,target)` and `equippedTo(g,eq)`.
  - `link(g,st,m)` (Call of the Haunted style: if either leaves the field, the other is destroyed).
  - `addCtr(g,c,'spell',n)` and `ctr(c,'spell')`.
- **Battle:** `negateAttack(g)` (Necro Gardna, Sakuretsu-style negation) and `endBattle(g)`.
- **Tokens:**
  - `tokens(g,p,{n:'Fluff Token',a:'WIND',r:'Plant',lv:1,atk:0,def:0},count,'def',{noTribute:true})` summons several at once.
  - `token(...)` makes a single one.
- **Fusion and Ritual:**
  - `yield* fusionSummon(g,p,{from:['hand','m'], banish:false, filter:fx=>...})` and `canFusion(g,p,o)`.
  - `yield* ritualSummon(g,p,{monster:c=>..., exact:true})` and `canRitual(g,p,o)`.
- **Card facts:** `name(c)` (the name on the field), `D(c)` (raw data: n, k, sub, a, r, lv, atk, def, tu), `attr`, `race`, `lv`, `baseAtk`, `isMon`, `isST`, `isSpell`, `isTrap`, `onField`, `faceUp`, `has(g,c,flag)`.
- **Lists:** `monsOf(g,p)`, `stOf(g,p)`, `fieldOf(g,p)`, `allField(g)`, `fieldMons(g)`, `oppFaceUp(g,p)`, `stOnField(g)`, `allCards(g,'gy')`, `freeM(g,p)` (-1 if full), `freeST(g,p)`, `nFreeM(g,p)`.
- **Matching events:** `evSummoned(ev,c,[hows])`, `fromFieldToGY(ev,c)`, `battleKill(ev,c)` ("this card destroys a monster by battle and sends it to the GY"), `spellTrapAct(L)` (this link is a Spell/Trap card activation).

## Testing

From `learn-edison/`:
1. `node build/test_cards.js js/cards/batch-N.js 12` plays random duels around each card. It reports crashes (with the stack), stuck games, and cards whose effect never happened ("ok?"). Fix every crash. Look at each "ok?": usually the card's condition never comes true in random play, but it can also be a broken `cond`.
2. `node build/test_engine.js 300 all` plays random duels with every deck and must show 0 crashes and 0 stuck.
3. For tricky cards, write a scenario check in `build/test_batch-N.js`, modelled on `build/test_rules.js`. `cfg.board` sets up hands, fields and GYs. Example: `duel([FILL],[FILL],{board:[{hand:['X'], m:['Y'], st:['Z'], gy:[...], extra:[...]}, {...}]})`.
