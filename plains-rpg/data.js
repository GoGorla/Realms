'use strict';
/* ===== Static game data: rarities, classes, items, mobs ===== */

// craft = chance to upgrade FROM this rarity to the next (needs 5 of the same item + rarity)
const RARITIES = [
  { name: 'Common',    color: '#9aa0a6', mult: 1,    craft: 0.64  },
  { name: 'Unusual',   color: '#4caf50', mult: 1.6,  craft: 0.32  },
  { name: 'Rare',      color: '#2196f3', mult: 2.5,  craft: 0.16  },
  { name: 'Epic',      color: '#a64dff', mult: 4,    craft: 0.08  },
  { name: 'Legendary', color: '#ff9800', mult: 6.5,  craft: 0.04  },
  { name: 'Mythic',    color: '#ff3d8b', mult: 10,   craft: 0.02  },
  { name: 'Ultra',     color: '#00e5ff', mult: 16,   craft: 0.01  },
  { name: 'Super',     color: '#ffe600', mult: 26,   craft: 0.001 },
  { name: 'Eternal',   color: '#ffffff', mult: 45,   craft: 0     }
];

const PERK_LABELS = {
  weapon: 'Weapon Strength', health: 'Health', elemental: 'Elemental Strength',
  luck: 'Luck', regen: 'Health Regen', phys: 'Physical Strength', speed: 'Speed'
};

const CLASSES = {
  knight:    { name: 'Knight',    color: '#4da6ff', icon: '🛡️', start: 'iron_sword',   perks: { weapon: 2, health: 1.25 } },
  sorcerer:  { name: 'Sorcerer',  color: '#b266ff', icon: '🔮', start: 'arcane_staff', perks: { elemental: 3, health: 0.5, luck: 1.5 } },
  orc:       { name: 'Orc',       color: '#7cb342', icon: '👹', start: 'orc_cleaver',  perks: { weapon: 3, health: 0.75, regen: 1.5 } },
  druid:     { name: 'Druid',     color: '#26a69a', icon: '🌿', start: 'briar_club',   perks: { health: 2, regen: 2 } },
  rogue:     { name: 'Rogue',     color: '#e53935', icon: '🗡️', start: 'twin_daggers', perks: { luck: 2, speed: 2, phys: 0.5 } },
  barbarian: { name: 'Barbarian', color: '#fb8c00', icon: '🪓', start: 'great_axe',    perks: { health: 0.5, regen: 0.5, phys: 2, weapon: 2, speed: 2 } }
};

/* slot: weapon | armor | boots | charm | consumable
   weapons: dmg, cd (seconds), range (px), elem (elemental), proj (projectile)
   armor: hp   boots: spd (move speed %)   charms: luck / coin / regen */
const ITEMS = {
  // --- starter weapons (also drop from mobs) ---
  iron_sword:   { name: 'Iron Sword',    slot: 'weapon', icon: '🗡️', dmg: 12, cd: 0.70, range: 62,  value: 30 },
  arcane_staff: { name: 'Arcane Staff',  slot: 'weapon', icon: '🪄', dmg: 11, cd: 0.80, range: 230, value: 30, elem: true, proj: true, pcolor: '#c58cff' },
  orc_cleaver:  { name: 'Orc Cleaver',   slot: 'weapon', icon: '🔪', dmg: 20, cd: 1.10, range: 66,  value: 34 },
  briar_club:   { name: 'Briar Club',    slot: 'weapon', icon: '🏏', dmg: 13, cd: 0.80, range: 62,  value: 28 },
  twin_daggers: { name: 'Twin Daggers',  slot: 'weapon', icon: '⚔️', dmg: 7,  cd: 0.42, range: 50,  value: 28 },
  great_axe:    { name: 'Great Axe',     slot: 'weapon', icon: '🪓', dmg: 22, cd: 1.00, range: 72,  value: 36 },
  // --- mob weapons ---
  stone_hammer: { name: 'Stonebreaker Hammer', slot: 'weapon', icon: '🔨', dmg: 26, cd: 1.35, range: 68, value: 45 },
  rotten_club:  { name: 'Rotten Club',   slot: 'weapon', icon: '🦴', dmg: 9,  cd: 0.60, range: 56,  value: 18 },
  witch_wand:   { name: 'Witch Wand',    slot: 'weapon', icon: '🔮', dmg: 13, cd: 0.70, range: 240, value: 42, elem: true, proj: true, pcolor: '#ff7bd5' },
  soldier_spear:{ name: "Soldier's Spear", slot: 'weapon', icon: '🔱', dmg: 15, cd: 0.85, range: 95, value: 38 },
  wolf_fang:    { name: 'Wolf Fang',     slot: 'weapon', icon: '🦷', dmg: 6,  cd: 0.38, range: 46,  value: 24 },
  bone_bow:     { name: 'Bone Bow',      slot: 'weapon', icon: '🏹', dmg: 11, cd: 0.75, range: 270, value: 40, proj: true, pcolor: '#efe6c8' },
  flame_rod:    { name: 'Flame Rod',     slot: 'weapon', icon: '🔥', dmg: 16, cd: 0.85, range: 235, value: 55, elem: true, proj: true, pcolor: '#ff7a2f' },
  // --- armour ---
  rock_plate:     { name: 'Rock Plate',     slot: 'armor', icon: '🪨', hp: 45, value: 45 },
  soldier_plate:  { name: 'Soldier Plate',  slot: 'armor', icon: '🛡️', hp: 32, value: 40 },
  zombie_hide:    { name: 'Zombie Hide',    slot: 'armor', icon: '🧥', hp: 22, value: 28 },
  witch_robe:     { name: 'Witch Robe',     slot: 'armor', icon: '👘', hp: 16, regen: 0.6, value: 36 },
  villager_tunic: { name: 'Villager Tunic', slot: 'armor', icon: '👕', hp: 8,  value: 14 },
  wolf_pelt:      { name: 'Wolf Pelt',      slot: 'armor', icon: '🧣', hp: 20, spd: 0.03, value: 32 },
  // --- boots ---
  soldier_boots: { name: 'Soldier Boots', slot: 'boots', icon: '👢', spd: 0.08, value: 30 },
  wolf_boots:    { name: 'Wolf Boots',    slot: 'boots', icon: '🥾', spd: 0.14, value: 44 },
  zombie_shoes:  { name: 'Grave Shoes',   slot: 'boots', icon: '🩴', spd: 0.05, hp: 10, value: 20 },
  // --- charms / loot ---
  lucky_clover:  { name: 'Lucky Clover',  slot: 'charm', icon: '🍀', luck: 0.10, value: 40 },
  hex_charm:     { name: 'Hex Charm',     slot: 'charm', icon: '🧿', luck: 0.15, value: 55 },
  coin_charm:    { name: 'Coin Charm',    slot: 'charm', icon: '🪙', coin: 0.15, value: 50 },
  vitality_charm:{ name: 'Vitality Charm',slot: 'charm', icon: '❤️', regen: 0.8, value: 48 },
  // --- consumable ---
  health_potion: { name: 'Health Potion', slot: 'consumable', icon: '🧪', heal: 50, value: 12 }
};

const MOBS = {
  stone:    { name: 'Stone Golem',  icon: '🗿', hp: 75, dmg: 10, spd: 38,  size: 22, aggro: 200, reach: 40, atkcd: 1.5, coins: [3, 8], weight: 8,
              drops: [['stone_hammer', .07], ['rock_plate', .08], ['coin_charm', .02], ['great_axe', .015], ['health_potion', .04]] },
  soldier:  { name: 'Soldier',      icon: '💂', hp: 52, dmg: 10, spd: 74,  size: 18, aggro: 240, reach: 36, atkcd: 1.1, coins: [2, 6], weight: 9,
              drops: [['soldier_spear', .08], ['soldier_plate', .08], ['soldier_boots', .08], ['iron_sword', .04], ['orc_cleaver', .02], ['twin_daggers', .03]] },
  witch:    { name: 'Witch',        icon: '🧙‍♀️', hp: 38, dmg: 11, spd: 56, size: 18, aggro: 280, ranged: true, range: 230, atkcd: 1.6, pcolor: '#ff5ce1', coins: [3, 7], weight: 7,
              drops: [['witch_wand', .08], ['witch_robe', .08], ['hex_charm', .05], ['arcane_staff', .04], ['flame_rod', .03]] },
  zombie:   { name: 'Zombie',       icon: '🧟', hp: 62, dmg: 8,  spd: 48,  size: 18, aggro: 220, reach: 34, atkcd: 1.0, coins: [1, 5], weight: 10,
              drops: [['rotten_club', .08], ['zombie_hide', .08], ['zombie_shoes', .06], ['briar_club', .03], ['health_potion', .06]] },
  wolf:     { name: 'Wolf',         icon: '🐺', hp: 34, dmg: 7,  spd: 118, size: 16, aggro: 280, reach: 30, atkcd: 0.8, coins: [1, 4], weight: 7,
              drops: [['wolf_fang', .08], ['wolf_pelt', .08], ['wolf_boots', .07], ['twin_daggers', .02]] },
  skeleton: { name: 'Skeleton',     icon: '💀', hp: 36, dmg: 9,  spd: 52,  size: 17, aggro: 280, ranged: true, range: 250, atkcd: 1.4, pcolor: '#e8e2c8', coins: [2, 5], weight: 6,
              drops: [['bone_bow', .08], ['vitality_charm', .03], ['health_potion', .05], ['rotten_club', .03]] },
  villager: { name: 'Villager',     icon: '🧑‍🌾', hp: 20, dmg: 0, spd: 62, size: 16, aggro: 0, flee: true, coins: [4, 10], weight: 9,
              drops: [['villager_tunic', .08], ['lucky_clover', .04], ['health_potion', .08]] }
};

/* ===== helpers ===== */
function itemStats(id, r) {
  const d = ITEMS[id], m = RARITIES[r].mult, s = Math.sqrt(m);
  return { hp: (d.hp || 0) * m, spd: (d.spd || 0) * s, luck: (d.luck || 0) * s,
           coin: (d.coin || 0) * s, regen: (d.regen || 0) * s, dmg: (d.dmg || 0) * m };
}
function itemName(id, r) { return RARITIES[r].name + ' ' + ITEMS[id].name; }
function buyPrice(id, r) { return id === 'health_potion' ? 25 : Math.round(ITEMS[id].value * RARITIES[r].mult * 2.4); }
function sellPrice(id, r) { return Math.max(1, Math.floor(ITEMS[id].value * RARITIES[r].mult * 0.45)); }
// each step up has chance p; stops at cap
function rollRarity(p, cap) { let t = 0; p = Math.min(0.65, p); while (t < cap && Math.random() < p) t++; return t; }
function itemLines(id, r) {
  const d = ITEMS[id], st = itemStats(id, r), L = [];
  if (d.slot === 'weapon') {
    L.push(`Damage: ${st.dmg.toFixed(1)} (${d.elem ? 'Elemental' : 'Physical'})`);
    L.push(`Attack time: ${d.cd}s &nbsp; Range: ${d.range}`);
    if (d.proj) L.push('Ranged projectile');
  }
  if (st.hp) L.push(`+${Math.round(st.hp)} Max Health`);
  if (st.spd) L.push(`+${(st.spd * 100).toFixed(1)}% Move Speed`);
  if (st.luck) L.push(`+${(st.luck * 100).toFixed(1)}% Luck`);
  if (st.coin) L.push(`+${(st.coin * 100).toFixed(1)}% Coins`);
  if (st.regen) L.push(`+${st.regen.toFixed(1)} Health/s`);
  if (d.heal) L.push(`Heals ${d.heal} HP`);
  return L;
}
