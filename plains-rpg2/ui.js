'use strict';
/* ===== Sidebar, tabs, quarter-circle loadout, item panel, class select ===== */
const UI = window.UI = {};
(() => {
  const $ = id => document.getElementById(id);
  const RINGS = [{ r: 100, n: 4, eq: true }, { r: 145, n: 6 }, { r: 190, n: 7 }, { r: 235, n: 9 }];
  const EQ = ['weapon', 'armor', 'boots', 'charm'];
  const EQ_ICON = { weapon: '⚔️', armor: '🛡️', boots: '👢', charm: '🍀' };
  const EQ_NAME = { weapon: 'Weapon', armor: 'Armor', boots: 'Boots', charm: 'Charm' };
  const BOX = 270, SLOT = 34;
  let sel = null, curTab = 'hunt', shopIdx = 0;
  const rc = r => RARITIES[r].color;
  const flat = a => a.join(' · ').replace(/&nbsp;/g, ' ');

  /* ---------- currency: 100c = 1s, 100s = 1g ---------- */
  function coinHTML(n) {
    n = Math.max(0, Math.floor(n)); const g = Math.floor(n / 10000), s = Math.floor(n / 100) % 100, c = n % 100; let h = '';
    if (g) h += `<span class="g">${g}g</span> `;
    if (g || s) h += `<span class="s">${s}s</span> `;
    return h + `<span class="c">${c}c</span>`;
  }
  function coinText(n) {
    n = Math.max(0, Math.floor(n)); const g = Math.floor(n / 10000), s = Math.floor(n / 100) % 100, c = n % 100;
    return (g ? g + 'g ' : '') + (g || s ? s + 's ' : '') + c + 'c';
  }

  /* ---------- loadout quarter circle (bottom-right) ---------- */
  function buildSlots() {
    const box = $('slots'); box.innerHTML = ''; let idx = 0;
    RINGS.forEach(ring => {
      for (let i = 0; i < ring.n; i++) {
        const th = (i + 0.5) / ring.n * Math.PI / 2;
        const d = document.createElement('div');
        d.className = 'slot';
        d.style.left = (BOX - ring.r * Math.cos(th) - SLOT / 2) + 'px';
        d.style.top = (BOX - ring.r * Math.sin(th) - SLOT / 2) + 'px';
        if (ring.eq) {
          const slot = EQ[i]; d.dataset.eq = slot;
          d.onclick = () => select({ src: 'eq', slot });
          d.ondblclick = () => Game.unequip(slot);
        } else {
          const k = idx++; d.dataset.inv = k;
          d.onclick = () => select({ src: 'inv', i: k });
          d.ondblclick = () => Game.equip(k);
        }
        box.appendChild(d);
      }
    });
  }
  function fillSlot(el, item, n, placeholder) {
    el.className = 'slot'; el.style.removeProperty('--rc'); el.title = '';
    if (!item) { el.innerHTML = placeholder ? `<span class="ph">${placeholder}</span>` : ''; return; }
    el.style.setProperty('--rc', rc(item.r));
    el.classList.add('filled'); if (item.r === 8) el.classList.add('eternal');
    el.title = itemName(item.id, item.r);
    el.innerHTML = `<span class="ic">${ITEMS[item.id].icon}</span>${n > 1 ? `<span class="cnt">${n}</span>` : ''}`;
  }
  function renderSlots() {
    if (!Game.s) return;
    document.querySelectorAll('.slot').forEach(el => {
      if (el.dataset.eq) fillSlot(el, Game.s.eq[el.dataset.eq], 1, EQ_ICON[el.dataset.eq]);
      else { const st = Game.s.inv[+el.dataset.inv]; fillSlot(el, st, st ? st.n : 0); }
      const on = sel && ((sel.src === 'eq' && el.dataset.eq === sel.slot) || (sel.src === 'inv' && el.dataset.inv == sel.i));
      el.classList.toggle('sel', !!on);
    });
  }

  /* ---------- item panel ---------- */
  function selected() {
    if (!sel || !Game.s) return null;
    if (sel.src === 'eq') { const it = Game.s.eq[sel.slot]; return it ? { id: it.id, r: it.r, n: 1 } : null; }
    return Game.s.inv[sel.i] || null;
  }
  function select(s) { sel = s; renderPanel(); renderSlots(); }
  UI.clearSelection = () => { sel = null; renderPanel(); renderSlots(); };
  function renderPanel() {
    const p = $('itempanel'), it = selected();
    if (!it) { p.classList.add('hidden'); sel = null; return; }
    const d = ITEMS[it.id], r = RARITIES[it.r], lines = itemLines(it.id, it.r);
    let html = `<div class="ip-head"><span class="ip-ic" style="border-color:${r.color}">${d.icon}</span><div><b style="color:${r.color}">${itemName(it.id, it.r)}</b><div class="dim">${d.slot}${sel.src === 'eq' ? ' (equipped)' : ''}</div></div></div>`;
    html += `<div class="ip-lines">${lines.join('<br>')}</div>`;
    const craftable = d.slot !== 'consumable' && it.r < RARITIES.length - 1;
    if (craftable && sel.src === 'inv') {
      const ch = r.craft * 100;
      html += `<div class="ip-craft">Craft: 5× ${r.name} → ${RARITIES[it.r + 1].name}<br>Chance ${ch < 1 ? ch.toFixed(1) : ch}% &nbsp; (have ${it.n}/5)</div>`;
    }
    html += '<div class="ip-btns"></div>';
    p.innerHTML = html; p.classList.remove('hidden');
    const b = p.querySelector('.ip-btns');
    const btn = (label, fn, cls = '') => { const e = document.createElement('button'); e.textContent = label; e.className = cls; e.onclick = fn; b.appendChild(e); };
    if (sel.src === 'eq') btn('Unequip', () => Game.unequip(sel.slot));
    else {
      if (d.slot === 'consumable') btn('Use (Q)', () => Game.use(sel.i));
      else btn('Equip', () => Game.equip(sel.i));
      if (craftable) btn('Craft ×5', () => Game.craft(sel.i), it.n >= 5 ? 'go' : 'off');
      btn(`Sell 1 (${coinText(sellPrice(it.id, it.r))})`, () => Game.sell(sel.i, false));
      if (it.n > 1) btn(`Sell all (${coinText(sellPrice(it.id, it.r) * it.n)})`, () => Game.sell(sel.i, true));
    }
  }

  /* ---------- sidebar ---------- */
  function buildSide() {
    $('sideBody').innerHTML =
      `<div class="s-age" id="sDay">Day 1</div>
       <div class="s-life" id="sClass"></div>
       <button class="s-pause" id="sPause">Pause</button>
       <div class="s-money" id="sMoney"></div>
       <div class="s-cap">Balance (in coins)</div>
       <div class="hp"><div id="sHpBar"></div><span id="sHpTxt"></span></div>
       <ul class="s-list">
         <li class="l1">Damage: <span id="sDmg"></span></li>
         <li class="l2">Crit chance: <span id="sCrit"></span></li>
         <li class="l4">Attacks/sec: <span id="sAps"></span></li>
         <li class="l5">Regen/sec: <span id="sReg"></span></li>
         <li class="l3">Kills: <span id="sKills"></span></li>
       </ul>
       <div class="s-big"><b>Luck:</b><span id="sLuck"></span></div>
       <div class="s-cap">Affects drop chance and rarity</div>`;
    $('sPause').onclick = () => Game.togglePause();
    UI.paused(Game.paused);
  }
  UI.paused = p => { const b = $('sPause'); if (b) b.textContent = p ? 'Play' : 'Pause'; };
  function hud() {
    const S = Game.s, st = Game.st; if (!S || !$('sDay')) return;
    const c = CLASSES[S.cls];
    $('sDay').textContent = 'Day ' + (Math.floor(S.t / Game.DAY) + 1);
    $('sClass').innerHTML = `<span style="color:${c.color}">${c.icon} ${c.name}</span>`;
    $('sMoney').innerHTML = coinHTML(S.coins);
    $('sHpBar').style.width = Math.max(0, S.hp / st.maxHp * 100) + '%';
    $('sHpTxt').textContent = `${Math.ceil(Math.max(0, S.hp))} / ${st.maxHp}`;
    $('sDmg').textContent = st.dmg.toFixed(1) + (st.elem ? ' (elemental)' : '');
    $('sCrit').textContent = (st.crit * 100).toFixed(1) + '%';
    $('sAps').textContent = (1 / st.cd).toFixed(2);
    $('sReg').textContent = st.regen.toFixed(1);
    $('sKills').textContent = S.kills;
    $('sLuck').textContent = ' ' + st.luck.toFixed(2) + 'x';
  }
  UI.fps = n => { $('fps').textContent = 'FPS: ' + n; };
  UI.toast = (msg, color = '#fff') => {
    const t = document.createElement('div'); t.className = 'toast'; t.style.borderColor = color; t.style.color = color; t.textContent = msg;
    const box = $('toasts'); box.appendChild(t);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => t.remove(), 3500);
  };

  /* ---------- table helpers ---------- */
  const tbl = (cls, heads, rows) => `<table class="pk ${cls}"><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr>${rows.join('')}</table>`;
  const itemBar = (id, fill, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.round(fill * 100)}%"></i><span>${ITEMS[id].icon} ${ITEMS[id].name}</span></div>`;
  const rarCell = r => `<td class="rar" style="color:${rc(r)}">${RARITIES[r].name}</td>`;

  /* ---------- Hunt tab ---------- */
  function renderHunt() {
    const S = Game.s, el = $('tab-hunt'); if (!S) { el.innerHTML = '<p class="dim">Choose a class to begin.</p>'; return; }
    const d = S.depth, maxD = Game.maxDepth();
    let h = `<div class="status" id="hStatus"></div>
      <div class="battle">
        <div class="fighter"><div class="nm" id="hName"></div><div class="hpb"><div id="hBar"></div><span id="hTxt"></span></div><div class="sub" id="hSub"></div></div>
        <div class="fighter foe"><div class="nm" id="eName"></div><div class="hpb"><div id="eBar"></div><span id="eTxt"></span></div><div class="sub" id="eSub"></div></div>
      </div>
      <div class="log" id="hLog"></div>
      <div class="depth">Depth: <button data-depth="-1" ${d <= 1 ? 'disabled' : ''}>−</button><b>${d}</b><button data-depth="1" ${d >= maxD ? 'disabled' : ''}>+</button>
        <span class="dim">Max depth ${maxD}. Every 30 kills unlocks one more. Deeper = tougher mobs, better loot.</span></div>`;
    const rows = Game.mobList.map(k => {
      const m = MOBS[k], active = S.target === k && !Game.f.raid;
      const hp = Math.round(m.hp * (1 + 0.35 * (d - 1))), dm = Math.round(m.dmg * (1 + 0.25 * (d - 1)));
      return `<tr><td><button class="barbtn" data-mob="${k}"><div class="bar ${active ? 'active' : ''}"><i style="width:0"></i><span>${m.icon} ${m.name}</span></div></button></td>` +
        `<td>${d}</td><td>${hp}</td><td>${m.dmg ? dm : '-'}</td><td>${m.coins[0]}-${m.coins[1]}c</td><td>${S.mobKills[k] || 0}</td><td style="font-size:18px">${m.drops.map(x => ITEMS[x[0]].icon).join(' ')}</td></tr>`;
    });
    h += tbl('h-green', ['The Plains', 'Level', 'Health', 'Damage', 'Coins', 'Kills', 'Can drop'], rows);
    h += `<div class="note">Click a mob to hunt it. Villagers are harmless and give coins. Fights run automatically.</div>`;
    el.innerHTML = h; updateHunt();
  }
  $('tab-hunt').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mob) Game.setTarget(b.dataset.mob);
    if (b.dataset.depth) Game.setDepth(Game.s.depth + +b.dataset.depth);
  });
  function updateHunt() {
    const S = Game.s, f = Game.f, st = Game.st; if (!S || !$('hName')) return;
    const c = CLASSES[S.cls];
    $('hName').innerHTML = `<span style="color:${c.color}">${c.icon} ${c.name}</span>`;
    $('hBar').style.width = Math.max(0, S.hp / st.maxHp * 100) + '%';
    $('hTxt').textContent = `${Math.ceil(Math.max(0, S.hp))} / ${st.maxHp}`;
    $('hSub').textContent = f.dead > 0 ? `Recovering... ${Math.ceil(f.dead)}s` : `${st.dmg.toFixed(1)} dmg every ${st.cd.toFixed(2)}s`;
    const e = f.enemy;
    if (e) {
      $('eName').textContent = `${e.def.icon} ${e.def.name} Lv${e.lvl}`;
      $('eBar').style.width = Math.max(0, e.hp / e.maxHp * 100) + '%';
      $('eTxt').textContent = `${Math.ceil(Math.max(0, e.hp))} / ${Math.round(e.maxHp)}`;
      $('eSub').textContent = f.last ? `Last hit: ${Math.round(f.last.dmg)}${f.last.crit ? ' (crit!)' : ''}` : '';
    } else { $('eName').textContent = '-'; $('eBar').style.width = '0'; $('eTxt').textContent = ''; $('eSub').textContent = f.dead > 0 ? '' : 'Finding the next enemy...'; }
    let status = 'Idle - choose something to hunt below.';
    if (f.dead > 0) status = 'You were defeated.';
    else if (f.raid) status = `Raiding ${f.raid.v.name} - ${f.raid.queue.length + (e ? 1 : 0)} guard(s) left`;
    else if (S.target) status = `Hunting ${MOBS[S.target].name} at depth ${S.depth}`;
    $('hStatus').textContent = status;
    $('hLog').innerHTML = f.log.length ? f.log.map(l => `<div style="color:${l.color}">${l.txt}</div>`).join('') : '<span class="dim">Nothing yet.</span>';
  }
  UI.refreshHunt = () => { if (curTab === 'hunt') renderHunt(); };

  /* ---------- Inventory tab ---------- */
  const GROUPS = [['weapon', 'Weapons', 'h-red'], ['armor', 'Armor', 'h-teal'], ['boots', 'Boots', 'h-green'], ['charm', 'Charms', 'h-purple'], ['consumable', 'Consumables', 'h-salmon']];
  function renderInventory() {
    const S = Game.s, el = $('tab-inventory');
    if (!S) { el.innerHTML = '<p class="dim">Choose a class to begin.</p>'; return; }
    let h = `<div class="note">Inventory slots used: ${S.inv.filter(Boolean).length}/${S.inv.length}. The bar fills as you collect 5 of the same item and rarity (ready to craft). When the bag is full, new loot is auto-sold.</div>`;
    h += tbl('h-slate', ['Equipped', 'Rarity', 'Effect', ''], EQ.map(slot => {
      const it = S.eq[slot];
      if (!it) return `<tr><td><div class="bar"><span>${EQ_ICON[slot]} ${EQ_NAME[slot]}</span></div></td><td class="dim">-</td><td class="dim">Empty</td><td></td></tr>`;
      return `<tr><td>${itemBar(it.id, 1, 'active')}</td>${rarCell(it.r)}<td>${flat(itemLines(it.id, it.r))}</td><td class="act"><button data-act="unequip" data-slot="${slot}">Unequip</button></td></tr>`;
    }));
    let any = false;
    for (const [slot, label, cls] of GROUPS) {
      const rows = [];
      S.inv.forEach((st, i) => {
        if (!st || ITEMS[st.id].slot !== slot) return;
        const craftable = slot !== 'consumable' && st.r < RARITIES.length - 1;
        rows.push(`<tr><td>${itemBar(st.id, craftable ? Math.min(1, st.n / 5) : 0, craftable && st.n >= 5 ? 'full' : '')}</td>${rarCell(st.r)}<td>${flat(itemLines(st.id, st.r))}</td><td>${st.n}</td>` +
          `<td class="act"><button data-act="${slot === 'consumable' ? 'use' : 'equip'}" data-i="${i}">${slot === 'consumable' ? 'Use' : 'Equip'}</button>` +
          `<button data-act="sell" data-i="${i}">Sell 1</button>${st.n > 1 ? `<button data-act="sellall" data-i="${i}">Sell all</button>` : ''}</td></tr>`);
      });
      if (rows.length) { any = true; h += tbl(cls, [label, 'Rarity', 'Effect', 'Count', ''], rows); }
    }
    if (!any) h += '<p class="dim">Your bag is empty. Go hunt some mobs or raid a village!</p>';
    el.innerHTML = h;
  }
  $('tab-inventory').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const i = +b.dataset.i;
    switch (b.dataset.act) {
      case 'equip': Game.equip(i); break; case 'use': Game.use(i); break;
      case 'sell': Game.sell(i, false); break; case 'sellall': Game.sell(i, true); break;
      case 'unequip': Game.unequip(b.dataset.slot); break;
    }
  });

  /* ---------- Crafting tab ---------- */
  function renderCrafting() {
    const S = Game.s, el = $('tab-crafting');
    let h = `<div class="note">Combine <b>5</b> of the same item and rarity for a chance at the next rarity. A failed craft uses up the 5 items.</div>`;
    h += tbl('h-slate', ['Rarity', 'Upgrades to', 'Success chance', 'Stat multiplier'], RARITIES.map((r, i) => {
      const nxt = RARITIES[i + 1], ch = r.craft * 100;
      return `<tr><td class="rar" style="color:${r.color}">${r.name}</td><td>${nxt ? `<span class="rar" style="color:${nxt.color}">${nxt.name}</span>` : '<span class="dim">Max</span>'}</td><td>${nxt ? (ch < 1 ? ch.toFixed(1) : ch) + '%' : '-'}</td><td>x${r.mult}</td></tr>`;
    }));
    if (S) {
      const rows = [];
      S.inv.forEach((st, i) => {
        if (!st || ITEMS[st.id].slot === 'consumable' || st.r >= RARITIES.length - 1) return;
        const ch = RARITIES[st.r].craft * 100;
        rows.push(`<tr><td>${itemBar(st.id, Math.min(1, st.n / 5), st.n >= 5 ? 'full' : '')}</td>${rarCell(st.r)}<td>${st.n} / 5</td><td>${ch < 1 ? ch.toFixed(1) : ch}%</td>` +
          `<td class="act"><button class="${st.n >= 5 ? 'go' : ''}" data-act="craft" data-i="${i}" ${st.n < 5 ? 'disabled' : ''}>Craft ×5</button></td></tr>`);
      });
      h += rows.length ? tbl('h-green', ['Your items', 'Rarity', 'Have', 'Chance', ''], rows) : '<p class="dim">No craftable items yet.</p>';
    }
    el.innerHTML = h;
  }
  $('tab-crafting').addEventListener('click', e => { const b = e.target.closest('button[data-act="craft"]'); if (b) Game.craft(+b.dataset.i); });

  /* ---------- Shop tab ---------- */
  function renderShop() {
    const S = Game.s, el = $('tab-shop'); if (!S) { el.innerHTML = '<p class="dim">Choose a class to begin.</p>'; return; }
    const shop = Game.shops[shopIdx], stock = Game.shopStock(shop);
    let h = `<div class="shopbtns">${Game.shops.map((s, i) => `<button class="${i === shopIdx ? 'on' : ''}" data-shop="${i}">🏪 ${s.name}</button>`).join('')}</div>`;
    h += tbl('h-teal', [shop.name, 'Rarity', 'Effect', 'Price', ''], stock.map((e, i) =>
      `<tr class="${e.sold ? 'soldrow' : ''}"><td>${itemBar(e.id, 0)}</td>${rarCell(e.r)}<td>${flat(itemLines(e.id, e.r))}</td><td>${coinHTML(e.price)}</td><td class="act"><button data-buy="${i}" ${e.sold ? 'disabled' : ''}>${e.sold ? 'Sold' : 'Buy'}</button></td></tr>`));
    h += `<div class="note">Stock refreshes every few minutes. Sell items from the Inventory tab. Your balance: ${coinHTML(S.coins)}</div>`;
    el.innerHTML = h;
  }
  $('tab-shop').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.shop) { shopIdx = +b.dataset.shop; renderShop(); }
    if (b.dataset.buy) Game.buy(Game.shops[shopIdx], +b.dataset.buy);
  });

  /* ---------- Villages tab ---------- */
  function renderVillages() {
    const el = $('tab-villages'); if (!Game.s) { el.innerHTML = '<p class="dim">Choose a class to begin.</p>'; return; }
    let h = `<div class="p-text">Raid a village: beat its guards and you loot every chest that is ready. Chests refill after a few minutes. Higher level villages have tougher guards and better loot. If you are defeated, the raid fails.</div>`;
    h += tbl('h-rose', ['Villages', 'Level', 'Chests ready', 'Next refill', ''], Game.villages.map((v, i) =>
      `<tr><td><div class="bar"><span>🏘️ ${v.name}</span></div></td><td>${v.lvl}</td><td id="vch${i}"></td><td id="vcd${i}" class="cd"></td><td class="act"><button id="vbt${i}" data-raid="${i}">Raid</button></td></tr>`));
    el.innerHTML = h; updateVillages();
  }
  function updateVillages() {
    if (!Game.f) return;
    Game.villages.forEach((v, i) => {
      const ready = v.chests.filter(c => c.t <= 0).length, wait = v.chests.filter(c => c.t > 0).map(c => c.t);
      const a = $('vch' + i); if (!a) return;
      a.textContent = `${ready} / ${v.chests.length}`;
      $('vcd' + i).textContent = wait.length ? Math.ceil(Math.min(...wait)) + 's' : '-';
      $('vbt' + i).disabled = ready === 0 || !!Game.f.raid;
    });
  }
  $('tab-villages').addEventListener('click', e => { const b = e.target.closest('button[data-raid]'); if (b) { Game.startRaid(+b.dataset.raid); switchTab('hunt'); } });

  /* ---------- Settings tab ---------- */
  function renderSettings() {
    const el = $('tab-settings');
    el.innerHTML = `<div class="p-title">Settings</div>
      <p><button id="stChange">Change class / new game</button> <button id="stReset">Delete save</button></p>
      <p class="dim">Progress auto-saves in this browser. Deleting the save also restarts the game.</p>
      <hr class="p-sep">
      <div class="p-text"><b>Controls</b><br>Q: drink a Health Potion<br>P: pause<br>Click an inventory slot (bottom-right) to select it, double-click to equip or unequip.</div>`;
    $('stChange').onclick = () => { buildClassSelect(); $('classSelect').classList.remove('hidden'); };
    $('stReset').onclick = () => { if (confirm('Delete your save and restart?')) { Game.clearSave(); location.reload(); } };
  }

  /* ---------- tabs ---------- */
  const RENDER = { hunt: renderHunt, inventory: renderInventory, crafting: renderCrafting, shop: renderShop, villages: renderVillages, settings: renderSettings };
  UI.tab = () => curTab;
  function switchTab(t) {
    curTab = t;
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    document.querySelectorAll('main > section').forEach(s => s.classList.toggle('hidden', s.id !== 'tab-' + t));
    RENDER[t]();
  }
  document.querySelectorAll('.tab').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

  UI.update = () => { hud(); if (curTab === 'hunt') updateHunt(); else if (curTab === 'villages') updateVillages(); };
  UI.refresh = () => {
    if (!Game.s) return;
    if (sel && !selected()) sel = null;
    renderSlots(); renderPanel();
    if (curTab !== 'settings') RENDER[curTab]();
    hud();
  };
  UI.modalOpen = () => !$('classSelect').classList.contains('hidden');

  /* ---------- class select ---------- */
  function buildClassSelect() {
    const box = $('classCards'); box.innerHTML = '';
    for (const k in CLASSES) {
      const c = CLASSES[k], w = ITEMS[c.start];
      const perks = Object.entries(c.perks).map(([p, v]) => `<div class="${v >= 1 ? 'good' : 'bad'}">${PERK_LABELS[p]} ${v}x</div>`).join('');
      const d = document.createElement('div'); d.className = 'ccard'; d.style.setProperty('--cc', c.color);
      d.innerHTML = `<div class="cc-ic">${c.icon}</div><h3>${c.name}</h3>${perks}<div class="dim" style="margin-top:6px">Starts with ${w.icon} ${w.name}</div>`;
      d.onclick = () => {
        if (Game.hasSave() && !confirm('Start a new game as ' + c.name + '? Your saved game will be overwritten.')) return;
        Game.clearSave(); Game.paused = false; Game.start(k, false);
      };
      box.appendChild(d);
    }
    const cont = $('continueBtn');
    if (Game.hasSave()) { cont.classList.remove('hidden'); cont.textContent = `Continue saved game (${(CLASSES[Game.saveClass()] || {}).name || ''})`; cont.onclick = () => Game.start(null, true); }
    else cont.classList.add('hidden');
    $('menuClose').classList.toggle('hidden', !Game.running);
  }
  addEventListener('keydown', e => { if (e.code === 'Escape') { if (Game.running && UI.modalOpen()) $('classSelect').classList.add('hidden'); else UI.clearSelection(); } });

  UI.started = S => {
    const c = CLASSES[S.cls];
    $('classSelect').classList.add('hidden'); sel = null;
    $('loadout').style.setProperty('--cc', c.color);
    $('discLabel').innerHTML = `<span>${c.icon}</span><small>${c.name}</small>`;
    $('loadout').classList.remove('hidden');
    buildSide(); switchTab('hunt');
    renderSlots(); renderPanel(); hud();
    UI.toast(`Welcome, ${c.name}!`, c.color);
  };
  $('menuClose').onclick = () => { if (Game.running) $('classSelect').classList.add('hidden'); };

  buildSlots(); buildClassSelect();
})();
