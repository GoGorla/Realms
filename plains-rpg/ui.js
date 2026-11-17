'use strict';
/* ===== HUD, quarter-circle loadout, item panel, shop, class select ===== */
const UI = window.UI = {};
(() => {
  const $ = id => document.getElementById(id);
  const RINGS = [{ r: 100, n: 4, eq: true }, { r: 145, n: 6 }, { r: 190, n: 7 }, { r: 235, n: 9 }];
  const EQ = ['weapon', 'armor', 'boots', 'charm'];
  const EQ_ICON = { weapon: '⚔️', armor: '🛡️', boots: '👢', charm: '🍀' };
  const BOX = 270, SLOT = 34;
  let sel = null, shopObj = null, shopTab = 'buy';
  const rc = r => RARITIES[r].color;

  /* ---------- loadout ---------- */
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
    if (!it) { p.classList.add('hidden'); sel = it ? sel : null; return; }
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
      btn(`Sell 1 (${sellPrice(it.id, it.r)}🪙)`, () => Game.sell(sel.i, false));
      if (it.n > 1) btn(`Sell all (${sellPrice(it.id, it.r) * it.n}🪙)`, () => Game.sell(sel.i, true));
    }
  }

  UI.refresh = () => { if (!Game.s) return; if (sel && !selected()) sel = null; renderSlots(); renderPanel(); if (shopObj) renderShop(); };

  /* ---------- HUD ---------- */
  UI.hud = (S, st) => {
    const c = CLASSES[S.cls], p = S.p;
    $('hud').innerHTML =
      `<div class="hud-title" style="color:${c.color}">${c.icon} ${c.name}</div>` +
      `<div class="hpbar"><div style="width:${Math.max(0, p.hp / st.maxHp * 100)}%"></div><span>${Math.ceil(p.hp)} / ${st.maxHp}</span></div>` +
      `<div class="coins">🪙 ${S.coins.toLocaleString()} &nbsp; ☠ ${S.kills}</div>` +
      `<div class="hud-stats">Damage ${st.dmg.toFixed(1)} ${st.elem ? '(elemental)' : ''}<br>Crit ${(st.crit * 100).toFixed(1)}% &nbsp; Atk/s ${(1 / st.cd).toFixed(2)}<br>Luck ${st.luck.toFixed(2)}x &nbsp; Regen ${st.regen.toFixed(1)}/s<br>Move ${Math.round(st.speed)}</div>`;
  };
  UI.prompt = t => { const e = $('prompt'); e.textContent = t; e.style.display = t ? 'block' : 'none'; };
  UI.toast = (msg, color = '#fff') => {
    const t = document.createElement('div'); t.className = 'toast'; t.style.borderColor = color; t.style.color = color; t.textContent = msg;
    const box = $('toasts'); box.appendChild(t);
    while (box.children.length > 5) box.firstChild.remove();
    setTimeout(() => t.remove(), 3500);
  };

  /* ---------- shop ---------- */
  UI.modalOpen = () => !$('shop').classList.contains('hidden') || !$('classSelect').classList.contains('hidden');
  UI.closeModal = () => { if (!$('classSelect').classList.contains('hidden') && !Game.running) return; $('shop').classList.add('hidden'); shopObj = null; };
  UI.openShop = s => { shopObj = s; shopTab = 'buy'; $('shop').classList.remove('hidden'); renderShop(); };
  function card(id, r, n) { return `<span class="ic2" style="border-color:${rc(r)}">${ITEMS[id].icon}</span>`; }
  function renderShop() {
    if (!shopObj) return;
    const S = Game.s, el = $('shop');
    let h = `<div class="shop-box"><div class="shop-head"><b>🏪 ${shopObj.name}</b><span>🪙 ${S.coins.toLocaleString()}</span><button id="shopClose">✕</button></div>`;
    h += `<div class="tabs"><button class="${shopTab === 'buy' ? 'on' : ''}" data-t="buy">Buy</button><button class="${shopTab === 'sell' ? 'on' : ''}" data-t="sell">Sell</button></div><div class="shop-list">`;
    if (shopTab === 'buy') {
      Game.shopStock(shopObj).forEach((e, i) => {
        const lines = itemLines(e.id, e.r).join(' · ');
        h += `<div class="row ${e.sold ? 'sold' : ''}">${card(e.id, e.r)}<div class="rt"><b style="color:${rc(e.r)}">${itemName(e.id, e.r)}</b><div class="dim">${lines}</div></div><button data-buy="${i}" ${e.sold || S.coins < e.price ? 'disabled' : ''}>${e.sold ? 'Sold' : e.price + '🪙'}</button></div>`;
      });
      h += '<div class="dim" style="padding:6px">Stock refreshes every few minutes.</div>';
    } else {
      let any = false;
      S.inv.forEach((st, i) => {
        if (!st) return; any = true;
        h += `<div class="row">${card(st.id, st.r)}<div class="rt"><b style="color:${rc(st.r)}">${itemName(st.id, st.r)}</b> ×${st.n}<div class="dim">${sellPrice(st.id, st.r)}🪙 each</div></div><button data-sell="${i}">Sell 1</button>${st.n > 1 ? `<button data-sellall="${i}">All</button>` : ''}</div>`;
      });
      if (!any) h += '<div class="dim" style="padding:10px">Nothing to sell.</div>';
    }
    h += '</div></div>';
    el.innerHTML = h;
    $('shopClose').onclick = UI.closeModal;
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { shopTab = b.dataset.t; renderShop(); });
    el.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => Game.buy(shopObj, +b.dataset.buy));
    el.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => Game.sell(+b.dataset.sell, false));
    el.querySelectorAll('[data-sellall]').forEach(b => b.onclick = () => Game.sell(+b.dataset.sellall, true));
  }
  UI.renderShop = renderShop;

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
        Game.clearSave(); Game.start(k, false);
      };
      box.appendChild(d);
    }
    const cont = $('continueBtn');
    if (Game.hasSave()) { cont.classList.remove('hidden'); cont.textContent = `Continue saved game (${(CLASSES[Game.saveClass()] || {}).name || ''})`; cont.onclick = () => Game.start(null, true); }
    else cont.classList.add('hidden');
  }

  UI.started = S => {
    const c = CLASSES[S.cls];
    $('classSelect').classList.add('hidden'); $('shop').classList.add('hidden'); shopObj = null; sel = null;
    $('loadout').style.setProperty('--cc', c.color);
    $('discLabel').innerHTML = `<span>${c.icon}</span><small>${c.name}</small>`;
    $('hud').classList.remove('hidden'); $('help').classList.remove('hidden'); $('minimap').classList.remove('hidden'); $('menuBtn').classList.remove('hidden');
    $('loadout').classList.remove('hidden');
    UI.refresh(); UI.toast(`Welcome, ${c.name}! Explore, fight, and raid villages.`, c.color);
  };

  $('menuBtn').onclick = () => { buildClassSelect(); $('classSelect').classList.remove('hidden'); };
  $('menuClose').onclick = () => { if (Game.running) $('classSelect').classList.add('hidden'); };

  buildSlots(); buildClassSelect();
})();
