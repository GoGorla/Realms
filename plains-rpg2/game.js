'use strict';
/* ===== Idle-RPG engine: auto-battles, raids, shops, crafting (no walkable world) ===== */
(() => {
  const INV = 22, SAVE = 'plains_rpg_save_v2', STEP = 0.05;
  const rr = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rr(a, b + 1));

  const G = window.Game = { s: null, st: null, f: null, running: false, time: 0, paused: false, DAY: 24 };

  /* ---------- static world data (menus only) ---------- */
  const VILLAGES = [
    { name: 'Oakvale', lvl: 1 }, { name: 'Westfield', lvl: 2 }, { name: 'Northwatch', lvl: 3 },
    { name: 'Millbrook', lvl: 4 }, { name: 'Stonehaven', lvl: 5 }, { name: "Raven's Rest", lvl: 6 }
  ].map(v => ({ ...v, chests: [{ big: false, t: 0 }, { big: false, t: 0 }, { big: true, t: 0 }] }));
  const SHOPS = ['Crossroads Quarter', 'Northgate Quarter', 'Eastfield Quarter', 'Southmarket Quarter', 'Hilltop Quarter', 'Lakeside Quarter']
    .map(name => ({ name, stock: null, stockT: -999 }));
  G.villages = VILLAGES; G.shops = SHOPS;
  const MOB_LIST = Object.keys(MOBS);
  G.mobList = MOB_LIST;

  /* ---------- stats ---------- */
  function calcStats() {
    const S = G.s, pk = CLASSES[S.cls].perks, m = k => pk[k] || 1;
    let hp = 0, spd = 0, luck = 0, coin = 0, regen = 0;
    for (const slot of ['armor', 'boots', 'charm']) {
      const it = S.eq[slot]; if (!it) continue;
      const st = itemStats(it.id, it.r);
      hp += st.hp; spd += st.spd; luck += st.luck; coin += st.coin; regen += st.regen;
    }
    let dmg = 4, cd = 0.6, elem = false;
    const w = S.eq.weapon;
    if (w) { const d = ITEMS[w.id]; dmg = d.dmg * RARITIES[w.r].mult; cd = d.cd; elem = !!d.elem; }
    dmg *= elem ? m('elemental') : m('weapon');
    return {
      maxHp: Math.round(100 * m('health') + hp), speed: 190 * (1 + spd), luck: m('luck') * (1 + luck),
      coinMul: 1 + coin, regen: 2 * m('regen') + regen, cd: cd / m('speed'),
      crit: Math.min(0.95, m('phys') / 15), dmg, elem
    };
  }
  G.recalc = () => {
    const old = G.st ? G.st.maxHp : 0; G.st = calcStats();
    if (old && G.st.maxHp > old) G.s.hp += G.st.maxHp - old;
    G.s.hp = Math.min(G.s.hp, G.st.maxHp);
  };
  G.maxDepth = () => 1 + Math.floor(G.s.kills / 30);

  /* ---------- log / inventory ---------- */
  function log(txt, color) { const f = G.f; f.log.unshift({ txt, color: color || '#cfcfcf' }); if (f.log.length > 8) f.log.pop(); }
  function addItem(id, r, n = 1) {
    const inv = G.s.inv;
    for (const st of inv) if (st && st.id === id && st.r === r) { st.n += n; return true; }
    const i = inv.indexOf(null); if (i < 0) return false;
    inv[i] = { id, r, n }; return true;
  }
  function give(id, r, src) {
    if (addItem(id, r)) {
      log(`${src}: ${ITEMS[id].icon} ${itemName(id, r)}`, RARITIES[r].color);
      if (r >= 2) UI.toast(`${itemName(id, r)}!`, RARITIES[r].color);
    } else {
      const c = sellPrice(id, r); G.s.coins += c;
      log(`Bag full - auto-sold ${itemName(id, r)} for ${c}c`, '#ff9a9a');
    }
    G.dirty = true;
  }
  function take(i) { const st = G.s.inv[i]; st.n--; if (st.n <= 0) G.s.inv[i] = null; }

  G.equip = i => {
    const st = G.s.inv[i]; if (!st) return;
    const slot = ITEMS[st.id].slot;
    if (slot === 'consumable') return G.use(i);
    const item = { id: st.id, r: st.r }, old = G.s.eq[slot];
    take(i);
    if (old && !addItem(old.id, old.r)) { addItem(item.id, item.r); UI.toast('Inventory full', '#ff7777'); return; }
    G.s.eq[slot] = item; G.recalc(); UI.refresh();
  };
  G.unequip = slot => {
    const it = G.s.eq[slot]; if (!it) return;
    if (!addItem(it.id, it.r)) { UI.toast('Inventory full', '#ff7777'); return; }
    G.s.eq[slot] = null; G.recalc(); UI.refresh();
  };
  G.use = i => {
    const st = G.s.inv[i]; if (!st) return;
    const d = ITEMS[st.id]; if (!d.heal) return;
    if (G.f.dead > 0) { UI.toast('You are recovering', '#aaa'); return; }
    if (G.s.hp >= G.st.maxHp) { UI.toast('Already at full health', '#aaa'); return; }
    G.s.hp = Math.min(G.st.maxHp, G.s.hp + d.heal); take(i);
    log(`Drank a potion (+${d.heal} HP)`, '#5df08a'); UI.refresh();
  };
  G.quickPotion = () => { const i = G.s.inv.findIndex(s => s && s.id === 'health_potion'); if (i >= 0) G.use(i); else UI.toast('No potions', '#aaa'); };
  G.sell = (i, all) => {
    const st = G.s.inv[i]; if (!st) return;
    const n = all ? st.n : 1;
    G.s.coins += sellPrice(st.id, st.r) * n;
    st.n -= n; if (st.n <= 0) G.s.inv[i] = null;
    UI.refresh();
  };
  G.craft = i => {
    const st = G.s.inv[i]; if (!st) return;
    if (ITEMS[st.id].slot === 'consumable' || st.r >= RARITIES.length - 1) return;
    if (st.n < 5) { UI.toast('Need 5 of the same item and rarity', '#ff7777'); return; }
    const id = st.id, r = st.r, chance = RARITIES[r].craft;
    st.n -= 5; if (st.n <= 0) G.s.inv[i] = null;
    if (Math.random() < chance) {
      addItem(id, r + 1);
      UI.toast(`Crafted ${itemName(id, r + 1)}!`, RARITIES[r + 1].color);
      log(`Crafted ${itemName(id, r + 1)}!`, RARITIES[r + 1].color);
    } else {
      UI.toast(`Crafting failed (${(chance * 100).toFixed(chance < 0.01 ? 1 : 0)}% chance) - 5 items lost`, '#ff7777');
    }
    UI.refresh();
  };

  /* ---------- shops ---------- */
  function genStock() {
    const pool = Object.keys(ITEMS).filter(k => ITEMS[k].slot !== 'consumable');
    const out = [{ id: 'health_potion', r: 0, price: 25, unlimited: true }];
    for (let i = 0; i < 6; i++) {
      const id = pool.splice(ri(0, pool.length - 1), 1)[0], r = rollRarity(0.32, 3);
      out.push({ id, r, price: buyPrice(id, r), sold: false });
    }
    return out;
  }
  G.shopStock = shop => {
    if (!shop.stock || G.time - shop.stockT > 240) { shop.stock = genStock(); shop.stockT = G.time; }
    return shop.stock;
  };
  G.buy = (shop, idx) => {
    const e = shop.stock[idx];
    if (!e || e.sold) return;
    if (G.s.coins < e.price) { UI.toast('Not enough coins', '#ff7777'); return; }
    if (!addItem(e.id, e.r)) { UI.toast('Inventory full', '#ff7777'); return; }
    G.s.coins -= e.price; if (!e.unlimited) e.sold = true;
    UI.refresh();
  };

  /* ---------- combat ---------- */
  function newEnemy(type, lvl) {
    const d = MOBS[type], hp = d.hp * (1 + 0.35 * (lvl - 1));
    return { type, def: d, lvl, hp, maxHp: hp, dmg: d.dmg * (1 + 0.25 * (lvl - 1)) };
  }
  G.setTarget = t => { G.s.target = t; G.f.raid = null; G.f.enemy = null; G.f.spawnT = 0.2; UI.refreshHunt(); };
  G.setDepth = d => { G.s.depth = Math.max(1, Math.min(G.maxDepth(), d)); G.f.enemy = null; G.f.spawnT = 0.2; UI.refreshHunt(); };
  G.startRaid = vi => {
    const v = VILLAGES[vi];
    if (G.f.dead > 0) { UI.toast('You are recovering', '#aaa'); return; }
    if (G.f.raid) { UI.toast('Already raiding', '#aaa'); return; }
    if (!v.chests.some(c => c.t <= 0)) { UI.toast(`${v.name}'s chests are empty for now`, '#aaa'); return; }
    G.f.raid = { v, queue: ['soldier', 'soldier', 'soldier'].slice(0, 2 + (v.lvl > 3 ? 1 : 0)) };
    G.f.enemy = null; G.f.spawnT = 0.2;
    log(`Raiding ${v.name}! Guards ahead.`, '#ffd23f'); UI.refreshHunt();
  };

  function finishRaid() {
    const v = G.f.raid.v; G.f.raid = null;
    let opened = 0;
    for (const c of v.chests) {
      if (c.t > 0) continue; opened++; c.t = 150;
      const st = G.st, big = c.big;
      const coins = Math.round(ri(30, 70) * (big ? 3 : 1) * (1 + 0.15 * (v.lvl - 1)) * st.coinMul);
      G.s.coins += coins; log(`${big ? 'Treasure chest' : 'Chest'}: +${coins}c`, '#ffd23f');
      const pool = Object.keys(ITEMS).filter(k => ITEMS[k].slot !== 'consumable');
      const n = ri(1, 3) + (big ? 2 : 0);
      for (let i = 0; i < n; i++) give(pool[ri(0, pool.length - 1)], rollRarity((big ? 0.38 : 0.3) * st.luck, big ? 7 : 6), v.name);
      if (Math.random() < 0.6) give('health_potion', 0, v.name);
    }
    UI.toast(`Raid on ${v.name} complete! ${opened} chest${opened === 1 ? '' : 's'} looted.`, '#ffd23f');
    G.dirty = true; UI.refreshHunt();
  }

  function killEnemy() {
    const f = G.f, S = G.s, st = G.st, e = f.enemy, d = e.def;
    f.enemy = null; f.spawnT = 0.5; S.kills++; S.mobKills[e.type] = (S.mobKills[e.type] || 0) + 1;
    const c = Math.max(1, Math.round(ri(d.coins[0], d.coins[1]) * (1 + 0.12 * (e.lvl - 1)) * st.coinMul));
    S.coins += c; log(`Defeated ${d.name} Lv${e.lvl}: +${c}c`, '#ffd23f');
    const lf = 1 + 0.05 * (e.lvl - 1);
    for (const [id, ch] of d.drops) {
      if (Math.random() < ch * st.luck * lf) {
        const r = ITEMS[id].slot === 'consumable' ? 0 : rollRarity(0.2 * st.luck * (1 + 0.06 * (e.lvl - 1)), 4);
        give(id, r, d.name);
      }
    }
    if (f.raid && !f.raid.queue.length) finishRaid();
    G.dirty = true;
  }
  function die() {
    const f = G.f, S = G.s, lost = Math.floor(S.coins * 0.2);
    S.coins -= lost; S.hp = 0; f.dead = 4; f.enemy = null;
    log(`You were defeated and lost ${lost}c.${f.raid ? ' The raid failed.' : ''}`, '#ff7777');
    UI.toast('You were defeated!', '#ff7777'); f.raid = null; UI.refreshHunt();
  }

  function tick(dt) {
    const S = G.s, st = G.st, f = G.f; G.time += dt; S.t += dt;
    for (const v of VILLAGES) for (const c of v.chests) if (c.t > 0) c.t -= dt;
    if (f.dead > 0) { f.dead -= dt; if (f.dead <= 0) { S.hp = st.maxHp; log('You recovered.', '#5df08a'); UI.refreshHunt(); } return; }
    f.hurt = Math.max(0, f.hurt - dt);
    S.hp = Math.min(st.maxHp, S.hp + st.regen * (f.hurt > 0 ? 0.3 : 1) * dt);
    if (!f.enemy) {
      f.spawnT -= dt;
      if (f.spawnT <= 0) {
        if (f.raid) f.enemy = newEnemy(f.raid.queue.shift(), f.raid.v.lvl);
        else if (S.target) f.enemy = newEnemy(S.target, S.depth);
        if (f.enemy) { f.pAtk = st.cd * 0.5; f.eAtk = f.enemy.def.atkcd || 1; }
      }
      return;
    }
    const e = f.enemy;
    f.pAtk -= dt;
    if (f.pAtk <= 0) {
      f.pAtk += st.cd;
      const crit = Math.random() < st.crit, dmg = st.dmg * (0.9 + Math.random() * 0.2) * (crit ? 2 : 1);
      e.hp -= dmg; f.last = { dmg, crit };
      if (e.hp <= 0) { killEnemy(); return; }
    }
    if (e.def.dmg > 0) {
      f.eAtk -= dt;
      if (f.eAtk <= 0) {
        f.eAtk += e.def.atkcd; S.hp -= e.dmg * (0.9 + Math.random() * 0.2); f.hurt = 3;
        if (S.hp <= 0) die();
      }
    }
  }

  /* ---------- save / start ---------- */
  function save() {
    if (!G.running) return;
    try { const S = G.s; localStorage.setItem(SAVE, JSON.stringify({ cls: S.cls, coins: S.coins, kills: S.kills, t: S.t, hp: S.hp, depth: S.depth, target: S.target, mobKills: S.mobKills, inv: S.inv, eq: S.eq })); } catch (e) {}
  }
  addEventListener('beforeunload', save);
  G.hasSave = () => { try { return !!localStorage.getItem(SAVE); } catch (e) { return false; } };
  G.clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) {} };
  G.saveClass = () => { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.cls; } catch (e) { return null; } };
  G.togglePause = () => { G.paused = !G.paused; UI.paused && UI.paused(G.paused); };

  G.start = (cls, load) => {
    let s = null;
    if (load) { try { s = JSON.parse(localStorage.getItem(SAVE)); } catch (e) {} if (!s || !CLASSES[s.cls]) return false; }
    else {
      s = { cls, coins: 0, kills: 0, t: 0, depth: 1, target: 'zombie', mobKills: {}, inv: new Array(INV).fill(null),
            eq: { weapon: { id: CLASSES[cls].start, r: 0 }, armor: null, boots: null, charm: null } };
      s.inv[0] = { id: 'health_potion', r: 0, n: 2 };
    }
    while (s.inv.length < INV) s.inv.push(null);
    s.t = s.t || 0; s.depth = s.depth || 1; s.mobKills = s.mobKills || {}; s.coins = s.coins || 0; s.kills = s.kills || 0;
    if (s.target === undefined) s.target = 'zombie';
    G.s = s; G.st = calcStats(); if (s.hp == null) s.hp = G.st.maxHp; s.hp = Math.min(Math.max(s.hp, 1), G.st.maxHp);
    G.f = { enemy: null, raid: null, spawnT: 0.3, pAtk: 0, eAtk: 0, hurt: 0, dead: 0, log: [], last: null };
    for (const v of VILLAGES) for (const c of v.chests) c.t = 0;
    log('Your adventure begins on the plains.', '#cfcfcf');
    G.running = true; UI.started(s); return true;
  };

  /* ---------- main loop ---------- */
  let last = 0, acc = 0, fpsN = 0, fpsT = 0, uiT = 0, saveT = 0;
  function frame(t) {
    const dt = Math.min(0.25, (t - last) / 1000); last = t;
    fpsN++; fpsT += dt; if (fpsT >= 1) { UI.fps(Math.round(fpsN / fpsT)); fpsN = 0; fpsT = 0; }
    if (G.running && !G.paused && !UI.modalOpen()) {
      acc += dt; let n = 0;
      while (acc >= STEP && n < 6) { tick(STEP); acc -= STEP; n++; }
      if (n === 6) acc = 0;
      uiT += dt; saveT += dt;
      if (uiT >= 0.1) { uiT = 0; UI.update(); if (G.dirty) { G.dirty = false; UI.refresh(); } }
      if (saveT >= 5) { saveT = 0; save(); }
    }
    requestAnimationFrame(frame);
  }
  addEventListener('keydown', e => {
    if (!G.running || UI.modalOpen() || e.repeat) return;
    if (e.code === 'KeyQ') G.quickPotion();
    if (e.code === 'KeyP') G.togglePause();
  });
  addEventListener('load', () => { last = performance.now(); requestAnimationFrame(frame); });
})();
