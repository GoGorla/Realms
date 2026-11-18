// ===== Hollowmark game logic =====
const $=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fx=n=>n>=100?Math.round(n):(Math.round(n*10)/10);
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const SAVE='hollowmark_save';
let S=null,run=null,farm=null,tab='train',sub='mob',selB=null,drag=null;
const TABS={train:'Train',jobs:'Jobs',shop:'Shop',town:'Town',quests:'Quests',craft:'Craft',bag:'Bag',book:'Book'};

function fresh(cls){
 const sk={};SKILLS.forEach(s=>sk[s.id]=0);
 return{cls,gold:50,sk,train:null,prog:{},tw:{},loc:'home',trip:null,best:0,abCd:0,qr:0,cds:{mob:0,explore:0,boss:0},
  inv:[{id:'potion',r:0,n:3}],eq:{weapon:{id:START[cls]||'club',r:0}},house:0,shop:null,quests:[],hp:1,opts:{loot:true,remains:true}};
}
function load(){try{return JSON.parse(localStorage.getItem(SAVE))}catch(e){return null}}
function save(){if(S)localStorage.setItem(SAVE,JSON.stringify(S))}
function toast(t){const d=document.createElement('div');d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2800)}

// ---------- stats ----------
const cm=x=>{const v=CLASSES[S.cls].m[x];return v===undefined?1:v};
const relics=()=>['relic1','relic2','relic3'].map(k=>S.eq[k]).filter(Boolean);
const relM=t=>relics().filter(e=>ITEMS[e.id].type===t).reduce((a,e)=>a*(t==='regen'?3:1+.1*(e.r+1)+(e.bonus||0)),1);
function stats(){
 const k=S.sk;let hpI=0,spd=0;
 for(const sl of['chest','gloves','boots']){const e=S.eq[sl];if(e){const it=ITEMS[e.id];hpI+=it.hp*rmult(e.r);spd+=it.spd*(1+.3*e.r)}}
 const w=S.eq.weapon,wi=w&&ITEMS[w.id],kd=wi&&wi.kind,elem=kd==='elem';
 const base=(10+k.basedmg*2)*relM('dmg')+(wi?wi.dmg*rmult(w.r):0);
 const km={phys:'weapon',range:'range',elem:'elem',splash:'splash'},sm={phys:'swing',range:'swing',elem:'mind',splash:'mind'};
 const dmg=(kd?base*cm(km[kd])*(1+.08*k[sm[kd]]):base*(1+.08*k.swing))*cm('all');
 return{maxHp:Math.round((100+k.basehp*10+hpI)*cm('health')*relM('hp')),dmg,elem,
  atk:2000/(cm('speed')*(1+.05*k.speed)*(1+spd)),crit:Math.min(.95,cm('phys')*cm('all')/15),critMul:1.5+.1*k.tactics,
  regen:(.5+.3*k.tough)*cm('regen')*relM('regen'),dodge:Math.min(.9,(1/25+.01*k.dodge)*cm('dodge')),resist:k.resist*.5,spdBonus:spd,
  luck:cm('luck')*(1+.06*k.looting)*(1+.04*k.luck),jobM:1+.12*S.house,skillM:1+.15*S.house};
}
const totalLv=()=>Object.values(S.sk).reduce((a,b)=>a+b,0);
function trainMs(id){const k=S.sk;return SKILLS.find(x=>x.id===id).base*1000*(1+k[id]*.4)*(1+totalLv()/25)/((id==='focus'?1:1+.1*k.focus)*(1+.15*S.house))}

// ---------- inventory ----------
const maxSlots=()=>60+(S.eq.pack?ITEMS.backpack.slots*(S.eq.pack.r+1):0);
function addItem(id,r,n=1,inv=S.inv){
 for(const s of inv)if(s.id===id&&s.r===r&&s.n<50){const t=Math.min(n,50-s.n);s.n+=t;n-=t;if(!n)return 0}
 while(n>0&&(inv!==S.inv||inv.length<maxSlots())){const t=Math.min(n,50);inv.push({id:id,r:r,n:t});n-=t}
 return n;
}
function take(i,n){const s=S.inv[i];s.n-=n;if(s.n<=0)S.inv.splice(i,1)}
const icon=(id,sz)=>ICON[id]===undefined?`<span class="ic0" style="--is:${sz}px">${ITEMS[id].name[0]}</span>`:`<span class="ic" style="--n:${ICON[id]};--is:${sz}px"></span>`;
const iname=(id,r)=>`${icon(id,22)} <b class="rn" style="color:${RCOLOR[r]};-webkit-text-stroke:2px ${RDARK[r]}">${r?RARITY[r]+' ':''}${ITEMS[id].name}</b>`;
const rbadge=r=>`<span class="rar rn" style="color:${RCOLOR[r]};-webkit-text-stroke:2px ${RDARK[r]}">${RARITY[r]}</span>`;
const unitPrice=(id,r)=>Math.round(ITEMS[id].price*Math.pow(2.1,r));
const sellVal=(id,r)=>Math.max(1,Math.floor(unitPrice(id,r)*.4*(1+.01*S.sk.bargain)));
function desc(id,r){const it=ITEMS[id],m=rmult(r);
 if(it.kind)return`${{phys:'Weapon',elem:'Elemental',range:'Range',splash:'Splash'}[it.kind]} damage +${fx(it.dmg*m)}${it.only?' (Sorcerer only)':''}`;
 if(it.heal)return`Restores ${fx(it.heal*m)} HP`;
 if(it.type==='regen')return'Permanent 3x health regen';
 if(it.type)return`x${(1+.1*(r+1)).toFixed(2)} base ${it.type==='dmg'?'damage':'health'}, grows +0.01 per milestone`;
 if(it.slots)return`+${it.slots*(r+1)} bag slots`;
 if(it.slot==='gloves')return`Attack speed +${Math.round(it.spd*(1+.3*r)*100)}%`;
 if(it.hp!==undefined)return`Base health +${fx(it.hp*m)}`;
 return'Material';}
function rollR(luck){let r=0;while(r<8&&Math.random()<Math.min(.85,.32*luck/(1+.7*r)))r++;return r}
function sellPool(){return Object.values(ITEMS).filter(i=>i.slot&&!i.boss&&(!i.only||i.only===S.cls))}

// tile for the bag grid: coloured square, image, name, rarity
function tile(id,r,n,extra,cls){
 return`<div class="tile ${cls||''}" style="--bg:${RCOLOR[r]};--bd:${RBORDER[r]}" ${extra||''}>${n>1?`<i class="cnt">${n}</i>`:''}<div class="timg">${icon(id,40)}</div><div class="tn">${ITEMS[id].name}</div><div class="tr">${RARITY[r]}</div></div>`;
}

// ---------- shop ----------
function genShop(){
 const keep=S.shop?S.shop.items.filter(e=>e.star&&!e.sold):[];
 const f=S.sk.shopfame,n=rnd(5,10)+Math.floor(f/4),pool=sellPool(),items=keep.slice();
 for(let i=items.length;i<n;i++){const it=pick(pool),r=rollR(1+.08*f);items.push({id:it.id,r,sold:false,star:false})}
 S.shop={t:Date.now()+600000,items};
}
const buyPrice=(id,r)=>Math.max(1,Math.floor(unitPrice(id,r)*Math.max(.3,1-.02*S.sk.bargain)));
function buy(i){const e=S.shop.items[i],p=buyPrice(e.id,e.r);
 if(S.gold<p)return toast('Not enough gold');
 if(addItem(e.id,e.r))return toast('Bag is full');
 S.gold-=p;e.sold=true;e.star=false;save();render()}
function toggleStar(i){const e=S.shop.items[i];if(e.sold)return;e.star=!e.star;save();render()}
function reroll(){const now=Date.now();if(S.shop.t-now<=60000)return;S.shop.t=Math.max(S.shop.t-60000,now+60000);save();render()}

// ---------- bag ----------
const viewOnly=()=>{if(run){toast('In battle you can only look at your bag');return true}return false};
function equip(i){if(viewOnly())return;const s=S.inv[i],it=ITEMS[s.id];
 if(it.only&&it.only!==S.cls)return toast('Only '+CLASSES[it.only].name+'s can use this');
 let slot=it.slot;
 if(slot==='relic'){slot=['relic1','relic2','relic3'].find(k=>!S.eq[k]);if(!slot)return toast('All 3 relic slots are full. Unequip one first.')}
 const old=S.eq[slot];
 if(old&&addItem(old.id,old.r,1))return toast('Bag is full');
 take(S.inv.indexOf(s),1);
 S.eq[slot]={id:s.id,r:s.r,bonus:0,prog:0};selB=null;
 save();render()}
function unequip(slot){if(viewOnly())return;const e=S.eq[slot];if(!e)return;if(addItem(e.id,e.r,1))return toast('Bag is full');delete S.eq[slot];selB=null;save();render()}
function usePotion(i,force){if(!force&&viewOnly())return;const s=S.inv[i],st=stats();S.hp=Math.min(st.maxHp,S.hp+ITEMS.potion.heal*rmult(s.r));take(i,1);selB=null;save();render()}
function usePotionBest(){const i=S.inv.findIndex(s=>s.id==='potion');if(i<0)return toast('No potions');usePotion(i,true)}
function sell(i,all){if(viewOnly())return;const s=S.inv[i],n=all?s.n:1;S.gold+=sellVal(s.id,s.r)*n;take(i,n);selB=null;save();render()}
function selInv(i){selB={t:'i',i};render()}
function selEq(k){selB={t:'e',k};render()}
function closeSel(){selB=null;render()}
function moveItem(i,j){
 const a=S.inv[i];if(!a)return render();
 if(j>=S.inv.length)j=S.inv.length-1;
 if(i!==j){const b=S.inv[j];
  if(b.id===a.id&&b.r===a.r&&b.n<50){const t=Math.min(a.n,50-b.n);b.n+=t;a.n-=t;if(a.n<=0)S.inv.splice(i,1)}
  else{S.inv[i]=b;S.inv[j]=a}}
 selB=null;save();render();
}
function bagDown(e,i){
 if(run){selInv(i);return}
 drag={i,x:e.clientX,y:e.clientY,on:false,el:e.currentTarget,touch:e.pointerType!=='mouse'};
 if(drag.touch)drag.timer=setTimeout(startDrag,260);
}
function startDrag(){if(!drag||drag.on)return;drag.on=true;const g=drag.el.cloneNode(true);g.classList.add('ghost');document.body.appendChild(g);drag.g=g;moveGhost();drag.el.style.opacity=.35}
function moveGhost(){drag.g.style.left=(drag.x-45)+'px';drag.g.style.top=(drag.y-45)+'px'}
document.addEventListener('pointermove',e=>{if(!drag)return;
 if(!drag.on){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){if(drag.touch){clearTimeout(drag.timer);drag=null}else startDrag()}return}
 drag.x=e.clientX;drag.y=e.clientY;moveGhost()});
document.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;clearTimeout(d.timer);drag=null;
 if(d.on){d.g.remove();const t=document.elementFromPoint(e.clientX,e.clientY),sl=t&&t.closest&&t.closest('[data-slot]');if(sl)moveItem(d.i,+sl.dataset.slot);else render()}
 else selInv(d.i)});
document.addEventListener('pointercancel',()=>{if(drag){clearTimeout(drag.timer);if(drag.g){drag.g.remove();render()}drag=null}});
document.addEventListener('touchmove',e=>{if(drag&&drag.on)e.preventDefault()},{passive:false});

// ---------- training (one skill at a time, paused during jobs) ----------
const busy=()=>!!(run||farm);
function trainFrac(id){const t=S.train;if(t&&t.id===id)return Math.min(1,t.f0+(Date.now()-t.start)/t.ms);return S.prog[id]||0}
function startTrain(id){
 if(busy())return toast('You cannot train during a job');
 if(S.train&&S.train.id===id)return;
 if(S.train)S.prog[S.train.id]=Math.min(.999,trainFrac(S.train.id));
 const ms=trainMs(id),f0=S.prog[id]||0,now=Date.now();
 S.train={id,start:now,f0,ms,end:now+(1-f0)*ms};save();render()}
function stopTrain(){if(!S.train||busy())return;S.prog[S.train.id]=Math.min(.999,trainFrac(S.train.id));S.train=null;save();render()}

// ---------- runs ----------
const cdKey=k=>k==='boss'?'boss':k==='mob'?'mob':'explore';
function newRun(kind,st,mobs){return{kind,s:st,wave:1,mobs:mobs||[],allies:[],dead:[],prompt:false,scen:null,merchant:null,dig:0,mobsMod:0,lootM:1,shift:0,rush:false,wait:800,pT:stats().atk,loot:[],gold:0,log:['Entered '+st.name+'.']}}
function startRun(kind){
 if(run||Date.now()<S.cds[cdKey(kind)])return;if(S.trip)return toast('You are traveling');farm=null;
 run=newRun(kind,pick(STRUCTS.filter(x=>x.kind===kind)));render();
}
function startBoss(){
 if(S.best<25)return toast('Reach wave 25 in mob hunt to unlock the boss');
 if(run||Date.now()<S.cds.boss)return;if(S.trip)return toast('You are traveling');farm=null;
 const b=BOSS;run=newRun('boss',{name:b.name+' Dungeon'},[{id:'boss',name:b.name,max:b.hp,hp:b.hp,dmg:b.dmg,mT:b.iv,iv:b.iv,gold:b.gold}]);render();
}
function startTrainer(){
 const t=TOWNS.find(x=>x.id===S.loc);if(!t||run||S.trip)return;farm=null;
 const m=1+.5*(S.tw[t.id]||0),hp=Math.round(300*m);
 run=newRun('trainer',{name:t.trainer+', trainer of '+t.name},[{id:'trainer',name:t.trainer,max:hp,hp,dmg:16*m,mT:1500,iv:1500,gold:0}]);run.town=t;render();
}
function travel(id){if(run||S.trip||S.loc===id)return;S.trip={to:id,end:Date.now()+60000};save();render()}
function endRun(){
 if(run&&run.kind==='trainer'){run=null;toast('You walked away from the duel.');save();render();return}
 if(run){let lost=0;for(const l of run.loot)lost+=addItem(l.id,l.r,l.n);if(lost)toast('Bag full: '+lost+' items lost');
  toast('Run ended. Wave '+(run.prompt?run.wave-1:run.wave)+', +'+run.gold+' gold');S.cds[cdKey(run.kind)]=Date.now()+60000}
 run=null;S.hp=stats().maxHp;save();render();
}
function die(){
 const tr=run&&run.kind==='trainer';
 if(!tr){S.gold=Math.floor(S.gold/2);S.cds[cdKey(run.kind)]=Date.now()+60000}
 run=null;S.hp=Math.ceil(stats().maxHp*.25);
 toast(tr?'You lost the duel.':'You died. Run loot lost and half your gold.');save();render();
}
function logR(t){run.log.unshift(t);run.log.length=Math.min(run.log.length,8)}
// ----- effects -----
function floatAt(el,txt,cls){if(!el)return;const b=el.getBoundingClientRect(),d=document.createElement('div');d.className='fl '+cls;d.textContent=txt;d.style.left=(b.left+b.width*(.25+Math.random()*.5))+'px';d.style.top=(b.top+b.height*.3)+'px';$('#fx').appendChild(d);setTimeout(()=>d.remove(),900)}
function shake(){const m=$('main');if(!m)return;m.classList.remove('shake');void m.offsetWidth;m.classList.add('shake')}
function hurtFx(txt,cls){const h=$('.hpw');floatAt(h,txt,cls);if(h){h.classList.add('pulse');setTimeout(()=>h.classList.remove('pulse'),180)}}
const rowOf=m=>{const el=$('#rmobs');return el&&el.children[run.mobs.indexOf(m)]};
// ----- status effects: burning, poisoned, bleeding -----
function addFx(m,type,ms){m.fx=m.fx||{};m.fx[type]={left:ms,tk:1000,acc:0,sp:0,sp1:1000}}
const others=(m,type)=>run.mobs.filter(x=>x!==m&&x.hp>0&&!(x.fx&&x.fx[type]));
function statusTick(dt,st){
 const r=run;
 for(const m of r.mobs.slice()){if(!m.fx)continue;
  for(const k of Object.keys(m.fx)){const e=m.fx[k],D=FXDEF[k];
   m.hp-=D.dps*Math.min(dt,e.left)/1000;e.acc+=D.dps*Math.min(dt,e.left)/1000;e.left-=dt;e.tk-=dt;
   if(e.tk<=0){e.tk+=1000;if(e.acc>=1)floatAt(rowOf(m),Math.round(e.acc),D.cls);e.acc=0;
    if(k==='poison'&&e.left>0&&Math.random()<.1){const o=others(m,'poison').sort(()=>Math.random()-.5).slice(0,rnd(2,3));
     o.forEach(x=>addFx(x,'poison',e.left));if(o.length)logR('The poison spreads!')}}
   if(k==='burn'&&!e.sp){e.sp1-=dt;if(e.sp1<=0){e.sp=1;const o=others(m,'burn');if(o.length){addFx(pick(o),'burn',5000);logR('The fire spreads!')}}}
   if(e.left<=0)delete m.fx[k]}}
 const dead=r.mobs.filter(m=>m.hp<=0);
 for(const m of dead){kill(m,st);r.mobs.splice(r.mobs.indexOf(m),1)}
 if(dead.length&&!r.mobs.length){waveClear();return true}
 return false;
}
// every 5 waves the rarity band shifts up one step; at the top band Eternal is 1x
function rollWave(w,luck){
 const sh=Math.min(8,Math.floor((w-1)/5)),ws=[];let tot=0;
 for(let i=0;i<9;i++){const k=i-sh,wt=k<0?0:(1+(luck-1)*k*.25)/RSPAWN[k];ws.push(wt);tot+=wt}
 let x=Math.random()*tot;for(let i=0;i<9;i++){x-=ws[i];if(x<=0)return i}return sh;
}
function dropOne(st){const pool=sellPool();pool.push(ITEMS.potion,ITEMS.potion);
 const it=pick(pool),r=rollWave(run.wave,st.luck*(run.lootM||1));addRun(it.id,r,1);logR('Loot: '+RARITY[r]+' '+it.name)}
function addRun(id,r,n){const l=run.loot.find(x=>x.id===id&&x.r===r);l?l.n+=n:run.loot.push({id,r,n})}
function spawn(id,w,st){const D=MOBS[id],hp=Math.round(D.hp*(1+.3*(w-1)));return{id,name:D.name,max:hp,hp,dmg:D.dmg*(1+.2*(w-1)),mT:1500+rnd(0,500),iv:1500,gold:Math.round(D.gold*(1+.15*(w-1))*st.jobM),remain:D.remain}}
function summon(r){
 if(S.cls!=='necromancer'||!r.dead.length)return;
 const src=r.dead.slice().sort(()=>Math.random()-.5).slice(0,3);
 r.allies=r.allies.filter(a=>a.perm).concat(src.map(d=>({name:'Risen '+d.name,max:Math.round(d.max*.5),hp:Math.round(d.max*.5),dmg:d.dmg,aT:1500,iv:1500})));
 logR('You raise '+src.length+' fallen mobs!');shake();
}
function makeScen(){
 const sc=pick(SCEN),o=sc.o.map(x=>({n:x[0],fx:x[1]}));
 if(Math.random()<1/25)o.push({n:pick(['Secret path','Secret cave','Secret room']),fx:{secret:1,loot:10}});
 return{t:sc.t,o};
}
function chooseOpt(i){
 const r=run;if(!r||!r.scen)return;const o=r.scen.o[i],f=o.fx;
 r.mobsMod=f.mobs||0;r.lootM=f.loot||1;
 if(f.heal){const mx=stats().maxHp;S.hp=Math.min(mx,S.hp+mx*f.heal)}
 logR(f.secret?'You found a '+o.n.toLowerCase()+'! Mobs drop 10x better loot.':'You chose: '+o.n);
 r.prompt=false;r.scen=null;r.wait=600;render();
}
function merchantBuy(i){const e=run.merchant.items[i];if(e.sold||S.gold<e.p)return;
 if(addItem(e.id,e.r))return toast('Bag is full');S.gold-=e.p;e.sold=true;render()}
function leaveMerchant(){run.merchant=null;run.wave++;run.wait=800;render()}
function encounter(st){
 const r=run,w=r.wave,k=r.kind;let type='mob';
 if(k==='explore'){
  if(Math.random()<1/50){ // merchant: 10-20 Rare+ items, each one rarer than the last, 40% off
   const pool=sellPool(),n=rnd(10,20),items=[];
   for(let i=0;i<n;i++){const it=pick(pool),rr=Math.min(8,2+Math.floor(i*7/n));items.push({id:it.id,r:rr,p:Math.max(1,Math.floor(buyPrice(it.id,rr)*.6)),sold:false})}
   r.merchant={items};logR('A traveling merchant waves you over!');toast('A traveling merchant!');render();return}
  const x=Math.random();type=x<.25?'trap':x<.45?'chest':x<.55?'treasure':'mob'}
 if(k==='raid')type=Math.random()<.6?'mob':'house';
 if(type==='trap'){
  if(Math.random()<st.dodge)logR('You dodge a trap.');
  else{const d=Math.max(1,Math.round(8*(1+.2*w)-st.resist));S.hp-=d;hurtFx('-'+d,'hurt');logR('Trap! -'+d+' HP')}
  r.wave++;r.wait=1200;return}
 if(type==='chest'){dropOne(st);if(Math.random()<.5)dropOne(st);logR('Opened a chest.');r.wave++;r.wait=1200;return}
 if(type==='house'){const g=Math.round(rnd(5,15)*(1+.15*w)*st.jobM);S.gold+=g;r.gold+=g;dropOne(st);if(Math.random()<.5)dropOne(st);logR('Looted a house: +'+g+' gold');r.wave++;r.wait=1200;return}
 if(type==='treasure'){r.dig=30000;logR('You found a buried treasure. Digging for 30 seconds...');return}
 const n=k==='mob'?Math.max(1,Math.min(8,rnd(2,3)+Math.floor((w-1)/5)+(r.mobsMod||0))):k==='raid'?Math.min(6,rnd(2,3)+Math.floor((w-1)/6)):1;
 r.mobs=[];for(let i=0;i<n;i++)r.mobs.push(spawn(pick(r.s.mobs),w,st));
 r.pT=st.atk;summon(r);if(n>1)logR((k==='mob'?'Wave ':'Room ')+w+': '+n+' enemies appear!');
}
function kill(m,st){
 const r=run;S.gold+=m.gold;r.gold+=m.gold;
 if(r.kind==='trainer'){logR('Trainer defeated!');return}
 logR(m.name+' slain. +'+m.gold+' gold');if(r.kind==='boss')return;
 if(S.cls==='necromancer'){r.dead.push({name:m.name,max:m.max,dmg:m.dmg});if(r.dead.length>20)r.dead.shift()}
 const lm=r.lootM||1;
 if(S.opts.loot&&Math.random()<Math.min(1,(.4+.02*S.sk.looting)*lm)){dropOne(st);if(Math.random()<.03*S.sk.looting)dropOne(st)}
 if(S.opts.remains){const n=1+(Math.random()<.3?1:0);addRun(m.remain,0,n);logR('Remains: '+n+' '+ITEMS[m.remain].name)}
}
function waveClear(){
 const r=run;
 if(r.kind==='trainer'){const t=r.town;S.sk[t.skill]+=5;S.tw[t.id]=(S.tw[t.id]||0)+1;
  toast(t.trainer+' taught you: '+SKILLS.find(x=>x.id===t.skill).name+' +5 levels!');run=null;save();render();return}
 if(r.kind==='boss'){if(Math.random()<BOSS.chance){addRun(BOSS.drop,0,1);toast("The Goblin Lord dropped Goblin Lord's Ear!")}
  toast('Boss defeated!');endRun();return}
 if(r.kind==='mob')for(const sl of['relic1','relic2','relic3']){const e=S.eq[sl];if(!e||ITEMS[e.id].type==='regen')continue;
  e.prog=(e.prog||0)+1;if(e.prog>=10+Math.round((e.bonus||0)*100)){e.prog=0;e.bonus=Math.round(((e.bonus||0)+.01)*100)/100;logR(ITEMS[e.id].name+' grew +0.01x')}}
 r.wave++;r.mobs=[];r.allies=r.allies.filter(a=>a.perm);r.lootM=1;r.mobsMod=0;
 if(r.kind==='mob'){
  S.best=Math.max(S.best,r.wave);
  if((r.wave-1)%5===0){S.gold+=200;r.gold+=200;logR('+200 coins for clearing wave '+(r.wave-1));toast('+200 coins')}
  r.prompt=true;r.scen=makeScen();toast('Wave '+(r.wave-1)+' cleared. Choose your way.');render()}
 else r.wait=900;
}
function strike(m,d,st,crit){
 const r=run;m.hp-=d;m.hit=Date.now();
 floatAt(rowOf(m),fx(d)+(crit?'!':''),crit?'crit':'dmg');
 if(m.hp<=0){kill(m,st);r.mobs.splice(r.mobs.indexOf(m),1);if(!r.mobs.length){waveClear();return true}}
 return false;
}
// ----- class abilities -----
function useAbility(){
 const r=run;if(!r||Date.now()<S.abCd)return;
 const st=stats(),A=ABIL[S.cls],c=S.cls,boss=r.kind==='boss'||r.kind==='trainer';
 const needMob=['knight','sorcerer','orc','barbarian','ranger','warlock','assassin','alchemist'].includes(c);
 if(r.prompt||r.merchant)return toast('Use abilities during a fight');
 if(needMob&&!r.mobs.length)return toast(A.name+' needs enemies');
 if(c==='rogue'&&(r.mobs.length||r.dig>0))return toast('Search works once the wave is done');
 if((c==='warlock'||c==='assassin')&&boss)return toast(A.name+' does not work on bosses');
 if(c==='necromancer'&&!r.dead.length)return toast('You have not killed anything to raise yet');
 logR('You use '+A.name+'!');
 if(c==='knight'){shake();if(strike(r.mobs[0],st.dmg*3,st,true)){S.abCd=Date.now()+A.cd*1000;return}}
 else if(c==='sorcerer'){r.mobs.forEach(m=>addFx(m,'burn',5000));shake()}
 else if(c==='orc'){for(let i=0;i<3;i++)r.allies.push({name:'Goblin',max:20,hp:20,dmg:5,aT:500,iv:500})}
 else if(c==='druid'){r.shift=rnd(1,3);logR('You will dodge the next '+r.shift+' attack'+(r.shift>1?'s':'')+'.')}
 else if(c==='rogue'){const n=rnd(2,4);for(let i=0;i<n;i++)dropOne(st);logR('You search the area and find '+n+' items.')}
 else if(c==='barbarian'){
  if(Math.random()<.25){const l=st.maxHp*.25;S.hp=Math.max(1,S.hp-l);hurtFx('-'+Math.round(l),'hurt');logR('The rush backfires! You lose 25% health.')}
  else{r.rush=true;logR('Your next hit does 5x damage!')}}
 else if(c==='ranger'){const m=r.mobs[0],d=rnd(1,10);addFx(m,'poison',d*1000);floatAt(rowOf(m),d+'s poison','poison');logR('Poisoned Arrow: '+m.name+' is poisoned for '+d+' seconds.')}
 else if(c==='warlock'){
  if(Math.random()<1/7){logR('Rush! Every enemy is destroyed.');shake();for(const m of r.mobs.slice())kill(m,st);r.mobs=[];S.abCd=Date.now()+A.cd*1000;waveClear();return}
  logR('Rush failed.')}
 else if(c==='assassin'){
  const m=r.mobs.reduce((a,b)=>b.max>a.max?b:a);shake();kill(m,st);r.mobs.splice(r.mobs.indexOf(m),1);
  if(!r.mobs.length){S.abCd=Date.now()+A.cd*1000;waveClear();return}
  r.mobs.forEach(x=>x.miss=true);logR('The next round of attacks will miss you.')}
 else if(c==='alchemist'){const x=rnd(0,2);
  if(x===0){S.hp=Math.min(st.maxHp,S.hp+100);hurtFx('+100','dodge');logR('Potion Pull: healed 100 HP.')}
  else if(x===1){r.mobs.forEach(m=>addFx(m,'burn',5000));logR('Potion Pull: burning potion!')}
  else{const m=pick(r.mobs),d=rnd(1,10);addFx(m,'poison',d*1000);floatAt(rowOf(m),d+'s poison','poison');logR('Potion Pull: '+m.name+' poisoned for '+d+' seconds.')}}
 else if(c==='necromancer'){
  let bi=0;r.dead.forEach((d,i)=>{if(d.max>r.dead[bi].max)bi=i});const d=r.dead.splice(bi,1)[0],hp=Math.round(d.max*.75);
  r.allies.push({name:'Undead '+d.name,max:hp,hp,dmg:d.dmg,aT:1500,iv:1500,perm:true});shake();logR('Raise Undead: a '+d.name+' rises at 0.75x health.')}
 S.abCd=Date.now()+A.cd*1000;save();
}
function stepRun(dt,st){
 const r=run;if(r.prompt||r.merchant)return;
 if(r.dig>0){r.dig-=dt;if(r.dig<=0){r.dig=0;for(let i=0;i<5;i++)dropOne(st);logR('Dug up the treasure: 5 pieces of loot!');r.wave++;r.wait=1200}return}
 if(!r.mobs.length){r.wait-=dt;if(r.wait<=0)encounter(st);return}
 if(statusTick(dt,st))return;
 r.pT-=dt;
 if(r.pT<=0){const m=r.mobs[0];let d=st.dmg;const c=Math.random()<st.crit;
  if(c){d*=st.critMul;shake();logR('Critical hit! '+fx(d))}
  if(r.rush){d*=5;r.rush=false;shake();logR('Adrenaline hit! '+fx(d))}
  r.pT+=st.atk;
  if(c&&m.hp>d)addFx(m,'bleed',4000);
  if(strike(m,d,st,c||false))return}
 for(const a of r.allies){a.aT-=dt;if(a.aT<=0){a.aT+=a.iv||1500;const m=r.mobs[0];if(!m)break;if(strike(m,a.dmg,st,false))return}}
 for(const m of r.mobs.slice()){m.mT-=dt;
  if(m.mT<=0){m.mT+=m.iv||1500;
   const al=r.allies.filter(a=>a.hp>0);
   if(m.miss){m.miss=false;logR(m.name+' missed you.')}
   else if(al.length&&Math.random()<.5)pick(al).hp-=m.dmg;
   else if(r.shift>0){r.shift--;logR('You dodged the '+m.name+' (ShapeShift).');hurtFx('Dodge','dodge')}
   else if(Math.random()<st.dodge){logR('You dodged the '+m.name+'.');hurtFx('Dodge','dodge')}
   else{const d=Math.max(1,m.dmg-st.resist);S.hp-=d;hurtFx('-'+fx(d),'hurt');if(r.kind==='boss'||r.kind==='trainer')shake()}}}
 r.allies=r.allies.filter(a=>a.hp>0);
}
function runPanel(){
 const r=run,A=ABIL[S.cls];
 return`<div class="row"><div class="grow"><b>${r.s.name}</b> <span class="dim" id="rwave"></span><div id="rmobs" style="margin-top:.4rem"></div><div id="rallies"></div></div><button class="alt" onclick="endRun()">Stop run</button></div>
 <div class="row"><div class="grow"><b>${A.name}</b> <span class="dim">${A.d}</span></div><span class="cd" data-cd="${S.abCd}"></span><button id="abbtn" onclick="useAbility()">Use</button></div>
 ${r.prompt&&r.scen?`<div class="row"><div class="grow"><b>Wave ${r.wave-1} cleared.</b> ${r.scen.t}</div>${r.scen.o.map((o,i)=>`<button ${o.fx.secret?'style="background:#f0c060"':''} onclick="chooseOpt(${i})">${o.n}</button>`).join('')}<button class="alt" onclick="endRun()">Stop run</button></div>`:''}
 ${r.merchant?`<h3>Traveling merchant (40% off, Rare and up)</h3>${r.merchant.items.map((e,i)=>`<div class="row"><div class="grow">${iname(e.id,e.r)}<div class="dim">${desc(e.id,e.r)}</div></div><span class="gold">${e.p}</span><button ${e.sold||S.gold<e.p?'disabled':''} onclick="merchantBuy(${i})">${e.sold?'Sold':'Buy'}</button>${rbadge(e.r)}</div>`).join('')}<div class="row"><button class="alt" onclick="leaveMerchant()">Leave the merchant</button></div>`:''}
 <h3>Run loot (kept if you survive)</h3><div id="rloot" class="log" style="min-height:60px"></div><h3>Log</h3><div id="rlog" class="log"></div>`;
}

// ---------- farming ----------
const farmMs=()=>8000/(1+.1*S.sk.productivity);
function startFarm(res){if(run)return toast('Finish your run first');farm={res,start:Date.now(),end:Date.now()+farmMs()};render()}
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
function rerollQuests(){if(Date.now()<S.qr)return;S.quests=[];for(let i=0;i<5;i++)S.quests.push(genQuest());S.qr=Date.now()+10000;save();render()}
function have(id){return S.inv.filter(s=>s.id===id).reduce((a,s)=>a+s.n,0)}
function doQuest(q){const x=S.quests[q];if(have(x.id)<x.n)return;let need=x.n;
 for(let i=S.inv.length-1;i>=0&&need>0;i--)if(S.inv[i].id===x.id){const t=Math.min(need,S.inv[i].n);take(i,t);need-=t}
 S.gold+=x.reward;S.quests[q]=genQuest();toast('Quest done: +'+x.reward+' gold');save();render()}

// ---------- rendering ----------
const spr=(i,s)=>`<div class="spr${i>=6?' x':''}" style="--i:${i}${s?';--s:'+s+'px':''}"></div>`;
const perks=cls=>{const c=CLASSES[cls];return Object.entries(c.m).map(([k,v])=>`<span class="chip" style="--c:${c.color}">${MLABEL[k]} ${v}x</span>`).join('')+(c.special?`<span class="chip" style="--c:${c.color}">Special: ${c.special}</span>`:'')};
function pickClass(){
 $('#app').innerHTML=`<main style="padding-bottom:2rem"><h2>Choose your role</h2><div class="cls">${Object.entries(CLASSES).map(([k,c])=>`<div class="card" style="--c:${c.color}">${spr(c.i)}<h3 style="margin:0;color:${c.color}">${c.name}</h3><div>${perks(k)}</div><div class="dim">Ability: <b>${ABIL[k].name}</b>. ${ABIL[k].d}</div><button onclick="choose('${k}')">Play as ${c.name}</button></div>`).join('')}</div></main>`;
}
function choose(k){S=fresh(k);S.hp=stats().maxHp;genShop();for(let i=0;i<5;i++)S.quests.push(genQuest());save();render()}
function resetGame(){if(confirm('Delete your save and start over?')){localStorage.removeItem(SAVE);S=null;run=null;farm=null;render()}}
const timer=(t)=>`<span class="cd" data-cd="${t}"></span>`;
const prog=(s,e)=>`<div class="bar amber"><i data-s="${s}" data-e="${e}"></i></div>`;

function header(){
 return`<header><h1>Hollowmark</h1><span class="gold">Gold <span id="gold">${S.gold}</span></span><div class="hpw"><span class="dim">HP</span><div class="bar red"><i id="hpbar"></i></div><span id="hptx" class="dim"></span></div><button class="alt" onclick="usePotionBest()">Drink potion</button><button class="alt" onclick="resetGame()">Reset</button></header>
 <nav>${Object.entries(TABS).map(([k,v])=>`<button class="tab ${k===tab?'on':''}" onclick="go('${k}')">${v}</button>`).join('')}</nav>`;
}
function classBox(){const c=CLASSES[S.cls];return`<div id="cbox" style="--c:${c.color}">${spr(c.i)}<div><b>${c.name}</b><div>${perks(S.cls)}</div></div></div>`}
function go(t){tab=t;render()}
function render(){
 if(!S){pickClass();return}
 $('#app').innerHTML=header()+`<main>${VIEW[tab]()}</main>`+classBox();upd();
}
function bagDetail(){
 if(!selB)return'';let id,r,n=1,btn='';const bat=!!run;
 if(selB.t==='i'){const s=S.inv[selB.i];if(!s){selB=null;return''}id=s.id;r=s.r;n=s.n;
  if(!bat){const it=ITEMS[id];btn=(it.slot==='potion'?`<button onclick="usePotion(${selB.i})">Use</button>`:it.slot?`<button onclick="equip(${selB.i})">Equip</button>`:'')+`<button class="alt" onclick="sell(${selB.i})">Sell 1 (${sellVal(id,r)})</button>`+(n>1?`<button class="alt" onclick="sell(${selB.i},1)">Sell all</button>`:'')}}
 else{const e=S.eq[selB.k];if(!e){selB=null;return''}id=e.id;r=e.r;if(!bat)btn=`<button class="alt" onclick="unequip('${selB.k}')">Unequip</button>`}
 return`<div class="row"><div class="grow">${iname(id,r)}${n>1?' x'+n:''}<div class="dim">${desc(id,r)}</div></div>${btn}<button class="alt" onclick="closeSel()">Close</button>${rbadge(r)}</div>`;
}

const VIEW={
 train(){let h='<h2>Train</h2><p class="dim">One skill at a time. Training pauses while you are on a job (hunting, exploring, raiding, boss, farming) and continues with the next level automatically. Each skill has its own base time (10s for the weakest, 25s for the best) and every level takes longer. Focus speeds up everything else.</p>';
  if(busy())h+='<div class="row">Training is paused while you are on a job.</div>';
  let cat='';
  for(const s of SKILLS){
   if(s.cat!==cat){cat=s.cat;h+=`<h3>${cat}</h3>`}
   const act=S.train&&S.train.id===s.id,f=trainFrac(s.id);
   const bar=act?`<div class="bar amber"><i data-act="1"></i></div>`:`<div class="bar amber"><i style="width:${f*100}%"></i></div>`;
   h+=`<div class="row"><div class="grow"><b>${s.name}</b> Lv ${S.sk[s.id]} <span class="dim">(rank ${s.rank+1}/${SKILLS.length}, base ${s.base.toFixed(1)}s)</span><div class="dim">${s.desc}</div>${bar}</div>
   ${act?`<span class="cd" data-trend="1"></span><button class="alt" ${busy()?'disabled':''} onclick="stopTrain()">Pause</button>`:`<span class="dim">${fmt((1-f)*trainMs(s.id))}</span><button ${busy()?'disabled':''} onclick="startTrain('${s.id}')">${S.train?'Switch':'Train'}</button>`}</div>`}
  return h},
 jobs(){
  if(sub==='raid')sub='explore';
  const SUBS=[['mob','Mob hunt'],['explore','Explore'],['boss','Boss dungeon'],['farm','Farm']];
  let h=`<h2>Jobs</h2><div class="sub">${SUBS.map(([k,v])=>`<button class="alt ${sub===k?'on':''}" onclick="sub='${k}';render()">${v}</button>`).join('')}</div>`;
  if(sub==='farm'){
   h+=`<p class="dim">Farm safely. Productivity speeds it up, houses raise yields. Sell goods in the Bag. Training pauses while you farm.</p>`;
   h+=FARM.map(f=>`<div class="row"><div class="grow"><b>${ITEMS[f].name}</b> <span class="dim">sells for ${ITEMS[f].price}</span>${farm&&farm.res===f?prog(farm.start,farm.end):''}</div>${farm&&farm.res===f?`${timer(farm.end)}<button class="alt" onclick="stopFarm()">Stop</button>`:`<button onclick="startFarm('${f}')">Farm</button>`}</div>`).join('');
   return h}
  const info={mob:'Fight waves of mobs from a random structure. Each wave is harder, and after every wave you choose which way to go. Every 5 waves you earn 200 coins.',
   explore:'Explore a random structure (traps, chests, buried treasure, wild mobs, and a 1 in 50 chance of a traveling merchant) or raid a village (fight guards and loot houses).',
   boss:"Face the Goblin Lord alone. He is 50x as hard as a normal mob and can drop Goblin Lord's Ear, a relic with permanent 3x health regen. Unlocks after you reach wave 25 in mob hunt."};
  h+=`<p class="dim">${info[sub]} Dying loses all run loot and half your gold.</p>`;
  h+=`<div class="row"><label><input type="checkbox" ${S.opts.loot?'checked':''} onchange="S.opts.loot=this.checked"> Get loot</label><label><input type="checkbox" ${S.opts.remains?'checked':''} onchange="S.opts.remains=this.checked"> Get mob remains</label></div>`;
  if(run)return h+runPanel();
  if(sub==='mob')h+=`<div class="row"><div class="grow">Mob hunt cooldown: ${timer(S.cds.mob)}</div><button class="startb" data-k="mob" onclick="startRun('mob')">Start run</button></div>`;
  else if(sub==='explore')h+=`<div class="row"><div class="grow">Explore cooldown: ${timer(S.cds.explore)}</div><button class="startb" data-k="explore" onclick="startRun('explore')">Explore</button><button class="startb" data-k="explore" onclick="startRun('raid')">Raid a village</button></div>`;
  else if(S.best<25)h+=`<div class="row"><div class="grow">Locked. Reach wave 25 in mob hunt to unlock. Your best: wave ${S.best}.</div></div>`;
  else h+=`<div class="row"><div class="grow">Boss cooldown: ${timer(S.cds.boss)}</div><button class="startb" data-k="boss" onclick="startBoss()">Enter dungeon</button></div>`;
  return h},
 shop(){
  let h=`<h2>Shop</h2><div class="row"><div class="grow">New stock in ${timer(S.shop.t)}<div class="dim">Stock refreshes every 10 minutes. Each reroll click takes 1 minute off the wait, down to 1 minute left. Star an item to keep it through rerolls until you buy it or unstar it. Bargaining lowers prices; shop fame improves stock.</div></div><button id="rerollbtn" ${S.shop.t-Date.now()<=60000?'disabled':''} onclick="reroll()">Reroll</button></div>`;
  S.shop.items.forEach((e,i)=>{const p=buyPrice(e.id,e.r);
   h+=`<div class="row"><div class="grow">${iname(e.id,e.r)}<div class="dim">${desc(e.id,e.r)}</div></div><span class="gold">${p}</span><button class="alt" ${e.sold?'disabled':''} onclick="toggleStar(${i})">${e.star?'Starred ★':'Star ☆'}</button><button ${e.sold||S.gold<p?'disabled':''} onclick="buy(${i})">${e.sold?'Sold':'Buy'}</button>${rbadge(e.r)}</div>`});
  return h},
 town(){const next=S.house+1,max=next>=HOUSES.length;
  const here=S.loc==='home'?'Home':TOWNS.find(t=>t.id===S.loc).name,dest=S.trip&&(S.trip.to==='home'?'Home':TOWNS.find(t=>t.id===S.trip.to).name);
  let h=`<h2>Town</h2><div class="row"><div class="grow"><b>${HOUSES[S.house]}</b><div class="dim">Skill XP x${(1+.15*S.house).toFixed(2)} (faster training). Job XP x${(1+.12*S.house).toFixed(2)} (more gold, bigger farm yields).</div></div></div>
  ${max?'<p>You own the finest home in the land.</p>':`<div class="row"><div class="grow">Next: <b>${HOUSES[next]}</b></div><span class="gold">${houseCost(next)}</span><button ${S.gold<houseCost(next)?'disabled':''} onclick="buyHouse()">Buy</button></div>`}`;
  h+=`<h3>Travel</h3><div class="row"><div class="grow">You are in <b>${here}</b>.${S.trip?` Traveling to <b>${dest}</b>: ${timer(S.trip.end)}`:''}<div class="dim">Each trip takes 1 minute. Every town has a trainer who raises one skill by 5 levels if you beat him.</div></div></div>`;
  if(run&&run.kind==='trainer')h+=runPanel();
  h+=`<div class="row"><div class="grow"><b>Home</b></div><button ${run||S.trip||S.loc==='home'?'disabled':''} onclick="travel('home')">Travel (1:00)</button></div>`;
  h+=TOWNS.map(t=>{const w=S.tw[t.id]||0,sk=SKILLS.find(x=>x.id===t.skill).name;
   return`<div class="row"><div class="grow"><b>${t.name}</b><div class="dim">Trainer ${t.trainer}: +5 ${sk} levels. 10x as hard as a normal mob${w?`, beaten ${w}x (tougher each time)`:''}.</div></div>${S.loc===t.id&&!S.trip?`<button ${run?'disabled':''} onclick="startTrainer()">Fight trainer</button>`:`<button ${run||S.trip||S.loc===t.id?'disabled':''} onclick="travel('${t.id}')">Travel (1:00)</button>`}</div>`}).join('');
  return h},
 quests(){return`<h2>Quests</h2><div class="row"><div class="grow dim">Reroll all 5 quests. Cooldown: ${timer(S.qr)}</div><button id="qrbtn" ${Date.now()<S.qr?'disabled':''} onclick="rerollQuests()">Reroll quests</button></div>`+S.quests.map((q,i)=>{const h=have(q.id);
  return`<div class="row"><div class="grow"><b>${q.who}</b> needs ${q.n} ${ITEMS[q.id].name}<div class="dim">You have ${h}. Reward ${q.reward} gold.</div></div><button ${h<q.n?'disabled':''} onclick="doQuest(${i})">Turn in</button></div>`}).join('')},
 craft(){let h='<h2>Craft</h2><p class="dim">Merge 5 identical items into one of the next rarity. Failure destroys the 5. Craft sense adds +1% per level.</p>';
  const rows=S.inv.map((s,i)=>({s,i})).filter(x=>x.s.n>=5&&x.s.r<8);
  if(!rows.length)h+='<div class="row dim">Collect 5 or more of the same item and rarity.</div>';
  return h+rows.map(({s,i})=>`<div class="row"><div class="grow">${iname(s.id,s.r)} x${s.n}<div class="dim">${RARITY[s.r]} to ${RARITY[s.r+1]}: ${craftChance(s.r)}%</div></div><button onclick="doCraft(${i})">Merge 5</button>${rbadge(s.r)}</div>`).join('')},
 bag(){const st=stats();
  let h=`<h2>Bag</h2>${run?'<div class="row dim">You are in a battle, so you can only look at your bag.</div>':'<p class="dim">Tap an item for options. Press and drag an item onto another slot to move or stack it.</p>'}
  <div class="row dim">Damage ${fx(st.dmg)} ${st.elem?'(elemental)':''} | Max HP ${st.maxHp} | Attack every ${(st.atk/1000).toFixed(2)}s | Crit ${(st.crit*100).toFixed(1)}% x${st.critMul.toFixed(1)} | Dodge ${(st.dodge*100).toFixed(0)}% | Regen ${fx(st.regen)}/s</div>${bagDetail()}<h3>Equipped</h3>`;
  h+='<div class="grid">'+EQSLOTS.map(([k,n])=>{const e=S.eq[k];return`<div class="cell"><div class="dim cap">${n}</div>${e?tile(e.id,e.r,1,`onclick="selEq('${k}')"`,selB&&selB.t==='e'&&selB.k===k?'sel':''):'<div class="tile empty"></div>'}</div>`}).join('')+'</div>';
  h+=`<h3>Items (${S.inv.length}/${maxSlots()} slots, 50 per stack)</h3><div class="grid">`;
  for(let k=0;k<maxSlots();k++){const s=S.inv[k];
   h+=s?tile(s.id,s.r,s.n,`data-slot="${k}" onpointerdown="bagDown(event,${k})"`,selB&&selB.t==='i'&&selB.i===k?'sel':''):`<div class="tile empty" data-slot="${k}"></div>`}
  return h+'</div>'},
 book(){
  let h='<h2>Book</h2><details open><summary>Classes</summary>'+Object.entries(CLASSES).map(([k,c])=>`<p>${spr(c.i,48)}<b style="color:${c.color}">${c.name}</b><br>${perks(k)}<br><span class="dim">Ability: <b>${ABIL[k].name}</b> (${ABIL[k].cd}s cooldown). ${ABIL[k].d}</span></p>`).join('')+'<p class="dim">All Damage multiplies every damage type and your crit chance. Weapon Strength: weapon damage. Elemental Strength: wand and spell damage. Range and Splash Strength: bows and flasks. Luck: loot rarity. Health Regen: regen speed. Physical Strength: crit chance (base 1/15, times the multiplier). Speed: attack speed.</p></details>';
  h+='<details><summary>Skills</summary>'+SKILLS.map(s=>`<p><b>${s.name}</b> (${s.cat}): ${s.desc}</p>`).join('')+'</details>';
  h+='<details><summary>Status effects</summary><p><b>Burning</b>: 5s, -20 damage per second, spreads to another mob after 1s.</p><p><b>Poisoned</b>: rolls 1 to 10s, -30 damage per second, 1 in 10 chance each second to spread to 2 or more mobs for the remaining time.</p><p><b>Bleeding</b>: 4s, -10 damage per second, caused by critical hits.</p></details>';
  h+='<details><summary>Items</summary>'+Object.values(ITEMS).filter(i=>!i.mat).map(i=>`<p>${icon(i.id,24)} <b>${i.name}</b>: ${desc(i.id,0)}</p>`).join('')+'<p class="dim">Rarity multiplies stats by 1.7x per tier: '+RARITY.join(', ')+'.</p><p class="dim">Relics gain +0.01x every 10 mob-hunt waves cleared, then 11, 12 and so on. Unequipping a relic keeps nothing: the bonus stays on the equipped relic only.</p></details>';
  h+='<details><summary>Structures and mobs</summary>'+STRUCTS.map(s=>`<p><b>${s.name}</b> (${({mob:'mob hunt',explore:'explore',raid:'raid'})[s.kind]}): ${s.mobs.map(m=>MOBS[m].name+' drops '+ITEMS[MOBS[m].remain].name).join(', ')}</p>`).join('')+'</details>';
  h+='<details><summary>Rules</summary><p>Stopping or dying starts a 1 minute cooldown for that job type (mob hunt, explore and boss each have their own). Dying loses the run loot and half your gold (rounded down). Finishing a run fully heals you.</p><p>Training pauses during any job. Boss dungeon unlocks at wave 25 in mob hunt. Towns take 1 minute to reach and each trainer (10x a normal mob) raises one skill by 5 levels.</p></details>';
  return h}
};

// ---------- live updates ----------
function upd(){
 if(!S)return;const st=stats(),now=Date.now();
 const g=$('#gold');if(g)g.textContent=Math.floor(S.gold);
 const hb=$('#hpbar');if(hb){hb.style.width=Math.max(0,S.hp/st.maxHp*100)+'%';$('#hptx').textContent=Math.ceil(S.hp)+'/'+st.maxHp}
 document.querySelectorAll('[data-cd]').forEach(e=>{const t=e.dataset.cd-now;e.textContent=t>0?fmt(t):'ready'});
 document.querySelectorAll('[data-s]').forEach(e=>{e.style.width=Math.min(100,(now-e.dataset.s)/(e.dataset.e-e.dataset.s)*100)+'%'});
 if(S.train){
  document.querySelectorAll('[data-act]').forEach(e=>{const t=S.train;e.style.width=Math.min(100,(t.f0+(now-t.start)/t.ms)*100)+'%'});
  document.querySelectorAll('[data-trend]').forEach(e=>{e.textContent=busy()?'paused':fmt(S.train.end-now)})}
 if(run&&$('#rlog')){
  const r=run;
  $('#rwave').textContent=r.kind==='mob'?'Wave '+r.wave:(r.kind==='explore'||r.kind==='raid')?'Room '+r.wave:'';
  $('#rmobs').innerHTML=r.dig>0?'Digging up buried treasure... '+fmt(r.dig):r.mobs.length?r.mobs.map(m=>`<div class="${now-(m.hit||0)<160?'hit':''}">${m.name} ${Math.max(0,Math.ceil(m.hp))}/${m.max} ${m.fx?Object.entries(m.fx).map(([k,e])=>`<span class="st ${k}">${FXDEF[k].name} ${Math.ceil(e.left/1000)}s</span>`).join(' '):''}<div class="bar red"><i style="width:${Math.max(0,m.hp/m.max*100)}%"></i></div></div>`).join(''):(r.prompt||r.merchant?'':'Searching...');
  $('#rallies').innerHTML=r.allies.length?'<div class="dim">Allies</div>'+r.allies.map(a=>`<div class="ally">${a.name} ${Math.max(0,Math.ceil(a.hp))}/${a.max}<div class="bar"><i style="width:${Math.max(0,a.hp/a.max*100)}%"></i></div></div>`).join(''):'';
  $('#rloot').innerHTML=r.loot.length?r.loot.map(l=>`${iname(l.id,l.r)} x${l.n}`).join(', '):'Nothing yet';
  $('#rlog').innerHTML=r.log.join('<br>');
 }
 document.querySelectorAll('.startb').forEach(b=>{b.disabled=now<(S.cds[b.dataset.k]||0)});
 const ab=$('#abbtn');if(ab)ab.disabled=now<S.abCd;
 const rb=$('#rerollbtn');if(rb)rb.disabled=S.shop.t-now<=60000;
 const qb=$('#qrbtn');if(qb)qb.disabled=now<S.qr;
}
let last=Date.now();
function loop(){
 if(!S)return;const now=Date.now(),real=now-last,dt=Math.min(real,1000);last=now;const st=stats();
 S.hp=Math.min(st.maxHp,S.hp+st.regen*dt/1000);
 if(S.train){const t=S.train;
  if(busy()){t.start+=real;t.end+=real}
  else{let n=0;while(now>=t.end&&n++<100){S.sk[t.id]++;t.start=t.end;t.f0=0;t.ms=trainMs(t.id);t.end=t.start+t.ms;S.prog[t.id]=0}
   if(n){toast(SKILLS.find(x=>x.id===t.id).name+' is now level '+S.sk[t.id]);save();if(tab==='train'||tab==='bag')render()}}}
 if(S.trip&&now>=S.trip.end){S.loc=S.trip.to;S.trip=null;toast('You arrived.');if(tab==='town')render()}
 if(now>=S.shop.t){genShop();if(tab==='shop')render()}
 if(farm&&now>=farm.end){const n=Math.max(1,Math.round(rnd(1,3)*st.jobM));if(addItem(farm.res,0,n))toast('Bag is full');farm.start=now;farm.end=now+farmMs();if(tab==='bag'||tab==='quests'||tab==='craft')render()}
 if(run){stepRun(dt,st);if(run&&S.hp<=0)die()}
 upd();
}
// ---------- load + migrate ----------
S=load();
if(S){
 S.prog=S.prog||{};S.tw=S.tw||{};S.loc=S.loc||'home';S.best=S.best||0;S.abCd=0;S.qr=S.qr||0;
 S.cds=S.cds||{mob:S.cd||0,explore:S.cd||0,boss:S.cd||0};
 SKILLS.forEach(x=>{if(S.sk[x.id]===undefined)S.sk[x.id]=0});
 if(S.train&&S.train.id===undefined){const k=Object.keys(S.train)[0];S.train=k?Object.assign({id:k},S.train[k]):null}
 for(const [a,b] of [['reld','relic1'],['relh','relic2']])if(S.eq[a]){S.eq[S.eq[b]?'relic3':b]=S.eq[a];delete S.eq[a]}
 const fixId=id=>id.startsWith('steel_')?id.replace('steel','dragon'):id;
 S.inv=S.inv.map(s=>({...s,id:fixId(s.id)})).filter(s=>ITEMS[s.id]);
 for(const k of Object.keys(S.eq)){const e=S.eq[k];e.id=fixId(e.id);if(!ITEMS[e.id]||k==='helmet'||k==='legs')delete S.eq[k]}
 if(S.shop)S.shop.items=S.shop.items.map(e=>({...e,id:fixId(e.id)})).filter(e=>ITEMS[e.id]);
 while(S.quests.length<5)S.quests.push(genQuest());
 if(!CLASSES[S.cls])S=null}
render();
setInterval(loop,100);setInterval(save,5000);
