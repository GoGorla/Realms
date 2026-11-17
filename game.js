'use strict';
/* ===== Plains world engine ===== */
(() => {
  const WORLD = 3600, SPAWN = { x: 1800, y: 1800 }, SAFE_R = 320, INV = 22, TAU = Math.PI * 2;
  const SAVE = 'plains_rpg_save_v1';
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const mm = document.getElementById('minimap'), mctx = mm.getContext('2d');
  let vw = 0, vh = 0;
  function resize() { cv.width = vw = innerWidth; cv.height = vh = innerHeight; }
  addEventListener('resize', resize); resize();

  const EMO = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const rr = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => Math.floor(rr(a, b + 1));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function seeded(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const sr = seeded(1337);

  /* ---------- world layout ---------- */
  const VILLAGES = [
    { name: 'Oakvale', x: 700, y: 700 }, { name: 'Millbrook', x: 2900, y: 800 },
    { name: 'Stonehaven', x: 800, y: 2900 }, { name: "Raven's Rest", x: 2800, y: 2900 },
    { name: 'Northwatch', x: 1800, y: 560 }, { name: 'Westfield', x: 560, y: 1800 }
  ].map(v => {
    const houses = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + 0.3, rad = 120 + (i % 2) * 40;
      houses.push({ x: v.x + Math.cos(a) * rad, y: v.y + Math.sin(a) * rad, w: 58, h: 44, roof: ['#b5472f', '#a3562a', '#8c3b3b'][i % 3] });
    }
    const chests = [
      { x: v.x + 28, y: v.y + 14, open: false, t: 0, big: false },
      { x: v.x - 38, y: v.y - 26, open: false, t: 0, big: false },
      { x: v.x + 4, y: v.y + 78, open: false, t: 0, big: true }
    ];
    return { ...v, houses, chests, spawnT: 0, r: 240 };
  });

  const SHOPS = [
    { name: 'Crossroads Quarter', x: 1960, y: 1860 }, { name: 'Northgate Quarter', x: 1200, y: 1250 },
    { name: 'Eastfield Quarter', x: 2500, y: 1300 }, { name: 'Southmarket Quarter', x: 1250, y: 2500 },
    { name: 'Hilltop Quarter', x: 2550, y: 2450 }, { name: 'Lakeside Quarter', x: 1800, y: 1050 }
  ].map(s => ({ ...s, stock: null, stockT: -999 }));

  const TREES = [];
  for (let i = 0; i < 400; i++) {
    const x = sr() * WORLD, y = sr() * WORLD;
    if (Math.hypot(x - SPAWN.x, y - SPAWN.y) < 280) continue;
    if (VILLAGES.some(v => Math.hypot(x - v.x, y - v.y) < 270)) continue;
    if (SHOPS.some(s => Math.hypot(x - s.x, y - s.y) < 110)) continue;
    TREES.push({ x, y, s: 30 + sr() * 18, e: sr() < 0.8 ? '🌳' : '🌲' });
  }

  /* ---------- state ---------- */
  const G = window.Game = { s: null, st: null, running: false, time: 0 };
  let mobs = [], drops = [], projs = [], fx = [], pops = [];
  const keys = {};
  let spawnT = 0, hudT = 0, saveT = 0, toastT = 0, lastFullMsg = -99;

  addEventListener('keydown', e => {
    if (UI.modalOpen && UI.modalOpen()) { if (e.code === 'Escape') UI.closeModal(); return; }
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'KeyE' && G.running && !e.repeat) interact();
    if (e.code === 'KeyQ' && G.running && !e.repeat) quickPotion();
    if (e.code === 'Escape') UI.clearSelection && UI.clearSelection();
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  addEventListener('beforeunload', () => save());

  /* ---------- stats ---------- */
  function calcStats() {
    const S = G.s, pk = CLASSES[S.cls].perks, m = k => pk[k] || 1;
    let hp = 0, spd = 0, luck = 0, coin = 0, regen = 0;
    for (const slot of ['armor', 'boots', 'charm']) {
      const it = S.eq[slot]; if (!it) continue;
      const st = itemStats(it.id, it.r);
      hp += st.hp; spd += st.spd; luck += st.luck; coin += st.coin; regen += st.regen;
    }
    let dmg = 4, cd = 0.6, range = 42, elem = false, proj = false, pcolor = '#fff';
    const w = S.eq.weapon;
    if (w) { const d = ITEMS[w.id]; dmg = d.dmg * RARITIES[w.r].mult; cd = d.cd; range = d.range; elem = !!d.elem; proj = !!d.proj; pcolor = d.pcolor || '#fff'; }
    dmg *= elem ? m('elemental') : m('weapon');
    return {
      maxHp: Math.round(100 * m('health') + hp), speed: 190 * (1 + spd), luck: m('luck') * (1 + luck),
      coinMul: 1 + coin, regen: 2 * m('regen') + regen, cd: cd / m('speed'),
      crit: Math.min(0.95, m('phys') / 15), dmg, range, elem, proj, pcolor
    };
  }
  G.stats = () => G.st;
  G.recalc = () => {
    const old = G.st ? G.st.maxHp : 0; G.st = calcStats();
    const p = G.s.p; if (old && G.st.maxHp > old) p.hp += G.st.maxHp - old;
    p.hp = Math.min(p.hp, G.st.maxHp);
  };

  /* ---------- inventory ---------- */
  function addItem(id, r, n = 1) {
    const inv = G.s.inv;
    for (const st of inv) if (st && st.id === id && st.r === r) { st.n += n; return true; }
    const i = inv.indexOf(null); if (i < 0) return false;
    inv[i] = { id, r, n }; return true;
  }
  G.addItem = addItem;
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
    if (G.s.p.hp >= G.st.maxHp) { UI.toast('Already at full health', '#aaa'); return; }
    G.s.p.hp = Math.min(G.st.maxHp, G.s.p.hp + d.heal); take(i);
    pop(G.s.p.x, G.s.p.y - 24, '+' + d.heal, '#5df08a'); UI.refresh();
  };
  function quickPotion() { const i = G.s.inv.findIndex(s => s && s.id === 'health_potion'); if (i >= 0) G.use(i); else UI.toast('No potions', '#aaa'); }
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
      pop(G.s.p.x, G.s.p.y - 30, '✨ ' + RARITIES[r + 1].name, RARITIES[r + 1].color);
    } else {
      UI.toast(`Crafting failed (${(chance * 100).toFixed(chance < 0.01 ? 1 : 0)}% chance) — 5 items lost`, '#ff7777');
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
    UI.refresh(); UI.renderShop && UI.renderShop();
  };

  /* ---------- mobs ---------- */
  const typeBag = []; for (const k in MOBS) if (k !== 'villager') for (let i = 0; i < MOBS[k].weight; i++) typeBag.push(k);
  const lvlAt = (x, y) => 1 + Math.floor(Math.hypot(x - SPAWN.x, y - SPAWN.y) / 450);

  function spawnMob(type, x, y, vill) {
    const d = MOBS[type], lvl = lvlAt(x, y);
    const hp = d.hp * (1 + 0.35 * (lvl - 1));
    mobs.push({ type, def: d, x, y, hp, maxHp: hp, dmg: d.dmg * (1 + 0.25 * (lvl - 1)), lvl, atkT: rr(0, 1),
                wt: 0, dx: 0, dy: 0, flash: 0, aggro: false, vill: vill || null, dead: false });
  }
  function fillVillage(v, full) {
    const vs = mobs.filter(m => m.vill === v);
    const nV = vs.filter(m => m.type === 'villager').length, nG = vs.filter(m => m.type === 'soldier').length;
    const pos = () => { const a = rr(0, TAU), r = rr(20, 150); return [v.x + Math.cos(a) * r, v.y + Math.sin(a) * r]; };
    if (nV < 4) { const n = full ? 4 - nV : 1; for (let i = 0; i < n; i++) spawnMob('villager', ...pos(), v); }
    if (nG < 2) { const n = full ? 2 - nG : 1; for (let i = 0; i < n; i++) spawnMob('soldier', ...pos(), v); }
  }
  const inSafe = p => Math.hypot(p.x - SPAWN.x, p.y - SPAWN.y) < SAFE_R;
  function ambientSpawn() {
    const p = G.s.p;
    for (let tries = 0; tries < 8; tries++) {
      const x = rr(60, WORLD - 60), y = rr(60, WORLD - 60);
      if (Math.hypot(x - p.x, y - p.y) < 520) continue;
      if (Math.hypot(x - SPAWN.x, y - SPAWN.y) < SAFE_R + 60) continue;
      if (SHOPS.some(s => Math.hypot(x - s.x, y - s.y) < 160)) continue;
      if (VILLAGES.some(v => Math.hypot(x - v.x, y - v.y) < v.r)) continue;
      spawnMob(typeBag[ri(0, typeBag.length - 1)], x, y); return;
    }
  }

  function hurtPlayer(d) {
    const p = G.s.p; p.hp -= d; p.hurtT = 3; p.flash = 0.15;
    pop(p.x, p.y - 26, '-' + Math.round(d), '#ff5252');
    if (p.hp <= 0) die();
  }
  function die() {
    const S = G.s, p = S.p, lost = Math.floor(S.coins * 0.2);
    S.coins -= lost; p.x = SPAWN.x; p.y = SPAWN.y; p.hp = G.st.maxHp; p.hurtT = 0;
    for (const m of mobs) m.aggro = false;
    UI.toast(`You died and lost ${lost} coins. Respawned at camp.`, '#ff7777'); UI.refresh();
  }
  function pop(x, y, txt, color) { pops.push({ x: x + rr(-8, 8), y, txt, color, life: 0.9 }); }

  function hitMob(m, dmg, crit) {
    m.hp -= dmg; m.flash = 0.12; m.aggro = true;
    pop(m.x, m.y - m.def.size - 8, Math.round(dmg) + (crit ? '!' : ''), crit ? '#ffd23f' : '#fff');
    if (m.hp <= 0 && !m.dead) killMob(m);
  }
  function dropCoin(x, y, v) { drops.push({ kind: 'coin', x: x + rr(-20, 20), y: y + rr(-20, 20), v, life: 120 }); }
  function dropItem(x, y, id, r) { drops.push({ kind: 'item', id, r, x: x + rr(-26, 26), y: y + rr(-26, 26), life: 90 }); }
  function killMob(m) {
    m.dead = true; G.s.kills++;
    const d = m.def, st = G.st;
    const c = Math.max(1, Math.round(ri(d.coins[0], d.coins[1]) * (1 + 0.12 * (m.lvl - 1)) * st.coinMul));
    dropCoin(m.x, m.y, c);
    const lf = 1 + 0.05 * (m.lvl - 1);
    for (const [id, ch] of d.drops) {
      if (Math.random() < ch * st.luck * lf) {
        const r = ID_POTION(id) ? 0 : rollRarity(0.2 * st.luck * (1 + 0.06 * (m.lvl - 1)), 4);
        dropItem(m.x, m.y, id, r);
      }
    }
  }
  const ID_POTION = id => ITEMS[id].slot === 'consumable';

  /* ---------- chests / interaction ---------- */
  function openChest(v, c) {
    c.open = true; c.t = 150;
    const st = G.st, lvl = lvlAt(v.x, v.y), big = c.big;
    const coins = Math.round(ri(30, 70) * (big ? 3 : 1) * (1 + 0.15 * (lvl - 1)) * st.coinMul);
    for (let i = 0; i < (big ? 6 : 3); i++) dropCoin(c.x, c.y, Math.ceil(coins / (big ? 6 : 3)));
    const pool = Object.keys(ITEMS).filter(k => !ID_POTION(k));
    const n = ri(1, 3) + (big ? 2 : 0);
    for (let i = 0; i < n; i++) {
      const id = pool[ri(0, pool.length - 1)];
      dropItem(c.x, c.y, id, rollRarity((big ? 0.38 : 0.3) * st.luck, big ? 7 : 6));
    }
    if (Math.random() < 0.6) dropItem(c.x, c.y, 'health_potion', 0);
    UI.toast(big ? `You raided the ${v.name} treasure chest!` : `Chest opened in ${v.name}`, '#ffd23f');
  }
  function nearestInteract() {
    const p = G.s.p; let best = null, bd = 9999;
    for (const s of SHOPS) { const d = dist(p, s); if (d < 90 && d < bd) { bd = d; best = { type: 'shop', obj: s }; } }
    for (const v of VILLAGES) for (const c of v.chests) { const d = dist(p, c); if (!c.open && d < 60 && d < bd) { bd = d; best = { type: 'chest', obj: c, v }; } }
    return best;
  }
  function interact() {
    const n = nearestInteract(); if (!n) return;
    if (n.type === 'shop') { G.shopStock(n.obj); UI.openShop(n.obj); }
    else openChest(n.v, n.obj);
  }

  /* ---------- combat ---------- */
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return Math.abs(d); };
  function playerAttack() {
    const p = G.s.p, st = G.st; let best = null, bd = 1e9;
    for (const m of mobs) { if (m.dead) continue; const d = dist(m, p) - m.def.size; if (d <= st.range && d < bd) { bd = d; best = m; } }
    if (!best) return false;
    const ang = Math.atan2(best.y - p.y, best.x - p.x); p.face = ang;
    const crit = Math.random() < st.crit, dmg = st.dmg * (0.9 + Math.random() * 0.2) * (crit ? 2 : 1);
    if (st.proj) {
      projs.push({ x: p.x, y: p.y, vx: Math.cos(ang) * 560, vy: Math.sin(ang) * 560, dmg, crit, own: 'p', life: st.range / 560 + 0.2, color: st.pcolor, r: 7 });
    } else {
      fx.push({ x: p.x, y: p.y, ang, range: st.range, life: 0.18, max: 0.18, color: st.elem ? '#c58cff' : '#ffffff' });
      for (const m of mobs) {
        if (m.dead) continue;
        const dd = dist(m, p) - m.def.size;
        if (dd <= st.range && angDiff(Math.atan2(m.y - p.y, m.x - p.x), ang) < 1.0) hitMob(m, dmg, crit);
      }
    }
    return true;
  }

  function updateMob(m, dt) {
    const p = G.s.p, d = m.def, dp = dist(m, p) || 1;
    m.atkT -= dt; m.flash -= dt;
    const tx = (p.x - m.x) / dp, ty = (p.y - m.y) / dp;
    let mx = 0, my = 0, sp = d.spd, wander = false;
    if (inSafe(p)) m.aggro = false;
    if (d.flee) {
      if (dp < 200 || m.aggro) { mx = -tx; my = -ty; sp = d.spd * 1.25; } else wander = true;
    } else if (!inSafe(p) && (m.aggro || dp < d.aggro)) {
      m.aggro = true;
      if (dp > d.aggro * 2.5) m.aggro = false;
      if (d.ranged) {
        if (dp > d.range * 0.85) { mx = tx; my = ty; }
        else if (dp < d.range * 0.5) { mx = -tx; my = -ty; sp = d.spd * 0.7; }
        if (dp <= d.range && m.atkT <= 0) {
          projs.push({ x: m.x, y: m.y, vx: tx * 290, vy: ty * 290, dmg: m.dmg, own: 'm', life: 2, color: d.pcolor, r: 6 });
          m.atkT = d.atkcd;
        }
      } else {
        if (dp > d.reach + 14) { mx = tx; my = ty; }
        else if (m.atkT <= 0) { hurtPlayer(m.dmg); m.atkT = d.atkcd; }
      }
    } else wander = true;
    if (wander) {
      m.wt -= dt;
      if (m.wt <= 0) { m.wt = rr(1, 3); if (Math.random() < 0.35) { m.dx = 0; m.dy = 0; } else { const a = rr(0, TAU); m.dx = Math.cos(a); m.dy = Math.sin(a); } }
      mx = m.dx; my = m.dy; sp = d.spd * 0.4;
      if (m.vill) { const dv = dist(m, m.vill); if (dv > 220) { mx = (m.vill.x - m.x) / dv; my = (m.vill.y - m.y) / dv; } }
    }
    m.x = clamp(m.x + mx * sp * dt, 20, WORLD - 20); m.y = clamp(m.y + my * sp * dt, 20, WORLD - 20);
  }

  /* ---------- update ---------- */
  function update(dt) {
    const S = G.s, p = S.p, st = G.st; G.time += dt;
    const ax = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    const ay = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0);
    if (ax || ay) { const l = Math.hypot(ax, ay); p.x += ax / l * st.speed * dt; p.y += ay / l * st.speed * dt; p.face = Math.atan2(ay, ax); }
    p.x = clamp(p.x, 20, WORLD - 20); p.y = clamp(p.y, 20, WORLD - 20);
    p.hurtT = Math.max(0, p.hurtT - dt); p.flash = Math.max(0, (p.flash || 0) - dt);
    p.hp = Math.min(st.maxHp, p.hp + st.regen * (p.hurtT > 0 ? 0.3 : 1) * dt);

    p.atkT -= dt;
    if (p.atkT <= 0) { if (playerAttack()) p.atkT = st.cd; else p.atkT = 0; }

    for (const m of mobs) updateMob(m, dt);
    mobs = mobs.filter(m => !m.dead);

    for (const q of projs) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.own === 'p') {
        for (const m of mobs) if (!m.dead && Math.hypot(m.x - q.x, m.y - q.y) < m.def.size + q.r) { hitMob(m, q.dmg, q.crit); q.life = 0; break; }
      } else if (Math.hypot(p.x - q.x, p.y - q.y) < 18 + q.r) { hurtPlayer(q.dmg); q.life = 0; }
    }
    projs = projs.filter(q => q.life > 0);

    for (const dr of drops) {
      dr.life -= dt; const d = dist(dr, p);
      if (d < 120 && d > 24) { const s = 330 * dt; dr.x += (p.x - dr.x) / d * s; dr.y += (p.y - dr.y) / d * s; }
      if (d < 30) {
        if (dr.kind === 'coin') { S.coins += dr.v; dr.life = 0; pop(p.x, p.y - 30, '+' + dr.v + '🪙', '#ffd23f'); }
        else if (addItem(dr.id, dr.r)) { dr.life = 0; pop(p.x, p.y - 36, ITEMS[dr.id].icon + ' ' + RARITIES[dr.r].name, RARITIES[dr.r].color); UI.refresh(); }
        else if (G.time - lastFullMsg > 3) { lastFullMsg = G.time; UI.toast('Inventory full', '#ff7777'); }
      }
    }
    drops = drops.filter(d => d.life > 0);

    for (const f of fx) f.life -= dt; fx = fx.filter(f => f.life > 0);
    for (const o of pops) { o.life -= dt; o.y -= 30 * dt; } pops = pops.filter(o => o.life > 0);

    spawnT -= dt;
    if (spawnT <= 0 && mobs.filter(m => !m.vill).length < 75) { ambientSpawn(); spawnT = 0.35; }
    for (const v of VILLAGES) {
      v.spawnT -= dt; if (v.spawnT <= 0) { fillVillage(v, false); v.spawnT = 12; }
      for (const c of v.chests) if (c.open) { c.t -= dt; if (c.t <= 0) c.open = false; }
    }

    const n = nearestInteract();
    UI.prompt(n ? (n.type === 'shop' ? `Press E — ${n.obj.name} (shop)` : (n.obj.big ? 'Press E — raid the treasure chest' : 'Press E — open chest')) : '');
    hudT -= dt; if (hudT <= 0) { hudT = 0.1; UI.hud(S, st); }
    saveT -= dt; if (saveT <= 0) { saveT = 5; save(); }
  }

  /* ---------- save / start ---------- */
  function save() {
    if (!G.running) return;
    try { const S = G.s; localStorage.setItem(SAVE, JSON.stringify({ cls: S.cls, coins: S.coins, kills: S.kills, inv: S.inv, eq: S.eq, p: { x: S.p.x, y: S.p.y, hp: S.p.hp } })); } catch (e) {}
  }
  G.hasSave = () => { try { return !!localStorage.getItem(SAVE); } catch (e) { return false; } };
  G.clearSave = () => { try { localStorage.removeItem(SAVE); } catch (e) {} };
  G.saveClass = () => { try { const s = JSON.parse(localStorage.getItem(SAVE)); return s && s.cls; } catch (e) { return null; } };

  G.start = (cls, load) => {
    let s = null;
    if (load) { try { s = JSON.parse(localStorage.getItem(SAVE)); } catch (e) {} if (!s || !CLASSES[s.cls]) return false; }
    else {
      s = { cls, coins: 0, kills: 0, inv: new Array(INV).fill(null), eq: { weapon: { id: CLASSES[cls].start, r: 0 }, armor: null, boots: null, charm: null }, p: {} };
      s.inv[0] = { id: 'health_potion', r: 0, n: 2 };
    }
    while (s.inv.length < INV) s.inv.push(null);
    const p = s.p; p.x = p.x ?? SPAWN.x; p.y = p.y ?? SPAWN.y + 60; p.face = 0; p.atkT = 0; p.hurtT = 0; p.flash = 0;
    G.s = s; G.st = calcStats(); p.hp = p.hp ?? G.st.maxHp; p.hp = Math.min(p.hp, G.st.maxHp);
    mobs = []; drops = []; projs = []; fx = []; pops = [];
    for (const v of VILLAGES) { v.spawnT = 12; for (const c of v.chests) c.open = false; fillVillage(v, true); }
    for (let i = 0; i < 45; i++) ambientSpawn();
    G.running = true; UI.started(s); return true;
  };

  /* ---------- rendering ---------- */
  function emoji(txt, x, y, size) { ctx.font = `${size}px ${EMO}`; ctx.fillText(txt, x, y); }
  function bar(x, y, w, frac, col) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 6);
    ctx.fillStyle = col; ctx.fillRect(x - w / 2, y, w * clamp(frac, 0, 1), 4);
  }

  function render() {
    const S = G.s, p = S.p;
    const cx = p.x - vw / 2, cy = p.y - vh / 2;
    const vis = (x, y, pad = 80) => x > cx - pad && x < cx + vw + pad && y > cy - pad && y < cy + vh + pad;
    ctx.fillStyle = '#1b3514'; ctx.fillRect(0, 0, vw, vh);
    ctx.save(); ctx.translate(-Math.round(cx), -Math.round(cy));
    const T = 80, tCols = ['#4a8c38', '#4f9340', '#468535'];
    for (let ty = Math.floor(cy / T); ty <= Math.floor((cy + vh) / T); ty++)
      for (let tx = Math.floor(cx / T); tx <= Math.floor((cx + vw) / T); tx++) {
        if (tx < 0 || ty < 0 || tx * T >= WORLD || ty * T >= WORLD) continue;
        ctx.fillStyle = tCols[(((tx * 73856093) ^ (ty * 19349663)) >>> 0) % 3]; ctx.fillRect(tx * T, ty * T, T + 1, T + 1);
      }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    // camp
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.arc(SPAWN.x, SPAWN.y, SAFE_R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    emoji('🏕️', SPAWN.x, SPAWN.y, 44);

    // villages
    for (const v of VILLAGES) {
      if (!vis(v.x, v.y, 320)) continue;
      ctx.fillStyle = 'rgba(140,115,70,.45)'; ctx.beginPath(); ctx.arc(v.x, v.y, 200, 0, TAU); ctx.fill();
      for (const h of v.houses) {
        ctx.fillStyle = '#d8c19a'; ctx.fillRect(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h);
        ctx.fillStyle = h.roof; ctx.beginPath(); ctx.moveTo(h.x - h.w / 2 - 6, h.y - h.h / 2); ctx.lineTo(h.x, h.y - h.h / 2 - 24); ctx.lineTo(h.x + h.w / 2 + 6, h.y - h.h / 2); ctx.fill();
        ctx.fillStyle = '#5b3a1f'; ctx.fillRect(h.x - 6, h.y + h.h / 2 - 18, 12, 18);
      }
      ctx.fillStyle = '#fff'; ctx.font = `bold 16px sans-serif`; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
      ctx.strokeText(v.name, v.x, v.y - 200); ctx.fillText(v.name, v.x, v.y - 200);
      for (const c of v.chests) emoji(c.open ? '📦' : (c.big ? '💰' : '🧰'), c.x, c.y, c.big ? 34 : 28);
    }
    // shops
    for (const s of SHOPS) {
      if (!vis(s.x, s.y, 200)) continue;
      ctx.fillStyle = '#7b4bb3'; ctx.fillRect(s.x - 46, s.y - 30, 92, 60);
      ctx.fillStyle = '#e0a82e'; ctx.fillRect(s.x - 52, s.y - 38, 104, 14);
      emoji('🏪', s.x, s.y + 2, 38);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
      ctx.strokeText(s.name, s.x, s.y - 52); ctx.fillText(s.name, s.x, s.y - 52);
    }
    // trees
    for (const t of TREES) if (vis(t.x, t.y, 60)) emoji(t.e, t.x, t.y, t.s);

    // drops
    for (const d of drops) {
      if (!vis(d.x, d.y)) continue;
      if (d.kind === 'coin') emoji('🪙', d.x, d.y, 18);
      else {
        ctx.fillStyle = RARITIES[d.r].color; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(d.x, d.y, 15, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
        emoji(ITEMS[d.id].icon, d.x, d.y, 20);
      }
    }
    // mobs
    for (const m of mobs) {
      if (!vis(m.x, m.y)) continue;
      const sz = m.def.size * 1.7;
      if (m.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(m.x, m.y, m.def.size, 0, TAU); ctx.fill(); }
      emoji(m.def.icon, m.x, m.y, sz);
      if (m.hp < m.maxHp || m.aggro) bar(m.x, m.y - m.def.size - 10, 34, m.hp / m.maxHp, m.type === 'villager' ? '#7ad06a' : '#e5484d');
      if (m.type !== 'villager') { ctx.fillStyle = '#fff'; ctx.font = '11px sans-serif'; ctx.fillText('Lv' + m.lvl, m.x, m.y - m.def.size - 18); }
    }
    // projectiles
    for (const q of projs) { ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.stroke(); }
    // slashes
    for (const f of fx) {
      const k = f.life / f.max; ctx.strokeStyle = f.color; ctx.globalAlpha = k; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(f.x, f.y, Math.min(f.range, 70), f.ang - 0.9 + (1 - k) * 0.5, f.ang + 0.9 - (1 - k) * 0.5); ctx.stroke(); ctx.globalAlpha = 1;
    }
    // player
    const cls = CLASSES[S.cls];
    ctx.fillStyle = p.flash > 0 ? '#fff' : cls.color; ctx.beginPath(); ctx.arc(p.x, p.y, 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(p.face) * 26, p.y + Math.sin(p.face) * 26); ctx.stroke();
    emoji(cls.icon, p.x, p.y + 1, 18);
    bar(p.x, p.y - 30, 40, p.hp / G.st.maxHp, '#5df08a');
    // pops
    ctx.font = 'bold 15px sans-serif'; ctx.lineWidth = 3;
    for (const o of pops) { ctx.globalAlpha = Math.min(1, o.life * 2); ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.fillStyle = o.color; ctx.strokeText(o.txt, o.x, o.y); ctx.fillText(o.txt, o.x, o.y); }
    ctx.globalAlpha = 1;
    ctx.restore();
    renderMinimap(p);
  }

  function renderMinimap(p) {
    const w = mm.width, k = w / WORLD;
    mctx.clearRect(0, 0, w, w); mctx.fillStyle = 'rgba(30,70,25,.85)'; mctx.fillRect(0, 0, w, w);
    mctx.fillStyle = '#c7a46a'; for (const v of VILLAGES) { mctx.beginPath(); mctx.arc(v.x * k, v.y * k, 5, 0, TAU); mctx.fill(); }
    mctx.fillStyle = '#f2c230'; for (const s of SHOPS) mctx.fillRect(s.x * k - 3, s.y * k - 3, 6, 6);
    mctx.fillStyle = '#4da6ff'; mctx.fillRect(SPAWN.x * k - 3, SPAWN.y * k - 3, 6, 6);
    mctx.fillStyle = 'rgba(255,70,70,.8)'; for (const m of mobs) if (m.type !== 'villager' && Math.hypot(m.x - p.x, m.y - p.y) < 700) mctx.fillRect(m.x * k - 1, m.y * k - 1, 2, 2);
    mctx.fillStyle = '#fff'; mctx.beginPath(); mctx.arc(p.x * k, p.y * k, 3.5, 0, TAU); mctx.fill();
  }

  let last = performance.now();
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (G.running) { if (!UI.modalOpen()) update(dt); render(); }
    else { ctx.fillStyle = '#2f5d25'; ctx.fillRect(0, 0, vw, vh); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
