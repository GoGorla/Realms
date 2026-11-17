# Plains RPG

A top-down browser action RPG (plain HTML/CSS/JS, no build step). One world: **the Plains**.

## Run it
Open `index.html` in a browser, or host it on GitHub Pages.

## Put it on GitHub
```bash
git init
git add .
git commit -m "Plains RPG"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
Then on GitHub: **Settings → Pages → Deploy from branch → main / (root)**. Your game will be live at `https://<you>.github.io/<repo>/`.

## Controls
- **WASD / arrows**: move (you auto-attack the nearest enemy in weapon range)
- **E**: open a shop quarter or a village chest
- **Q**: drink a Health Potion
- **Click** a slot to select it, **double-click** to equip / unequip

## Classes
| Class | Perks |
|---|---|
| Knight | Weapon 2x, Health 1.25x |
| Sorcerer | Elemental 3x, Health 0.5x, Luck 1.5x |
| Orc | Weapon 3x, Health 0.75x, Regen 1.5x |
| Druid | Health 2x, Regen 2x |
| Rogue | Luck 2x, Speed 2x, Physical 0.5x |
| Barbarian | Health 0.5x, Regen 0.5x, Physical 2x, Weapon 2x, Speed 2x |

Weapon Strength multiplies physical weapon damage, Elemental Strength multiplies elemental weapons (staves, wands, rods), Physical Strength multiplies crit chance (base 1/15), Speed multiplies attack speed, Luck boosts drop chance and rarity, Regen multiplies health regen.

## World
- **Mobs**: Stone Golem, Soldier, Witch, Zombie, Villager (coins), plus Wolf and Skeleton. Higher level the farther from camp.
- **Shop quarters**: 6 around the map (stock refreshes). Buy and sell gear and potions.
- **Villages**: 6 villages with guards and 3 chests each (one big treasure chest). Chests refill after a while.
- **Loadout**: the quarter circle in the bottom-right. The inner arc is your equipment (weapon, armor, boots, charm); the outer arcs are inventory stacks.

## Crafting
Select a stack with **5 or more** of the same item and rarity and press **Craft ×5**. Success chance by rarity:
Common→Unusual 64%, Unusual→Rare 32%, Rare→Epic 16%, Epic→Legendary 8%, Legendary→Mythic 4%, Mythic→Ultra 2%, Ultra→Super 1%, Super→Eternal 0.1%. The 5 items are consumed whether or not it succeeds.

## Files
- `data.js` rarities, classes, items, mobs
- `game.js` world, combat, AI, drops, rendering
- `ui.js` HUD, loadout wheel, item panel, shop, class select
- Progress auto-saves to `localStorage`.
