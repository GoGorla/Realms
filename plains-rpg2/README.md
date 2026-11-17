# Plains RPG - Reborn

A menu-driven idle RPG (plain HTML/CSS/JS, no build step, no walkable world). Fights run automatically.

## Run / host
Open `index.html`, or host on GitHub Pages. `index.html` must be at the root of the folder Pages serves
(a game inside a repo subfolder is at `https://<user>.github.io/<repo>/<folder>/`). `.nojekyll` is included.

## Tabs
- **Hunt**: pick a mob from The Plains (Stone Golem, Soldier, Witch, Zombie, Wolf, Skeleton, Villager). Auto-battle, loot and coins. Depth rises every 30 kills.
- **Inventory / Crafting**: equip gear, sell, and combine 5 of the same item and rarity.
- **Shop**: 6 shop quarters with rotating stock (coins: 100c = 1s, 100s = 1g).
- **Villages**: raid a village, beat its guards, loot its chests (one is a treasure chest).
- **Loadout** (bottom-right quarter circle): class colour, 4 equipment slots on the inner arc, inventory around it. Click to select, double-click to equip/unequip.

## Classes
Knight, Sorcerer, Orc, Druid, Rogue, Barbarian, each with their own perks and starter weapon.

## Craft chances
Common 64%, Unusual 32%, Rare 16%, Epic 8%, Legendary 4%, Mythic 2%, Ultra 1%, Super 0.1% (to reach the next rarity). Failed crafts use up the 5 items.

Keys: Q potion, P pause. Progress auto-saves in the browser.
