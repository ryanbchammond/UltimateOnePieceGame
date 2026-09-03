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

## Live demo

[Play Ultimate One Piece Adventure on GitHub Pages](https://ryanbchammond.github.io/UltimateOnePieceGame/)

## Playable campaign

The active build contains the complete **East Blue Saga**—Romance Dawn, Orange Town, Syrup
Village, Baratie, Arlong Park, and Loguetown—using Story Mode and Landlubber difficulty:

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
- Break the seal on a free Orange Town pack, reveal all five cards, keep exactly one, and sail for
  Syrup Village
- Add Usopp as an optional player-controlled guest and choose whether to believe his warning at the
  coast or follow Nami's evidence trail around Kaya's mansion
- Fight Jango's landing party or Sham and Buchi before reconverging at a PP-restoring checkpoint
- Defeat Captain Kuro, Jango, Sham, and Buchi in the four-unit Black Cat Pirates climax
- Recruit Usopp permanently, receive the Going Merry, and open a free Syrup Village pack featuring
  Usopp and Kuro
- Defend Baratie through one of three opening routes, witness Zoro’s challenge to Mihawk, defeat
  Krieg’s officers and Don Krieg, then recruit Sanji permanently as the crew’s Cook
- Investigate Arlong’s occupation through one of three Cocoyasi routes, answer Nami’s plea for
  help, and choose one of three assaults on the longest map in the East Blue campaign
- Defeat Arlong and his officers, free Cocoyasi Village, and sail with Nami toward Loguetown
- Prepare for the Grand Line through one of three Loguetown routes, visit Gol D. Roger’s execution
  platform, and break through Smoker’s pursuit during the storm
- Complete the six-arc saga at Reverse Mountain with the full crew, bounty, and resources preserved
- Receive a five-card East Blue Saga pack drawn from every arc pool, with 60% combined Rare, Epic,
  and Legendary odds instead of the standard arc pack’s 32%
- Use any one to four currently available permanent or guest characters without locked story slots
- Manage battle composition independently from the ten permanent ship-role assignments
- Track Berries, bounty, hull, PP, checkpoints, outcome receipts, and the captain's journal
- Resolve event routes, consequences, and battle rewards entirely from authored story data
- Navigate each active arc on a parchment chart where explored nodes show their resolved state and
  unexplored nodes remain visible as question marks
- Select numbered reachable destinations directly on the chart or through the synchronized heading
  guide, with ship/party markers animating between sea and land locations
- Automatically persist the current run in browser local storage under a clean development save

The five-card keep-one system, six rarities, shards, star upgrades, role effects, artifacts, and the
legacy East Blue prototype remain implemented and covered as reusable foundations. The active
Story Mode campaign now runs from Romance Dawn through Loguetown.

## Voyage interface

Milestone 11 uses a Slay-the-Spire-inspired route presentation with a nautical manga treatment:

- The compact masthead keeps Berries, bounty, hull, relics, location, and restart state visible.
- The Phaser chart supports pointer/touch dragging, wheel and button zoom from 60% to 250%, and
  panning into the water beyond the parchment borders.
- Reachable nodes receive numbered badges matching the heading guide. Clicking either destination
  control begins travel; locked unexplored locations remain question marks.
- A ship marker represents open-sea movement and a party marker represents land movement. Travel
  and arrival transitions smoothly focus the destination before the next scene.
- Story outcomes return to the chart with a compact receipt, and the player chooses the next
  numbered map node to continue.
- Desktop camera framing keeps the current and reachable locations clear of the lower-right story
  guide. On smaller layouts the guide stacks below the chart instead.
- Every combat first opens the battle-party preparation scene. The battlefield is created only
  after the player confirms the active lineup.

The Milestone 11 build and playtest are approved. Development after that approval extends the
campaign through the remainder of the East Blue Saga before Milestone 12 begins.

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
Uncommon, 25% Rare, 6% Epic, and 1% Legendary odds, with Luffy, Coby, Helmeppo, Alvida, and Morgan featured
at 3x weight within their rarity. Orange Town and Syrup Village use the same rarity table; the
Syrup Village pack features Usopp and Captain Kuro. Baratie and Arlong Park add their own free arc
packs, while Loguetown’s pool rolls into the saga reward. Completing Loguetown awards the East Blue
Saga pack: it contains the union of all arc-card pools and uses 25% Common, 15% Uncommon, 35% Rare,
15% Epic, and 10% Legendary odds.
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
