# Ultimate One Piece Adventure

A web-based RPG combining crew building, ocean exploration, and strategic 4v4 combat.

## Requirements

- Node.js 22 or newer
- PostgreSQL (optional until persistence is implemented)

## Development

```bash
npm install
cp apps/server/.env.example apps/server/.env
npm run dev
```

The client runs at `http://localhost:5173`. The server health endpoint is available at
`http://localhost:3001/api/health`.

[Demo Here](https://ryanbchammond.github.io/UltimateOnePieceGame/)

## Playable campaign

The active build contains the completed **Romance Dawn** and **Orange Town** campaign using Story
Mode and Landlubber difficulty:

- Begin at Foosha Village with 75 Berries and 90/100 hull
- Choose extra provisions or a fully repaired tiny boat before departure
- Meet Coby at sea and add him as a player-controlled story guest
- Challenge Alvida openly for higher rewards or infiltrate her hold for a smaller encounter
- Choose between recovering 40 Berries of supplies and freeing captives for 300 bounty
- Fight Alvida with either three enemies on the direct route or two on the infiltration route
- Continue from Coby's persisted checkpoint into Shells Town
- Stand with Rika openly for a three-enemy Marine response and greater rewards, or let Coby gather
  information for a smaller two-enemy encounter
- Recruit Zoro permanently without forcing him into the active battle lineup
- Defeat Morgan, Commander Ripper, and a Marine gunner in Morgan's Last Stand
- Say farewell to Coby, set the Romance Dawn checkpoint, and open a free five-card arc pack
- Reveal all five cards, keep exactly one, and transition to the separate Orange Town map boundary
- Add Nami as an optional player-controlled guest at Orange Town Harbor
- Choose among three Chouchou routes: Mohji's full raiding party, Nami's risky harbor decoy, or
  Cabaji's rooftop acrobats
- Reconverge at a PP-restoring Mayor checkpoint with separate civilian, rally, and supply outcomes
- Defeat Buggy, Cabaji, Mohji, and Richie in the four-unit Big Top climax
- Recruit Nami permanently as the Navigator-preferred crewmate
- Break the seal on a free Orange Town pack, reveal all five cards, and keep exactly one
- Finish at a two-arc campaign summary with the full crew, bounty, and resources preserved
- Use any one to four currently available permanent or guest characters without locked story slots
- Manage battle composition independently from the ten permanent ship-role assignments
- Track Berries, bounty, hull, PP, checkpoints, outcome receipts, and the captain's journal
- Resolve event routes, consequences, and battle rewards entirely from authored story data
- Render only visited nodes and route segments from the active arc on the Phaser map; reachable but
  unvisited destinations remain selectable through the navigation panel
- Automatically persist the current run in browser local storage under a clean development save

The five-card keep-one system, six rarities, shards, star upgrades, role effects, artifacts, and the
legacy East Blue prototype remain implemented and covered as reusable foundations. Romance Dawn
and Orange Town now form the complete two-arc Story Mode vertical slice.

Enemy turns resolve automatically. On a crew turn, click or tap a living enemy on the battlefield,
or use the synchronized keyboard-accessible target list, then choose one of the acting fighter's
four moves below the battlefield. Guards and self-buffs automatically target the acting fighter;
attacks and debuffs use the selected enemy. Remaining initiative appears above the battlefield,
while the battle log, selected-target guidance, and full type guide sit beside it on desktop and
stack below it on smaller screens.

Story Mode uses hybrid recruitment: major story recruits are guaranteed, while optional Tavern
packs provide additional characters. The implemented legacy Baratie pack contains five cards, guarantees one
Rare-or-higher slot, and uses provisional 60% Common, 35% Rare, and 5% Legendary odds per normal
slot. Featured characters receive 3x selection weight within their rarity. The full rarity model
also supports Uncommon, Epic, and Mythical. The free Romance Dawn pack uses 48% Common, 20%
Uncommon, 25% Rare, 6% Epic, and 1% Legendary odds, with Coby, Helmeppo, Alvida, and Morgan featured
at 3x weight within their rarity.
Reduced-motion preferences suppress every standard, enhanced, special, aura, and smoke reveal
animation while preserving the card rarity and selection information.
Future Free-Roam and Chaos modes will use pack-driven recruitment.

Implemented combat rules:

- Every living fighter acts once per round in descending Speed order
- Damage is `Move Power + Attack - Defense`, with a minimum of 1
- All damaging moves use the implemented twelve-type directional matchup chart
- Fighters support one to three defensive types. Matchups multiply and clamp to 0.25×–4× before
  the Devil Fruit Water override; current legacy fighters retain their existing single type
- Magic represents Haki, Light, Darkness, Gravity, and other otherwise-unclassified powers
- Water attacks deal at least 4x damage to Devil Fruit users, rising to 4.5x or 5x when their type
  is already weak to Water
- Every accessible crew member and current story enemy has four authored moves
- Direct attacks have 8 PP, guards 6 PP, buffs/debuffs 5 PP, and multi-target moves 3 PP during the
  provisional balance pass
- Player PP persists between encounters and reloads, while rest sites fully restore it
- Enemies consume fresh encounter-local PP; a weak Desperate Strike prevents zero-PP softlocks
- Guard reduces incoming damage by 40% until that fighter's next action
- Self-buffs and enemy debuffs change Attack or Defense by 20% for two rounds
- Reapplying the same stat effect refreshes its duration instead of stacking it
- Diable Jambe buffs Sanji's Attack and converts his damaging moves to Fire for its duration
- Multi-target moves use lower authored power and hit up to their authored target cap
- Enemies have a 0–100 Battle IQ. Tactical scoring considers knockouts, useful damage, type
  matchups, multi-target value, PP conservation, guard timing, buffs, and debuffs; Battle IQ is the
  chance to use the best-scored action, otherwise the enemy chooses another legal action. The
  value is hidden in production unless an active battle-party member has Observation Haki, while
  development builds continue showing it for tuning
- Fighters who reach 0 HP are removed from later turns
- The battle ends when either variable-size team is defeated

The current Weathered Log Pose is intentionally inactive. Its artifact detail states that it has no
effect in this development build rather than implying an unimplemented bonus.

Run all automated checks with:

```bash
npm test
npm run typecheck
npm run build
```

## Workspace layout

- `apps/client` — React UI, Phaser rendering, and Zustand game state
- `apps/server` — Express API and PostgreSQL connection foundation
