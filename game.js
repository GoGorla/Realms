const $=i=>document.getElementById(i),G=3000,cv=$('c'),g=cv.getContext('2d');
const rs=()=>{cv.width=innerWidth;cv.height=innerHeight};rs();onresize=rs;
const LBL={hp:'Health',wep:'Weapon Strength',elem:'Elemental Strength',luck:'Luck',reg:'Health Regen',phys:'Physical Strength',spd:'Speed'};
const C={
Knight:{col:'#4a90e2',hp:1.25,wep:2,w:'iron_sword',d:'Armored frontline fighter. Strong weapons and sturdy.'},
Sorcerer:{col:'#a55eea',elem:3,hp:.5,luck:1.5,w:'fire_staff',d:'Glass cannon. Elemental weapons and skills hit 3x, and fortune favors you.'},
Orc:{col:'#7d9b2f',wep:3,hp:.75,reg:1.5,w:'orc_club',d:'Brutal bruiser. Massive weapon damage and fast recovery.'},
Druid:{col:'#1abc9c',hp:2,reg:2,w:'thorn',d:'Nature tank. Huge health pool that heals rapidly.'},
Rogue:{col:'#555b66',luck:2,spd:2,phys:.5,w:'dagger',d:'Fast and lucky looter, but weak in body combat.'},
Barbarian:{col:'#d35400',hp:.5,reg:.5,phys:2,wep:2,spd:2,w:'war_axe',d:'Reckless berserker. Fast and hits like a truck, but fragile.'}};
for(const k in C)for(const s in LBL)C[k][s]??=1;
const RC=['#9be37d','#4fa0ff','#c06cff','#ffb030'],RN=['Common','Uncommon','Rare','Epic'];
const I={stick:{n:'Stick',t:'w',v:5,r:0},iron_sword:{n:'Iron Sword',t:'w',v:10,r:1},fire_staff:{n:'Fire Staff',t:'w',v:12,r:1,e:1},orc_club:{n:'Spiked Club',t:'w',v:14,r:1},
thorn:{n:'Thorn Branch',t:'w',v:9,r:1,e:1},dagger:{n:'Twin Dagger',t:'w',v:8,r:1},war_axe:{n:'War Axe',t:'w',v:16,r:1},wand:{n:'Magic Wand',t:'w',v:11,r:2,e:1},great:{n:'Greatsword',t:'w',v:24,r:3},
leather:{n:'Leather Vest',t:'a',v:30,r:0},robe:{n:'Cloth Robe',t:'a',v:40,r:1},chain:{n:'Chainmail',t:'a',v:60,r:1},plate:{n:'Plate Armour',t:'a',v:110,r:2},
sandals:{n:'Sandals',t:'b',v:.08,r:0},boots:{n:'Leather Boots',t:'b',v:.15,r:1},swift:{n:'Swiftboots',t:'b',v:.25,r:2}};
const TN={w:'Weapon',a:'Armour',b:'Boots'};
const MT={stone:{c:'#8a8f98',hp:90,d:8,r:24,s:0,x:6},soldier:{c:'#c0392b',hp:60,d:12,r:18,s:100,x:8},witch:{c:'#8e44ad',hp:40,d:6,r:16,s:70,x:10},
zombie:{c:'#6b8e4e',hp:100,d:10,r:19,s:55,x:9},villager:{c:'#e0b080',hp:20,d:0,r:14,s:60,x:3}};
let U=JSON.parse(localStorage.rl_u||'{}'),me,S,P,mobs=[],pk=[],pr=[],keys={},mouse={d:0,x:0,y:0},ft=[],near=null,paused=1,rot=0;
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0],hash=s=>{let h=5381;for(const c of s)h=h*33^c.charCodeAt(0);return''+(h>>>0)};
function auth(reg){const n=$('u').value.trim(),p=$('p').value;if(!n||!p)return $('err').textContent='Fill in both fields';
if(reg){if(U[n])return $('err').textContent='Name taken';U[n]={pw:hash(p),s:null}}else if(!U[n]||U[n].pw!==hash(p))return $('err').textContent='Wrong login';
me=n;sv();$('auth').classList.add('hide');S=U[n].s;S?start():pickCls()}
const sv=()=>{if(me){if(S)U[me].s=S;localStorage.rl_u=JSON.stringify(U)}};setInterval(sv,5000);
function art(x,k,px,py,r,a){const c=C[k];x.save();x.translate(px,py);x.rotate(a||0);x.lineWidth=r/8;x.strokeStyle='#0006';
const ci=(X,Y,R,f)=>{x.fillStyle=f;x.beginPath();x.arc(X,Y,R,0,7);x.fill();x.stroke()},tr=(a1,a2,b1,b2,c1,c2,f)=>{x.fillStyle=f;x.beginPath();x.moveTo(a1,a2);x.lineTo(b1,b2);x.lineTo(c1,c2);x.fill();x.stroke()};
if(k=='Knight'){x.fillStyle='#ccc';x.fillRect(r*.1,-r*1.15,r*.5,r*.5);ci(0,0,r,c.col);ci(0,0,r*.6,'#cfd6dd');x.fillStyle='#345';x.fillRect(r*.2,-r*.15,r*.4,r*.3);ci(-r*.5,0,r*.2,'#e33')}
else if(k=='Sorcerer'){ci(0,0,r,c.col);ci(0,0,r*.55,'#f1c9a0');tr(-r*.9,-r*.6,-r*.9,r*.6,r*.8,0,'#5b2c9a');x.fillStyle='#8b5a2b';x.fillRect(r*.3,r*.9,r*1.2,r*.15);ci(r*1.5,r*.97,r*.2,'#f90')}
else if(k=='Orc'){ci(0,0,r,c.col);ci(0,0,r*.6,'#5a7a20');tr(r*.5,-r*.3,r*1.0,-r*.2,r*.55,-r*.05,'#fff');tr(r*.5,r*.3,r*1.0,r*.2,r*.55,r*.05,'#fff');ci(r*.15,-r*.2,r*.1,'#f00');ci(r*.15,r*.2,r*.1,'#f00')}
else if(k=='Druid'){ci(0,0,r,c.col);ci(0,0,r*.55,'#e8c39e');for(let i=0;i<6;i++){const q=i*1.047;ci(Math.cos(q)*r*.7,Math.sin(q)*r*.7,r*.22,'#2e8b3a')}ci(0,0,r*.25,'#8b5a2b')}
else if(k=='Rogue'){ci(0,0,r,c.col);ci(0,0,r*.65,'#222');x.fillStyle='#c33';x.fillRect(r*.1,-r*.45,r*.3,r*.9);tr(r*.6,-r*1.1,r*1.4,-r*.9,r*.7,-r*.7,'#ddd');tr(r*.6,r*1.1,r*1.4,r*.9,r*.7,r*.7,'#ddd')}
else{tr(-r*.2,-r*.7,-r*.7,-r*1.5,r*.1,-r*1.0,'#fff');tr(-r*.2,r*.7,-r*.7,r*1.5,r*.1,r*1.0,'#fff');ci(0,0,r,c.col);ci(0,0,r*.55,'#e8b48c');x.fillStyle='#b00';x.fillRect(r*.1,-r*.4,r*.2,r*.8)}
x.restore()}
function pickCls(){$('cls').classList.remove('hide');const el=$('cards');el.innerHTML='';for(const k in C){const c=C[k],d=document.createElement('div');d.className='card';
const perks=Object.keys(LBL).filter(s=>c[s]!=1).map(s=>`${LBL[s]} ${c[s]}x`).join(', ');
d.innerHTML=`<canvas width=100 height=100></canvas><h3 style="color:${c.col}">${k}</h3><p>${c.d}</p><small>Perks: ${perks}</small><br><button>Play ${k}</button>`;
art(d.firstChild.getContext('2d'),k,50,50,30);d.lastChild.onclick=()=>{S={cls:k,lvl:1,xp:0,sp:0,sk:{hp:0,str:0,spd:0,reg:0},coins:0,pouch:[],eq:{w:null,a:null,b:null}};sv();$('cls').classList.add('hide');start()};el.appendChild(d)}}
let vill=[],shops=[],chests=[];
function mkWorld(){vill=[];shops=[];chests=[];for(let i=0;i<7;i++){const x=rnd(300,G-300),y=rnd(300,G-300);vill.push({x,y});
for(let j=0;j<4;j++)vill[i]['h'+j]={x:x+(j%2)*110-60,y:y+(j>>1)*110-60};chests.push({x:x+5,y:y+5,t:0})}
for(let i=0;i<5;i++){const stock=[];for(let j=0;j<5;j++){const id=pick(Object.keys(I).filter(k=>I[k].r<3));stock.push(id)}shops.push({x:rnd(200,G-200),y:rnd(200,G-200),stock})}}
function start(){P={x:G/2,y:G/2,hp:1};const s=stats();P.hp=s.hp;mkWorld();mobs=[];pk=[];pr=[];paused=0;S.eq.w||S.pouch.some(i=>I[i.id].t=='w')||0;requestAnimationFrame(loop)}
function stats(){const c=C[S.cls],E=S.eq,k=S.sk,it=(e,m)=>e?I[e.id].v*(1+m*e.l):0,w=E.w;
return{hp:(100+it(E.a,.15)+k.hp*15)*c.hp,spd:(190+k.spd*8)*c.spd*(1+it(E.b,.05)),reg:(1.2+k.reg*.4)*c.reg,body:8*c.phys*(1+k.str*.1),
wd:w?it(w,.15)*(I[w.id].e?c.elem:c.wep)*(1+k.str*.1):0,luck:c.luck}}
function spawn(){const t=pick(Object.keys(MT)),T=MT[t];let x,y;do{x=rnd(50,G-50);y=rnd(50,G-50)}while(Math.hypot(x-P.x,y-P.y)<500);mobs.push({t,x,y,hp:T.hp,mh:T.hp,h:0,sh:rnd(1,3),a:rnd(0,6),w:0})}
function drop(x,y,luck,mult=1,coins=1){if(coins)pk.push({x:x+rnd(-15,15),y:y+rnd(-15,15),c:Math.ceil(rnd(2,9)*mult)});
const q=Math.random()/luck;if(q<.25*mult||(Math.random()<.15&&mult>=1)){let id;if(Math.random()<.4)id=C[S.cls].w;else{const tier=q<.02?3:q<.1?2:q<.35?1:0;const l=Object.keys(I).filter(k=>I[k].r==tier);id=pick(l.length?l:Object.keys(I))}
pk.push({x:x+rnd(-20,20),y:y+rnd(-20,20),i:{id,l:0}})}}
const msg=(t,c='#fff')=>ft.push({t,c,life:2});
function loop(t0){if(paused){return requestAnimationFrame(loop)}const dt=0.016,s=stats(),W2=cv.width,H2=cv.height;rot+=dt*3;
let dx=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),dy=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);
if(mouse.d){dx=mouse.x-W2/2;dy=mouse.y-H2/2;const m=Math.hypot(dx,dy);if(m>25){dx/=m;dy/=m}else dx=dy=0}else{const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m}
P.x=Math.max(20,Math.min(G-20,P.x+dx*s.spd*dt));P.y=Math.max(20,Math.min(G-20,P.y+dy*s.spd*dt));P.a=Math.atan2(dy||.001,dx||.001);
P.hp=Math.min(s.hp,P.hp+s.reg*dt);while(mobs.length<70)spawn();
const wp=S.eq.w?3:0;
for(const m of mobs){const T=MT[m.t],d=Math.hypot(P.x-m.x,P.y-m.y),an=Math.atan2(P.y-m.y,P.x-m.x);m.h-=dt;
if(m.t=='villager'){m.a+=rnd(-.3,.3);if(d<200){m.x-=Math.cos(an)*T.s*dt*1.3;m.y-=Math.sin(an)*T.s*dt*1.3}else{m.x+=Math.cos(m.a)*T.s*.4*dt;m.y+=Math.sin(m.a)*T.s*.4*dt}}
else if(m.t=='witch'){if(d<500){const f=d<250?-1:d>330?1:0;m.x+=Math.cos(an)*T.s*dt*f;m.y+=Math.sin(an)*T.s*dt*f;m.sh-=dt;if(m.sh<=0){m.sh=2;pr.push({x:m.x,y:m.y,vx:Math.cos(an)*260,vy:Math.sin(an)*260,l:3})}}}
else if(T.s&&d<(m.t=='zombie'?600:380)){m.x+=Math.cos(an)*T.s*dt;m.y+=Math.sin(an)*T.s*dt}
m.x=Math.max(10,Math.min(G-10,m.x));m.y=Math.max(10,Math.min(G-10,m.y));
if(d<T.r+20){P.hp-=T.d*dt*(m.t=='witch'?1:1.5);m.hp-=s.body*dt}
for(let i=0;i<wp;i++){const q=rot+i*2.094,px=P.x+Math.cos(q)*55,py=P.y+Math.sin(q)*55;if(m.h<=0&&Math.hypot(px-m.x,py-m.y)<T.r+11){m.hp-=s.wd;m.h=.35}}
if(m.hp<=0){m.dead=1;const xp=m.mh/4;S.xp+=xp;drop(m.x,m.y,s.luck,m.t=='villager'?3:1,1);if(m.t=='villager'){pk.push({x:m.x+10,y:m.y,c:Math.ceil(rnd(8,20))})}
while(S.xp>=40*Math.pow(S.lvl,1.5)){S.xp-=40*Math.pow(S.lvl,1.5);S.lvl++;S.sp++;msg('Level up! Skill point +1','#ff0')}}}
mobs=mobs.filter(m=>!m.dead);
for(const p of pr){p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(Math.hypot(p.x-P.x,p.y-P.y)<24){P.hp-=14;p.l=0}}pr=pr.filter(p=>p.l>0);
pk=pk.filter(p=>{if(Math.hypot(p.x-P.x,p.y-P.y)<34){if(p.c){S.coins+=p.c;msg('+'+p.c+' coins','#fd0')}else{S.pouch.push(p.i);msg('Got '+I[p.i.id].n,RC[I[p.i.id].r])}return 0}return 1});
if(P.hp<=0){msg('You died! Lost half your coins','#f66');S.coins>>=1;P.x=G/2;P.y=G/2;P.hp=s.hp}
near=null;for(const c of chests)if(c.t>0)c.t-=dt;
for(const v of vill)for(const c of chests)if(Math.hypot(c.x-P.x,c.y-P.y)<60&&c.t<=0)near={k:'chest',c};
for(const sh of shops)if(Math.hypot(sh.x-P.x,sh.y-P.y)<70)near={k:'shop',sh};
draw(s);requestAnimationFrame(loop)}
function draw(s){const W2=cv.width,H2=cv.height,cx=W2/2-P.x,cy=H2/2-P.y;g.fillStyle='#5faa4a';g.fillRect(0,0,W2,H2);g.save();g.translate(cx,cy);
g.strokeStyle='#ffffff14';for(let i=0;i<=G;i+=100){g.beginPath();g.moveTo(i,0);g.lineTo(i,G);g.moveTo(0,i);g.lineTo(G,i);g.stroke()}g.strokeStyle='#000';g.lineWidth=6;g.strokeRect(0,0,G,G);
for(const v of vill)for(let j=0;j<4;j++){const h=v['h'+j];g.fillStyle='#8b5a2b';g.fillRect(h.x-35,h.y-35,70,70);g.fillStyle='#b5651d';g.fillRect(h.x-25,h.y-25,50,50);g.strokeStyle='#000';g.lineWidth=2;g.strokeRect(h.x-35,h.y-35,70,70)}
for(const c of chests){g.fillStyle=c.t>0?'#555':'#d4a017';g.fillRect(c.x-14,c.y-10,28,20);g.strokeRect(c.x-14,c.y-10,28,20)}
for(const sh of shops){g.fillStyle='#f1c40f';g.fillRect(sh.x-45,sh.y-45,90,90);g.strokeStyle='#000';g.strokeRect(sh.x-45,sh.y-45,90,90);g.fillStyle='#000';g.font='bold 40px Arial';g.textAlign='center';g.fillText('$',sh.x,sh.y+14)}
for(const p of pk){if(p.c){g.fillStyle='#fd0';g.beginPath();g.arc(p.x,p.y,8,0,7);g.fill();g.stroke()}else{g.fillStyle=RC[I[p.i.id].r];g.fillRect(p.x-9,p.y-9,18,18);g.strokeRect(p.x-9,p.y-9,18,18)}}
for(const m of mobs){const T=MT[m.t];g.lineWidth=3;g.strokeStyle='#0007';g.fillStyle=T.c;g.beginPath();g.arc(m.x,m.y,T.r,0,7);g.fill();g.stroke();
if(m.t=='witch'){g.fillStyle='#4a235a';g.beginPath();g.moveTo(m.x-14,m.y-6);g.lineTo(m.x+14,m.y-6);g.lineTo(m.x,m.y-28);g.fill()}
if(m.t=='soldier'){g.fillStyle='#999';g.fillRect(m.x-8,m.y-T.r,16,8)}
if(m.hp<m.mh){g.fillStyle='#000a';g.fillRect(m.x-18,m.y+T.r+4,36,5);g.fillStyle='#4f4';g.fillRect(m.x-18,m.y+T.r+4,36*m.hp/m.mh,5)}}
for(const p of pr){g.fillStyle='#b0f';g.beginPath();g.arc(p.x,p.y,9,0,7);g.fill()}
if(S.eq.w)for(let i=0;i<3;i++){const q=rot+i*2.094,w=I[S.eq.w.id];g.fillStyle=RC[w.r];g.strokeStyle='#000';g.beginPath();g.arc(P.x+Math.cos(q)*55,P.y+Math.sin(q)*55,11,0,7);g.fill();g.stroke();if(w.e){g.fillStyle='#f80';g.beginPath();g.arc(P.x+Math.cos(q)*55,P.y+Math.sin(q)*55,5,0,7);g.fill()}}
art(g,S.cls,P.x,P.y,22,P.a);g.fillStyle='#000a';g.fillRect(P.x-30,P.y+30,60,6);g.fillStyle='#4f4';g.fillRect(P.x-30,P.y+30,60*Math.max(0,P.hp)/s.hp,6);g.restore();
g.textAlign='left';g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=4;g.font='bold 16px Arial';
const tx=(t,x,y)=>{g.strokeText(t,x,y);g.fillText(t,x,y)};tx(`${me} - ${S.cls}  Lv ${S.lvl}  XP ${S.xp|0}/${40*Math.pow(S.lvl,1.5)|0}`,12,24);tx(`HP ${P.hp|0}/${s.hp|0}   Coins ${S.coins}   Skill pts ${S.sp}`,12,46);tx('[K] Skills  [U] Upgrade  [P] Pouch  [E] Interact  WASD / hold mouse to move',12,68);
ft.forEach((f,i)=>{g.globalAlpha=Math.min(1,f.life);g.fillStyle=f.c;g.strokeText(f.t,12,100+i*20);g.fillText(f.t,12,100+i*20);f.life-=.016});g.globalAlpha=1;ft=ft.filter(f=>f.life>0).slice(-6);
if(near){g.textAlign='center';tx(near.k=='shop'?'Press E to shop':'Press E to open chest',W2/2,H2/2-60)}
// loadout quarter circle
const R=140,ox=W2,oy=H2,col=C[S.cls].col;g.fillStyle=col+'cc';g.strokeStyle='#000';g.lineWidth=4;g.beginPath();g.moveTo(ox,oy);g.arc(ox,oy,R,Math.PI,1.5*Math.PI);g.closePath();g.fill();g.stroke();
art(g,S.cls,ox-38,oy-38,26,-.8);
[['w',200],['a',225],['b',250]].forEach(([k,a])=>{const q=a*Math.PI/180,sx=ox+Math.cos(q)*100,sy=oy+Math.sin(q)*100,e=S.eq[k];g.fillStyle='#0008';g.strokeStyle=e?RC[I[e.id].r]:'#fff';g.beginPath();g.arc(sx,sy,24,0,7);g.fill();g.stroke();g.fillStyle='#fff';g.font='bold 10px Arial';g.textAlign='center';g.fillText(e?I[e.id].n.slice(0,9):TN[k],sx,sy+3);if(e)g.fillText('Lv'+e.l,sx,sy+14)})}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;keys[e.key]=1;if(!S||$('auth').offsetParent||!$('cls').classList.contains('hide'))return;const k=e.key.toLowerCase();
if(k=='escape')closeM();else if(k=='k')openM('Skills');else if(k=='u')openM('Upgrade');else if(k=='p')openM('Pouch');else if(k=='e'&&near&&paused==0){near.k=='shop'?openM('Shop',near.sh):chest(near.c)}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0;keys[e.key]=0});cv.onmousedown=()=>mouse.d=1;onmouseup=()=>mouse.d=0;onmousemove=e=>{mouse.x=e.clientX;mouse.y=e.clientY};
function chest(c){c.t=180;msg('Chest opened!','#fd0');for(let i=0;i<3;i++)drop(c.x,c.y+30,stats().luck,2,1)}
let shopCur=null;function closeM(){$('menu').classList.add('hide');paused=0}
function openM(t,sh){paused=1;shopCur=sh||shopCur;$('menu').classList.remove('hide');const tabs=['Skills','Upgrade','Pouch'];$('tabs').innerHTML=tabs.map(x=>`<button onclick="openM('${x}')">${x}</button>`).join('')+'<button onclick="closeM()">Close (Esc)</button>'+`<br><b>Coins: ${S.coins} | Skill pts: ${S.sp}</b>`;
const b=$('mbody');let h='';const nm=i=>`<span style="color:${RC[I[i.id].r]}">${I[i.id].n} Lv${i.l}</span>`;
if(t=='Skills')h=[['hp','Vitality (+15 HP)'],['str','Strength (+10% dmg)'],['spd','Agility (+4% speed)'],['reg','Regeneration (+0.4 HP/s)']].map(([k,l])=>`<div class=row><span>${l} - level ${S.sk[k]}</span><button onclick="sk('${k}')">+</button></div>`).join('');
if(t=='Upgrade')h=['w','a','b'].map(k=>{const e=S.eq[k],c=e?30*(e.l+1)*(I[e.id].r+1):0;return`<div class=row><span>${TN[k]}: ${e?nm(e):'(empty)'}</span>${e?(e.l<10?`<button onclick="up('${k}')">Upgrade ${c}c</button>`:'MAX'):''}</div>`}).join('');
if(t=='Pouch')h='<h3>Loadout</h3>'+['w','a','b'].map(k=>{const e=S.eq[k];return`<div class=row><span>${TN[k]}: ${e?nm(e):'(empty)'}</span>${e?`<button onclick="uneq('${k}')">Unequip</button>`:''}</div>`}).join('')+'<h3>Pouch</h3>'+(S.pouch.map((i,n)=>`<div class=row><span>${TN[I[i.id].t]}: ${nm(i)}</span><span><button onclick="eq(${n})">Equip</button><button onclick="dr(${n})">Drop</button></span></div>`).join('')||'<p>Empty - kill mobs & raid villages!</p>')+'<hr><button style="background:#e55" onclick="reset()">Reset progress (change class)</button>';
if(t=='Shop'){const s=shopCur;h='<h3>Shop</h3>'+s.stock.map((id,n)=>{const c=(I[id].r+1)*50+(I[id].v>1?I[id].v*3:60);return`<div class=row><span style="color:${RC[I[id].r]}">${TN[I[id].t]}: ${I[id].n}</span><button onclick="buy('${id}',${c})">Buy ${c|0}c</button></div>`}).join('')+'<hr>'+S.pouch.map((i,n)=>`<div class=row><span>${nm(i)}</span><button onclick="sell(${n})">Sell ${((I[i.id].r+1)*15*(i.l+1))}c</button></div>`).join('')}
b.innerHTML=h;b.dataset.t=t}
const re=()=>openM($('mbody').dataset.t);
const sk=k=>{if(S.sp>0){S.sp--;S.sk[k]++}re()},up=k=>{const e=S.eq[k],c=30*(e.l+1)*(I[e.id].r+1);if(S.coins>=c){S.coins-=c;e.l++}re()},
uneq=k=>{S.pouch.push(S.eq[k]);S.eq[k]=null;re()},eq=n=>{const i=S.pouch.splice(n,1)[0],t=I[i.id].t;if(S.eq[t])S.pouch.push(S.eq[t]);S.eq[t]=i;re()},dr=n=>{const i=S.pouch.splice(n,1)[0];pk.push({x:P.x+60,y:P.y,i});re()},
buy=(id,c)=>{if(S.coins>=c){S.coins-=c;S.pouch.push({id,l:0})}re()},sell=n=>{const i=S.pouch.splice(n,1)[0];S.coins+=(I[i.id].r+1)*15*(i.l+1);re()},
reset=()=>{if(confirm('This deletes ALL progress for this account. Continue?')){S=null;U[me].s=null;sv();closeM();paused=1;pickCls()}};
