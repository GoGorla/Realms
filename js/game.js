// ===== Hollowmark game logic =====
const $=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fx=n=>n>=100?Math.round(n):(Math.round(n*10)/10);
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const SAVE='hollowmark_save';
let S=null,run=null,farm=null,tab='train',sub='mob';
const TABS={train:'Train',jobs:'Jobs',shop:'Shop',town:'Town',quests:'Quests',craft:'Craft',bag:'Bag',book:'Book'};

function fresh(cls){
 const sk={};SKILLS.forEach(s=>sk[s.id]=0);
 const s={cls,gold:50,sk,train:null,prog:{},inv:[{id:'potion',r:0,n:3}],eq:{weapon:{id:cls==='sorcerer'?'wand':'club',r:0}},house:0,shop:null,cd:0,quests:[],hp:1,opts:{loot:true,remains:true}};
 return s;
}
function load(){try{return JSON.parse(localStorage.getItem(SAVE))}catch(e){return null}}
function save(){if(S)localStorage.setItem(SAVE,JSON.stringify(S))}
function toast(t){const d=document.createElement('div');d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2800)}

// ---------- stats ----------
const cm=x=>CLASSES[S.cls].m[x]||1;
const rel=slot=>{const e=S.eq[slot];return e?1+.1*(e.r+1)+(e.bonus||0):1};
function stats(){
 const k=S.sk;let hpI=0,spd=0;
 for(const sl of['helmet','chest','gloves','legs','boots']){const e=S.eq[sl];if(e){const it=ITEMS[e.id];hpI+=it.hp*rmult(e.r);spd+=it.spd*(1+.3*e.r)}}
 const w=S.eq.weapon,wi=w&&ITEMS[w.id],elem=wi&&wi.kind==='elem';
 const base=(10+k.basedmg*2)*rel('reld')+(wi?wi.dmg*rmult(w.r):0);
 const dmg=elem?base*cm('elem')*(1+.08*k.mind):base*(wi?cm('weapon'):1)*(1+.08*k.swing);
 return{maxHp:Math.round((100+k.basehp*10+hpI)*cm('health')*rel('relh')),dmg,elem,
  atk:2000/(cm('speed')*(1+.05*k.speed)*(1+spd)),crit:Math.min(.95,cm('phys')/15),critMul:1.5+.1*k.tactics,
  regen:(.5+.3*k.tough)*cm('regen'),dodge:1/25+.01*k.dodge,resist:k.resist*.5,spdBonus:spd,
  luck:cm('luck')*(1+.06*k.looting),jobM:1+.12*S.house,skillM:1+.15*S.house};
}
const totalLv=()=>Object.values(S.sk).reduce((a,b)=>a+b,0);
function trainMs(id){const k=S.sk;return 15000*(1+k[id]*.4)*(1+totalLv()/25)/((id==='focus'?1:1+.1*k.focus)*(1+.15*S.house))}

// ---------- inventory ----------
const maxSlots=()=>60+(S.eq.pack?ITEMS.backpack.slots*(S.eq.pack.r+1):0);
function addItem(id,r,n=1,inv=S.inv){
 for(const s of inv)if(s.id===id&&s.r===r&&s.n<50){const t=Math.min(n,50-s.n);s.n+=t;n-=t;if(!n)return 0}
 while(n>0&&(inv!==S.inv||inv.length<maxSlots())){const t=Math.min(n,50);inv.push({id:id,r:r,n:t});n-=t}
 return n;
}
function take(i,n){const s=S.inv[i];s.n-=n;if(s.n<=0)S.inv.splice(i,1)}
const iname=(id,r)=>`<b class="rn" style="color:${RCOLOR[r]};-webkit-text-stroke:2px ${RDARK[r]}">${r?RARITY[r]+' ':''}${ITEMS[id].name}</b>`;
const rbadge=r=>`<span class="rar rn" style="color:${RCOLOR[r]};-webkit-text-stroke:2px ${RDARK[r]}">${RARITY[r]}</span>`;
const unitPrice=(id,r)=>Math.round(ITEMS[id].price*Math.pow(2.1,r));
const sellVal=(id,r)=>Math.max(1,Math.floor(unitPrice(id,r)*.4*(1+.01*S.sk.bargain)));
function desc(id,r){const it=ITEMS[id],m=rmult(r);
 if(it.kind)return`${it.kind==='elem'?'Elemental':'Weapon'} damage +${fx(it.dmg*m)}${it.only?' (Sorcerer only)':''}`;
 if(it.heal)return`Restores ${fx(it.heal*m)} HP`;
 if(it.type)return`x${(1+.1*(r+1)).toFixed(2)} base ${it.type==='dmg'?'damage':'health'}, grows +0.01 per milestone`;
 if(it.slots)return`+${it.slots*(r+1)} bag slots`;
 if(it.slot==='gloves')return`Attack speed +${Math.round(it.spd*(1+.3*r)*100)}%`;
 if(it.hp!==undefined)return`Base health +${fx(it.hp*m)}`;
 return'Material';}
function rollR(luck){let r=0;while(r<8&&Math.random()<Math.min(.85,.32*luck/(1+.7*r)))r++;return r}

// ---------- shop ----------
function genShop(){
 const f=S.sk.shopfame,n=rnd(5,10)+Math.floor(f/4);
 const pool=Object.values(ITEMS).filter(i=>i.slot&&(!i.only||i.only===S.cls));
 const items=[];for(let i=0;i<n;i++){const it=pick(pool),r=rollR(1+.08*f);items.push({id:it.id,r,sold:false})}
 S.shop={t:Date.now()+600000,items};
}
const buyPrice=(id,r)=>Math.max(1,Math.floor(unitPrice(id,r)*Math.max(.3,1-.02*S.sk.bargain)));
function buy(i){const e=S.shop.items[i],p=buyPrice(e.id,e.r);
 if(S.gold<p)return toast('Not enough gold');
 if(addItem(e.id,e.r))return toast('Bag is full');
 S.gold-=p;e.sold=true;save();render()}

// ---------- bag actions ----------
function equip(i){const s=S.inv[i],it=ITEMS[s.id];
 if(it.only&&it.only!==S.cls)return toast('Only '+CLASSES[it.only].name+'s can use this');
 const old=S.eq[it.slot];
 if(old&&addItem(old.id,old.r,1))return toast('Bag is full');
 const idx=S.inv.indexOf(s);take(idx,1);
 S.eq[it.slot]={id:s.id,r:s.r,bonus:0,prog:0};
 save();render()}
function unequip(slot){const e=S.eq[slot];if(!e)return;if(addItem(e.id,e.r,1))return toast('Bag is full');delete S.eq[slot];save();render()}
function usePotion(i){const s=S.inv[i],st=stats();S.hp=Math.min(st.maxHp,S.hp+ITEMS.potion.heal*rmult(s.r));take(i,1);save();render()}
function usePotionBest(){const i=S.inv.findIndex(s=>s.id==='potion');if(i<0)return toast('No potions');usePotion(i)}
function sell(i,all){const s=S.inv[i],n=all?s.n:1;S.gold+=sellVal(s.id,s.r)*n;take(i,n);save();render()}

// ---------- training ----------
function trainFrac(id){const t=S.train;if(t&&t.id===id)return Math.min(1,t.f0+(Date.now()-t.start)/t.ms);return S.prog[id]||0}
function startTrain(id){
 if(S.train&&S.train.id===id)return;
 if(S.train)S.prog[S.train.id]=Math.min(.999,trainFrac(S.train.id));
 const ms=trainMs(id),f0=S.prog[id]||0,now=Date.now();
 S.train={id,start:now,f0,ms,end:now+(1-f0)*ms};save();render()}
function reroll(){const now=Date.now();if(S.shop.t-now<=60000)return;S.shop.t=Math.max(S.shop.t-60000,now+60000);save();render()}

// ---------- runs ----------
function startRun(kind){
 if(Date.now()<S.cd)return;farm=null;
 const s=pick(STRUCTS.filter(x=>x.kind===kind));
 run={kind,s,wave:1,mobs:[],prompt:false,wait:800,pT:0,loot:[],gold:0,log:['Entered '+s.name+'.']};
 render();
}
function endRun(){
 if(run){let lost=0;for(const l of run.loot)lost+=addItem(l.id,l.r,l.n);if(lost)toast('Bag full: '+lost+' items lost');
  toast('Run ended. Wave '+(run.prompt?run.wave-1:run.wave)+', +'+run.gold+' gold');}
 run=null;S.cd=Date.now()+60000;save();render();
}
function continueRun(){if(!run)return;run.prompt=false;run.wait=600;render()}
function die(){
 S.gold=Math.floor(S.gold/2);run=null;S.cd=Date.now()+60000;S.hp=Math.ceil(stats().maxHp*.25);
 toast('You died. Run loot lost and half your gold.');save();render();
}
function logR(t){run.log.unshift(t);run.log.length=Math.min(run.log.length,8)}
// every 5 waves the rarity band shifts up one step; at the top band Eternal is 1x
function rollWave(w,luck){
 const sh=Math.min(8,Math.floor((w-1)/5)),ws=[];let tot=0;
 for(let i=0;i<9;i++){const k=i-sh,wt=k<0?0:(1+(luck-1)*k*.25)/RSPAWN[k];ws.push(wt);tot+=wt}
 let x=Math.random()*tot;for(let i=0;i<9;i++){x-=ws[i];if(x<=0)return i}return sh;
}
function dropOne(st){const pool=Object.values(ITEMS).filter(i=>i.slot&&(!i.only||i.only===S.cls));pool.push(ITEMS.potion,ITEMS.potion);
 const it=pick(pool),r=rollWave(run.wave,st.luck);addRun(it.id,r,1);logR('Loot: '+RARITY[r]+' '+it.name)}
function addRun(id,r,n){const l=run.loot.find(x=>x.id===id&&x.r===r);l?l.n+=n:run.loot.push({id,r,n})}
function spawn(id,w){const D=MOBS[id],hp=Math.round(D.hp*(1+.3*(w-1)));return{id,name:D.name,max:hp,hp,dmg:D.dmg*(1+.2*(w-1)),mT:1500+rnd(0,500)}}
function encounter(st){
 const r=run,w=r.wave;let type='mob';
 if(r.kind==='loot'){const x=Math.random();type=x<.3?'trap':x<.5?'chest':'mob'}
 if(type==='trap'){
  if(Math.random()<st.dodge)logR('You dodge a trap.');
  else{const d=Math.max(1,Math.round(8*(1+.2*w)-st.resist));S.hp-=d;logR('Trap! -'+d+' HP')}
  r.wave++;r.wait=1200;return}
 if(type==='chest'){dropOne(st);if(Math.random()<.5)dropOne(st);logR('Opened a chest.');r.wave++;r.wait=1200;return}
 const n=r.kind==='mob'?Math.min(8,rnd(2,3)+Math.floor((w-1)/5)):1;
 r.mobs=[];for(let i=0;i<n;i++)r.mobs.push(spawn(pick(r.s.mobs),w));
 r.pT=st.atk;if(n>1)logR('Wave '+w+': '+n+' enemies appear!');
}
function kill(m,st){
 const r=run,D=MOBS[m.id],g=Math.round(D.gold*(1+.15*(r.wave-1))*st.jobM);
 S.gold+=g;r.gold+=g;logR(m.name+' slain. +'+g+' gold');
 if(S.opts.loot&&Math.random()<.4+.02*S.sk.looting){dropOne(st);if(Math.random()<.03*S.sk.looting)dropOne(st)}
 if(S.opts.remains){const n=1+(Math.random()<.3?1:0);addRun(D.remain,0,n);logR('Remains: '+n+' '+ITEMS[D.remain].name)}
}
function waveClear(){
 const r=run;
 if(r.kind==='mob')for(const sl of['reld','relh']){const e=S.eq[sl];if(!e)continue;
  e.prog=(e.prog||0)+1;if(e.prog>=10+Math.round((e.bonus||0)*100)){e.prog=0;e.bonus=Math.round(((e.bonus||0)+.01)*100)/100;logR(ITEMS[e.id].name+' grew +0.01x')}}
 r.wave++;r.mobs=[];
 if(r.kind==='mob'){r.prompt=true;toast('Wave '+(r.wave-1)+' cleared. Go on or stop?');render()}
 else r.wait=900;
}
function stepRun(dt,st){
 const r=run;if(r.prompt)return;
 if(!r.mobs.length){r.wait-=dt;if(r.wait<=0)encounter(st);return}
 r.pT-=dt;
 if(r.pT<=0){const m=r.mobs[0];let d=st.dmg;const c=Math.random()<st.crit;if(c)d*=st.critMul;
  m.hp-=d;r.pT+=st.atk;if(c)logR('Critical hit! '+fx(d));
  if(m.hp<=0){kill(m,st);r.mobs.shift();if(!r.mobs.length){waveClear();return}}}
 for(const m of r.mobs){m.mT-=dt;
  if(m.mT<=0){m.mT+=1500;
   if(Math.random()<st.dodge)logR('You dodged the '+m.name+'.');
   else S.hp-=Math.max(1,m.dmg-st.resist)}}
}

// ---------- farming ----------
const farmMs=()=>8000/(1+.1*S.sk.productivity);
function startFarm(res){run=null;farm={res,start:Date.now(),end:Date.now()+farmMs()};render()}
function stopFarm(){farm=null;render()}

// ---------- town / craft / quests ----------
function buyHouse(){const c=houseCost(S.house+1);if(S.house+1>=HOUSES.length||S.gold<c)return;S.gold-=c;S.house++;save();render()}
function craftChance(r){return Math.min(100,CRAFT[r]+S.sk.craft)}
function doCraft(i){const s=S.inv[i];if(s.n<5||s.r>=8)return;
 const id=s.id,r=s.r,ok=Math.random()*100<craftChance(r);
 take(i,5);
 if(ok){if(addItem(id,r+1,1))toast('Bag full: crafted item lost');else toast('Success! Made a '+RARITY[r+1]+' '+ITEMS[id].name)}
 else toast('Crafting failed. The 5 items were lost.');
 save();render()}
function genQuest(){
 const ids=Object.keys(MATS).concat(['potion']),id=pick(ids),n=rnd(3,10),jm=1+.12*S.house;
 return{who:pick(NPCS),id,n,reward:Math.round(n*ITEMS[id].price*2.2*jm)};
}
function have(id){return S.inv.filter(s=>s.id===id).reduce((a,s)=>a+s.n,0)}
function doQuest(q){const x=S.quests[q];if(have(x.id)<x.n)return;let need=x.n;
 for(let i=S.inv.length-1;i>=0&&need>0;i--)if(S.inv[i].id===x.id){const t=Math.min(need,S.inv[i].n);take(i,t);need-=t}
 S.gold+=x.reward;S.quests[q]=genQuest();toast('Quest done: +'+x.reward+' gold');save();render()}

// ---------- rendering ----------
const spr=(i,s)=>`<div class="spr" style="--i:${i}${s?';--s:'+s+'px':''}"></div>`;
const perks=cls=>Object.entries(CLASSES[cls].m).map(([k,v])=>`<span class="chip" style="--c:${CLASSES[cls].color}">${MLABEL[k]} ${v}x</span>`).join('');
function pickClass(){
 $('#app').innerHTML=`<main style="padding-bottom:2rem"><h2>Choose your role</h2><div class="cls">${Object.entries(CLASSES).map(([k,c])=>`<div class="card" style="--c:${c.color}">${spr(c.i)}<h3 style="margin:0;color:${c.color}">${c.name}</h3><div>${perks(k)}</div><button onclick="choose('${k}')">Play as ${c.name}</button></div>`).join('')}</div></main>`;
}
function choose(k){S=fresh(k);S.hp=stats().maxHp;genShop();for(let i=0;i<3;i++)S.quests.push(genQuest());save();render()}
function resetGame(){if(confirm('Delete your save and start over?')){localStorage.removeItem(SAVE);S=null;run=null;farm=null;render()}}
const timer=(t)=>`<span class="cd" data-cd="${t}"></span>`;
const prog=(s,e)=>`<div class="bar amber"><i data-s="${s}" data-e="${e}"></i></div>`;

function header(){const st=stats();
 return`<header><h1>Hollowmark</h1><span class="gold">Gold <span id="gold">${S.gold}</span></span><div class="hpw"><span class="dim">HP</span><div class="bar red"><i id="hpbar"></i></div><span id="hptx" class="dim"></span></div><button class="alt" onclick="usePotionBest()">Drink potion</button><button class="alt" onclick="resetGame()">Reset</button></header>
 <nav>${Object.entries(TABS).map(([k,v])=>`<button class="tab ${k===tab?'on':''}" onclick="go('${k}')">${v}</button>`).join('')}</nav>`;
}
function classBox(){const c=CLASSES[S.cls];return`<div id="cbox" style="--c:${c.color}">${spr(c.i)}<div><b>${c.name}</b><div>${perks(S.cls)}</div></div></div>`}
function go(t){tab=t;render()}
function render(){
 if(!S){pickClass();return}
 $('#app').innerHTML=header()+`<main>${VIEW[tab]()}</main>`+classBox();upd();
}

const VIEW={
 train(){const st=stats();let h='<h2>Train</h2><p class="dim">One skill at a time. Each level takes longer, scaled by your total levels. Focus speeds up everything else.</p>';
  let cat='';
  for(const s of SKILLS){
   if(s.cat!==cat){cat=s.cat;h+=`<h3>${cat}</h3>`}
   const act=S.train&&S.train.id===s.id,f=trainFrac(s.id);
   const bar=act?`<div class="bar amber"><i data-f0="${S.train.f0}" data-t0="${S.train.start}" data-ms="${S.train.ms}"></i></div>`:`<div class="bar amber"><i style="width:${f*100}%"></i></div>`;
   h+=`<div class="row"><div class="grow"><b>${s.name}</b> Lv ${S.sk[s.id]}<div class="dim">${s.desc}</div>${bar}</div>
   ${act?timer(S.train.end):`<span class="dim">${fmt((1-f)*trainMs(s.id))}</span><button onclick="startTrain('${s.id}')">${S.train?'Switch':'Train'}</button>`}</div>`}
  return h},
 jobs(){
  let h=`<h2>Jobs</h2><div class="sub">${[['mob','Mob hunt'],['loot','Loot structures'],['farm','Farm']].map(([k,v])=>`<button class="alt ${sub===k?'on':''}" onclick="sub='${k}';render()">${v}</button>`).join('')}</div>`;
  if(sub==='farm'){
   h+=`<p class="dim">Farm safely. Productivity speeds it up, houses raise yields. Sell goods in the Bag.</p>`;
   h+=FARM.map(f=>`<div class="row"><div class="grow"><b>${ITEMS[f].name}</b> <span class="dim">sells for ${ITEMS[f].price}</span>${farm&&farm.res===f?prog(farm.start,farm.end):''}</div>${farm&&farm.res===f?`${timer(farm.end)}<button class="alt" onclick="stopFarm()">Stop</button>`:`<button onclick="startFarm('${f}')">Farm</button>`}</div>`).join('');
   return h}
  const kind=sub;
  h+=`<p class="dim">${kind==='mob'?'Fight waves of mobs from a random structure. Each wave is harder.':'Loot an abandoned structure: traps, chests and wild mobs.'} Dying loses all run loot and half your gold.</p>`;
  h+=`<div class="row"><label><input type="checkbox" ${S.opts.loot?'checked':''} onchange="S.opts.loot=this.checked"> Get loot</label><label><input type="checkbox" ${S.opts.remains?'checked':''} onchange="S.opts.remains=this.checked"> Get mob remains</label></div>`;
  if(!run){h+=`<div class="row"><div class="grow">Run cooldown: ${timer(S.cd)}</div><button id="startbtn" onclick="startRun('${kind}')">Start run</button></div>`;return h}
  h+=`<div class="row"><div class="grow"><b>${run.s.name}</b> <span class="dim" id="rwave"></span><div id="rmobs" style="margin-top:.4rem"></div></div><button class="alt" onclick="endRun()">Stop run</button></div>
  ${run.prompt?`<div class="row"><div class="grow"><b>Wave ${run.wave-1} cleared.</b> Go on to wave ${run.wave} or stop and keep your loot?</div><button onclick="continueRun()">Go on</button><button class="alt" onclick="endRun()">Stop run</button></div>`:''}
  <h3>Run loot (kept if you survive)</h3><div id="rloot" class="log" style="min-height:60px"></div><h3>Log</h3><div id="rlog" class="log"></div>`;
  return h},
 shop(){
  let h=`<h2>Shop</h2><div class="row"><div class="grow">New stock in ${timer(S.shop.t)}<div class="dim">Stock refreshes every 10 minutes. Each reroll click takes 1 minute off the wait, down to 1 minute left. Bargaining lowers prices; shop fame improves stock.</div></div><button id="rerollbtn" ${S.shop.t-Date.now()<=60000?'disabled':''} onclick="reroll()">Reroll</button></div>`;
  S.shop.items.forEach((e,i)=>{const p=buyPrice(e.id,e.r);
   h+=`<div class="row"><div class="grow">${iname(e.id,e.r)}<div class="dim">${desc(e.id,e.r)}</div></div><span class="gold">${p}</span><button ${e.sold||S.gold<p?'disabled':''} onclick="buy(${i})">${e.sold?'Sold':'Buy'}</button>${rbadge(e.r)}</div>`});
  return h},
 town(){const next=S.house+1,max=next>=HOUSES.length;
  return`<h2>Town</h2><div class="row"><div class="grow"><b>${HOUSES[S.house]}</b><div class="dim">Skill XP x${(1+.15*S.house).toFixed(2)} (faster training). Job XP x${(1+.12*S.house).toFixed(2)} (more gold, bigger farm yields).</div></div></div>
  ${max?'<p>You own the finest home in the land.</p>':`<div class="row"><div class="grow">Next: <b>${HOUSES[next]}</b></div><span class="gold">${houseCost(next)}</span><button ${S.gold<houseCost(next)?'disabled':''} onclick="buyHouse()">Buy</button></div>`}`},
 quests(){return'<h2>Quests</h2>'+S.quests.map((q,i)=>{const h=have(q.id);
  return`<div class="row"><div class="grow"><b>${q.who}</b> needs ${q.n} ${ITEMS[q.id].name}<div class="dim">You have ${h}. Reward ${q.reward} gold.</div></div><button ${h<q.n?'disabled':''} onclick="doQuest(${i})">Turn in</button></div>`}).join('')},
 craft(){let h='<h2>Craft</h2><p class="dim">Merge 5 identical items into one of the next rarity. Failure destroys the 5. Craft sense adds +1% per level.</p>';
  const rows=S.inv.map((s,i)=>({s,i})).filter(x=>x.s.n>=5&&x.s.r<8);
  if(!rows.length)h+='<div class="row dim">Collect 5 or more of the same item and rarity.</div>';
  return h+rows.map(({s,i})=>`<div class="row"><div class="grow">${iname(s.id,s.r)} x${s.n}<div class="dim">${RARITY[s.r]} to ${RARITY[s.r+1]}: ${craftChance(s.r)}%</div></div><button onclick="doCraft(${i})">Merge 5</button>${rbadge(s.r)}</div>`).join('')},
 bag(){const st=stats();
  let h=`<h2>Bag</h2><div class="row dim">Damage ${fx(st.dmg)} ${st.elem?'(elemental)':''} | Max HP ${st.maxHp} | Attack every ${(st.atk/1000).toFixed(2)}s | Crit ${(st.crit*100).toFixed(1)}% x${st.critMul.toFixed(1)} | Dodge ${(st.dodge*100).toFixed(0)}% | Regen ${fx(st.regen)}/s</div><h3>Equipped</h3>`;
  h+=EQSLOTS.map(([k,n])=>{const e=S.eq[k];return`<div class="row"><div class="grow dim">${n}: ${e?`${iname(e.id,e.r)} ${e.bonus?`<span class="dim">(+${e.bonus.toFixed(2)}x)</span>`:''}`:'empty'}</div>${e?`<button class="alt" onclick="unequip('${k}')">Unequip</button>`:''}${e?rbadge(e.r):''}</div>`}).join('');
  h+=`<h3>Items (${S.inv.length}/${maxSlots()} slots, 50 per stack)</h3>`;
  if(!S.inv.length)h+='<div class="row dim">Empty.</div>';
  S.inv.forEach((s,i)=>{const it=ITEMS[s.id];
   h+=`<div class="row"><div class="grow">${iname(s.id,s.r)} x${s.n}<div class="dim">${desc(s.id,s.r)}</div></div>${it.slot==='potion'?`<button onclick="usePotion(${i})">Use</button>`:it.slot?`<button onclick="equip(${i})">Equip</button>`:''}<button class="alt" onclick="sell(${i})">Sell 1 (${sellVal(s.id,s.r)})</button>${s.n>1?`<button class="alt" onclick="sell(${i},1)">Sell all</button>`:''}${rbadge(s.r)}</div>`});
  return h},
 book(){
  let h='<h2>Book</h2><details open><summary>Classes</summary>'+Object.entries(CLASSES).map(([k,c])=>`<p>${spr(c.i,48)}<b style="color:${c.color}">${c.name}</b><br>${perks(k)}</p>`).join('')+'<p class="dim">Weapon Strength: weapon damage. Elemental Strength: wand and spell damage. Luck: loot rarity. Health Regen: regen speed. Physical Strength: crit chance (base 1/15, times the multiplier). Speed: attack speed.</p></details>';
  h+='<details><summary>Skills</summary>'+SKILLS.map(s=>`<p><b>${s.name}</b> (${s.cat}): ${s.desc}</p>`).join('')+'</details>';
  h+='<details><summary>Items</summary>'+Object.values(ITEMS).filter(i=>!i.mat).map(i=>`<p><b>${i.name}</b>: ${desc(i.id,0)}</p>`).join('')+'<p class="dim">Rarity multiplies stats by 1.7x per tier: '+RARITY.join(', ')+'.</p><p class="dim">Relics gain +0.01x every 10 mob-hunt waves cleared, then 11, 12 and so on. Unequipping a relic keeps nothing: the bonus stays on the equipped relic only.</p></details>';
  h+='<details><summary>Structures and mobs</summary>'+STRUCTS.map(s=>`<p><b>${s.name}</b> (${s.kind==='mob'?'mob hunt':'loot'}): ${s.mobs.map(m=>MOBS[m].name+' drops '+ITEMS[MOBS[m].remain].name).join(', ')}</p>`).join('')+'</details>';
  h+='<details><summary>Rules</summary><p>Stopping or dying starts a 1 minute run cooldown. Dying loses the run loot and half your gold (rounded down).</p></details>';
  return h}
};

// ---------- live updates ----------
function upd(){
 if(!S)return;const st=stats(),now=Date.now();
 const g=$('#gold');if(g)g.textContent=Math.floor(S.gold);
 const hb=$('#hpbar');if(hb){hb.style.width=Math.max(0,S.hp/st.maxHp*100)+'%';$('#hptx').textContent=Math.ceil(S.hp)+'/'+st.maxHp}
 document.querySelectorAll('[data-cd]').forEach(e=>{const t=e.dataset.cd-now;e.textContent=t>0?fmt(t):'ready'});
 document.querySelectorAll('[data-s]').forEach(e=>{e.style.width=Math.min(100,(now-e.dataset.s)/(e.dataset.e-e.dataset.s)*100)+'%'});
 if(run&&tab==='jobs'&&$('#rlog')){
  $('#rwave').textContent=(run.kind==='mob'?'Wave ':'Room ')+run.wave;
  $('#rmobs').innerHTML=run.mobs.length?run.mobs.map(m=>`<div>${m.name} ${Math.max(0,Math.ceil(m.hp))}/${m.max}<div class="bar red"><i style="width:${Math.max(0,m.hp/m.max*100)}%"></i></div></div>`).join(''):(run.prompt?'':'Searching...');
  $('#rloot').innerHTML=run.loot.length?run.loot.map(l=>`${iname(l.id,l.r)} x${l.n}`).join(', '):'Nothing yet';
  $('#rlog').innerHTML=run.log.join('<br>');
 }
 const sb=$('#startbtn');if(sb)sb.disabled=now<S.cd;
 const rb=$('#rerollbtn');if(rb)rb.disabled=S.shop.t-now<=60000;
 document.querySelectorAll('[data-ms]').forEach(e=>{e.style.width=Math.min(100,(+e.dataset.f0+(now-e.dataset.t0)/e.dataset.ms)*100)+'%'});
}
let last=Date.now();
function loop(){
 if(!S)return;const now=Date.now(),dt=Math.min(now-last,1000);last=now;const st=stats();
 S.hp=Math.min(st.maxHp,S.hp+st.regen*dt/1000);
 if(S.train&&now>=S.train.end){const id=S.train.id;S.sk[id]++;S.prog[id]=0;S.train=null;toast(SKILLS.find(s=>s.id===id).name+' is now level '+S.sk[id]);save();render()}
 if(now>=S.shop.t){genShop();if(tab==='shop')render()}
 if(farm&&now>=farm.end){const n=Math.max(1,Math.round(rnd(1,3)*st.jobM));if(addItem(farm.res,0,n))toast('Bag is full');farm.start=now;farm.end=now+farmMs();if(tab==='bag'||tab==='quests'||tab==='craft')render()}
 if(run){stepRun(dt,st);if(S.hp<=0)die()}
 upd();
}
S=load();if(S){S.prog=S.prog||{};if(S.train&&!S.train.ms)S.train={id:S.train.id,start:S.train.start,f0:0,ms:S.train.end-S.train.start,end:S.train.end}}
render();
setInterval(loop,100);setInterval(save,5000);
