# Engine gaps reported by the card batches (2026-11-20)

Fixed: Bottomless Trap Hole crash (g.sw cleared before a Battle Phase / Main Phase activation).

From batch 5:
- Multiple attacks: canAttack allows at most 2 (Chimeratech Overdragon needs N).
- No "end of Battle Phase" event (Destiny HERO - Dasher).
- Per-summon Tribute restrictions in tributeCands (The Immortal Bushi).
- No hook for ongoing Level changes in lv() (A Legendary Ocean -1 Level).
- Attack redirect: attack() keeps its target local (Crystal Beast Amber Mammoth).
- Field Zone cards aren't scanned by activatable() / emit() triggers (Ancient City - Rainbow Ruins, Field Spell effects).
- Replacement effects ("place it in the S/T Zone instead", "destroy this instead"): Crystal Beasts, Machina Gearframe, Kristya.
- Position changes emit no event (Cloudians).
- Field Spells can't be Set.
From batch 2:
- tgt()/pick for targets doesn't honor cantBeTargeted (Aurkus).
- takeControl() doesn't check forbid (Botanical Lion).
- Skill Drain: resolveChain only checks c.flags.negated; engine.js continuous monster effects ignore negd() in places.
- processTriggers doesn't call forbid() for trigger activations (Shadow-Imprisoning Mirror).
- "Before an opponent's targeting effect resolves" hook (Machina Fortress).
- Ryko's mill isn't marked for Garoth-style "sent by a card effect" checks (Lightsworn mills).
From batch 3:
- End-of-Battle-Phase moment/trigger (Gladiator Beast tag outs, Ancient Forest; also Dasher).
- "Can't be Special Summoned" generic enforcement (LADD, Dark Dust Spirit, Norleras, Ancient Gear Beast): a self flag checked in ss().
- name() / attr() / race() overrides (Prisma name copy, LADD also DARK, Zombie World, Phantom of Chaos copy).
- synCombos ignores per-material restrictions (Fishborg Blaster, Royal Swamp Eel) and Quickdraw Synchron's substitution.
- tribNeed() hook (Geartown one less Tribute).
- Banish-instead replacement in move() (Dimensional Fissure, Banisher of the Radiance).
- Destruction replacement (Machina Peacekeeper).
From batch 6:
- Field Zone ('fz') missing from emit() trigger scan and activatable() (Future Visions, Iron Core Specimen Lab; same as batch 3/5).
- Name/effect copying by changeable name (Neo-Spacian Dark Panther, Phantom of Chaos).
- Tribute-count changes (Double Coston = 2 Tributes; Big Piece Golem, Rooklord tributeless rules) need tribNeed/tribute-value hooks.
- "Must attack this card" forcing (Evil HERO Malicious Fiend).
From batch 1:
- batch-1.js uses a hidden hook ("hub") that replaces g.pend with a getter to drop negated triggers and adds permanent rules for Synchro material limits. Replace with real engine support: a forbid/negate check in processTriggers, and per-Synchro material checks in synCombos (Debris Dragon, Doomkaiser, Ha Des, Gishilnodon, Exploder, Tempest, Trident), then remove the hub.
- Destruction replacement (Clear Vice Dragon "discard instead").
- More than 2 attacks a turn (Trident Dragion).
From batch 7:
- Guard `SC(x).effs &&` where anyPlayer S/T effects are scanned (crash when an equipped monster card with no effs sits in a S/T zone); batch-7 adds empty effs to every script as a workaround.
- Destruction replacement ("destroy another card instead": Slingen, Power Tool Dragon, Six Samurai) — same hook as batches 1, 2, 3.
- tribNeed hook (Darklord Zerato).
- Forbid moves to the Deck/Extra Deck (G.B. Hunter); banish-instead in move() (Macro Cosmos) — same as batch 3.
- Field Zone activatable/emit (Ojama Country, Brain Research Lab).
- Generic "destroyed after an effect that targets it resolves" (Reaper on the Nightmare).
- "Cannot be Special Summoned" generic self flag (Witch of the Black Rose, Overdrive Teleporter, Faultroll).
- Position-change event (Scopen, Level Limit - Area B, Cloudians).
- Ritual Summons with GY material (Djinn).

Done in the engine pass (2026-11-20): Field Zone triggers and effects (and Setting Field Spells), static-effect cache refresh on flips and face changes, a position-change event ('pos'), an end-of-Battle-Phase event (phase 'bpEnd'), triggers checked against forbid() and resolving monster effects against negd() (Skill Drain), more than 2 attacks (c.flags.maxAttacks + maxAttacksTurn), cantBeTargeted honored by tgt(), a tribute-count hook (self.tributes / cont.tributes), a destruction replacement hook (self.replaceDestroy / cont.replaceDestroy, also for battle), the SC(x).effs guard, and the opponent's anyPlayer cards found from the idle and Battle Phase menus.
Still open: cards written before these hooks keep their PARTIAL workarounds until they're moved onto them (Gladiator Beast tag outs -> bpEnd; Cloudians / Scopen / Level Limit -> 'pos'; Machina Gearframe / Peacekeeper / Six Samurai / Slingen / Clear Vice -> replaceDestroy; Double Coston / Geartown / Zerato -> tributes; Aurkus / Turbo Warrior -> cantBeTargeted).
