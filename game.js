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
const RC=['#7eef6d','#4d52e3','#861fde','#de1f1f','#ff2b75'],RN=['Common','Rare','Epic','Legendary','Ultra'],NB=[1,2,3,5,8];
const dk=(c,a=.35)=>{const n=parseInt(c.slice(1),16),f=1-a;return`rgb(${(n>>16)*f|0},${(n>>8&255)*f|0},${(n&255)*f|0})`};
function orb(x,X,Y,R,c){x.lineWidth=Math.max(2,R/4);x.fillStyle=c;x.strokeStyle=dk(c);x.beginPath();x.arc(X,Y,R,0,7);x.fill();x.stroke();const q=x.createRadialGradient(X-R*.35,Y-R*.35,R*.05,X,Y,R);q.addColorStop(0,'#fff5');q.addColorStop(.5,'#fff0');q.addColorStop(1,'#0003');x.fillStyle=q;x.beginPath();x.arc(X,Y,R,0,7);x.fill()}
const I={stick:{n:'Stick',t:'w',v:5,r:0},iron_sword:{n:'Iron Sword',t:'w',v:10,r:1},fire_staff:{n:'Fire Staff',t:'w',v:12,r:1,e:1},orc_club:{n:'Spiked Club',t:'w',v:14,r:1},
thorn:{n:'Thorn Branch',t:'w',v:9,r:1,e:1},dagger:{n:'Twin Dagger',t:'w',v:8,r:1},war_axe:{n:'War Axe',t:'w',v:16,r:1},wand:{n:'Magic Wand',t:'w',v:11,r:2,e:1},great:{n:'Greatsword',t:'w',v:24,r:3},
leather:{n:'Leather Vest',t:'a',v:30,r:0},robe:{n:'Cloth Robe',t:'a',v:40,r:1},chain:{n:'Chainmail',t:'a',v:60,r:1},plate:{n:'Plate Armour',t:'a',v:110,r:2},
sandals:{n:'Sandals',t:'b',v:.08,r:0},boots:{n:'Leather Boots',t:'b',v:.15,r:1},swift:{n:'Swiftboots',t:'b',v:.25,r:2},mithril:{n:'Mithril Mail',t:'a',v:160,r:3},wind:{n:'Windwalkers',t:'b',v:.32,r:3},storm:{n:'Storm Staff',t:'w',v:30,r:3,e:1},excal:{n:'Excalibur',t:'w',v:42,r:4},dragon:{n:'Dragon Plate',t:'a',v:240,r:4},hermes:{n:"Hermes' Boots",t:'b',v:.4,r:4}};
const TN={w:'Weapon',a:'Armour',b:'Boots'};
const MT={stone:{c:'#8a8f98',hp:90,d:8,r:24,s:0,x:6},soldier:{c:'#c0392b',hp:60,d:12,r:18,s:100,x:8},witch:{c:'#8e44ad',hp:40,d:6,r:16,s:70,x:10},
zombie:{c:'#6b8e4e',hp:100,d:10,r:19,s:55,x:9},villager:{c:'#e0b080',hp:20,d:0,r:14,s:60,x:3}};
let U=JSON.parse(localStorage.rl_u||'{}'),me,S,P,mobs=[],pk=[],pr=[],keys={},mouse={d:0,x:0,y:0},ft=[],near=null,paused=1,rot=0;
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0],hash=s=>{let h=5381;for(const c of s)h=h*33^c.charCodeAt(0);return''+(h>>>0)};
function auth(reg){const n=$('u').value.trim(),p=$('p').value;if(!n||!p)return $('err').textContent='Fill in both fields';
if(reg){if(U[n])return $('err').textContent='Name taken';U[n]={pw:hash(p),s:null}}else if(!U[n]||U[n].pw!==hash(p))return $('err').textContent='Wrong login';
me=n;S=null;localStorage.rl_s=n;sv();$('auth').classList.add('hide');play()}
function play(){$('wel').classList.add('hide');S=U[me].s;S?start():pickCls()}
function logout(){localStorage.removeItem('rl_s');me=null;S=null;$('wel').classList.add('hide');$('auth').classList.remove('hide')}
function showWel(){$('auth').classList.add('hide');$('wel').classList.remove('hide');$('wn').textContent='Welcome back, '+me+(U[me].s?' ('+U[me].s.cls+' Lv '+U[me].s.lvl+')':'')}
const sv=()=>{if(me){if(S)U[me].s=S;localStorage.rl_u=JSON.stringify(U)}};setInterval(sv,5000);
function art(x,k,px,py,r,a){const c=C[k];x.save();x.translate(px,py);x.rotate(a||0);x.lineWidth=r/8;x.strokeStyle='#0006';
const ci=(X,Y,R,f)=>orb(x,X,Y,R,f),tr=(a1,a2,b1,b2,c1,c2,f)=>{x.fillStyle=f;x.beginPath();x.moveTo(a1,a2);x.lineTo(b1,b2);x.lineTo(c1,c2);x.fill();x.stroke()};
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
function start(){P={x:G/2,y:G/2,hp:1};const s=stats();P.hp=s.hp;mkWorld();mobs=[];pk=[];pr=[];paused=0;S.sk.lk??=0;if(!window.lp){lp=1;requestAnimationFrame(loop)}}
function stats(){const c=C[S.cls],E=S.eq,k=S.sk,it=(e,m)=>e?I[e.id].v*(1+m*e.l):0,w=E.w;
return{hp:(100+it(E.a,.15)+k.hp*15)*c.hp,spd:(190+k.spd*8)*c.spd*(1+it(E.b,.05)),reg:(1.2+k.reg*.4)*c.reg,body:8*c.phys*(1+k.str*.1),
wd:w?it(w,.15)*(I[w.id].e?c.elem:c.wep)*(1+k.str*.1):0,luck:c.luck*(1+(k.lk||0)*.08)}}
function spawn(){const t=pick(Object.keys(MT)),T=MT[t];let x,y;do{x=rnd(50,G-50);y=rnd(50,G-50)}while(Math.hypot(x-P.x,y-P.y)<500);mobs.push({t,x,y,hp:T.hp,mh:T.hp,h:0,sh:rnd(1,3),a:rnd(0,6),w:0})}
function drop(x,y,luck,mult=1,coins=1){if(coins)pk.push({x:x+rnd(-15,15),y:y+rnd(-15,15),c:Math.ceil(rnd(2,9)*mult)});
const q=Math.random()/luck;if(q<.25*mult||(Math.random()<.15&&mult>=1)){let id;if(Math.random()<.4)id=C[S.cls].w;else{const tier=q<.004?4:q<.02?3:q<.1?2:q<.35?1:0;const l=Object.keys(I).filter(k=>I[k].r==tier);id=pick(l.length?l:Object.keys(I))}
pk.push({x:x+rnd(-20,20),y:y+rnd(-20,20),i:{id,l:0}})}}
const msg=(t,c='#fff')=>ft.push({t,c,life:2});
function loop(t0){if(paused){return requestAnimationFrame(loop)}const dt=0.016,s=stats(),W2=cv.width,H2=cv.height;rot+=dt*3;
let dx=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),dy=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);
if(mouse.d){dx=mouse.x-W2/2;dy=mouse.y-H2/2;const m=Math.hypot(dx,dy);if(m>25){dx/=m;dy/=m}else dx=dy=0}else{const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m}
P.x=Math.max(20,Math.min(G-20,P.x+dx*s.spd*dt));P.y=Math.max(20,Math.min(G-20,P.y+dy*s.spd*dt));P.a=Math.atan2(dy||.001,dx||.001);
P.hp=Math.min(s.hp,P.hp+s.reg*dt);while(mobs.length<70)spawn();
const wp=S.eq.w?NB[I[S.eq.w.id].r]:0;
for(const m of mobs){const T=MT[m.t],d=Math.hypot(P.x-m.x,P.y-m.y),an=Math.atan2(P.y-m.y,P.x-m.x);m.h-=dt;
if(m.t=='villager'){m.a+=rnd(-.3,.3);if(d<200){m.x-=Math.cos(an)*T.s*dt*1.3;m.y-=Math.sin(an)*T.s*dt*1.3}else{m.x+=Math.cos(m.a)*T.s*.4*dt;m.y+=Math.sin(m.a)*T.s*.4*dt}}
else if(m.t=='witch'){if(d<500){const f=d<250?-1:d>330?1:0;m.x+=Math.cos(an)*T.s*dt*f;m.y+=Math.sin(an)*T.s*dt*f;m.sh-=dt;if(m.sh<=0){m.sh=2;pr.push({x:m.x,y:m.y,vx:Math.cos(an)*260,vy:Math.sin(an)*260,l:3})}}}
else if(T.s&&d<(m.t=='zombie'?600:380)){m.x+=Math.cos(an)*T.s*dt;m.y+=Math.sin(an)*T.s*dt}
m.x=Math.max(10,Math.min(G-10,m.x));m.y=Math.max(10,Math.min(G-10,m.y));
if(d<T.r+20){P.hp-=T.d*dt*(m.t=='witch'?1:1.5);m.hp-=s.body*dt}
for(let i=0;i<wp;i++){const q=rot+i*6.283/wp,px=P.x+Math.cos(q)*55,py=P.y+Math.sin(q)*55;if(m.h<=0&&Math.hypot(px-m.x,py-m.y)<T.r+11){m.hp-=s.wd;m.h=.35}}
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
const TXT=(t,x,y,z=16,al='left')=>{g.font=`bold ${z}px Ubuntu,Arial`;g.textAlign=al;g.lineWidth=z/4;g.strokeStyle='#000';g.lineJoin='round';g.strokeText(t,x,y);g.fillStyle='#fff';g.fillText(t,x,y)};
const bar=(x,y,w,h,p,c)=>{g.fillStyle='#0009';g.beginPath();g.roundRect(x,y,w,h,h/2);g.fill();g.fillStyle=c;g.beginPath();g.roundRect(x+3,y+3,Math.max(h-6,(w-6)*Math.max(0,Math.min(1,p))),h-6,(h-6)/2);g.fill()};
const IC=['⚔️','🛡️','👟'],TI=k=>IC[['w','a','b'].indexOf(k)];
function draw(s){const W2=cv.width,H2=cv.height,cx=W2/2-P.x,cy=H2/2-P.y,tm=Date.now()/1000;
g.fillStyle='#157a47';g.fillRect(0,0,W2,H2);g.save();g.translate(cx,cy);g.fillStyle='#1ea761';g.fillRect(0,0,G,G);
g.strokeStyle='#0000001c';g.lineWidth=2;g.beginPath();for(let i=0;i<=G;i+=64){g.moveTo(i,0);g.lineTo(i,G);g.moveTo(0,i);g.lineTo(G,i)}g.stroke();
for(const v of vill)for(let j=0;j<4;j++){const h=v['h'+j];g.lineWidth=5;g.fillStyle='#b8793c';g.strokeStyle='#6b4120';g.beginPath();g.roundRect(h.x-36,h.y-36,72,72,9);g.fill();g.stroke();g.fillStyle='#d35c4a';g.strokeStyle='#8a2f24';g.beginPath();g.roundRect(h.x-30,h.y-30,60,38,6);g.fill();g.stroke();g.beginPath();g.moveTo(h.x-30,h.y-11);g.lineTo(h.x+30,h.y-11);g.stroke()}
for(const c of chests){g.lineWidth=4;g.fillStyle=c.t>0?'#888':'#f0b429';g.strokeStyle=c.t>0?'#444':'#8a5a10';g.beginPath();g.roundRect(c.x-17,c.y-12,34,24,5);g.fill();g.stroke();g.fillStyle='#fff8';g.fillRect(c.x-3,c.y-4,6,9)}
for(const sh of shops){g.lineWidth=5;g.fillStyle='#ffe65d';g.strokeStyle='#a38c1c';g.beginPath();g.roundRect(sh.x-48,sh.y-48,96,96,12);g.fill();g.stroke();for(let i=0;i<4;i++){g.fillStyle=i%2?'#fff':'#de1f1f';g.fillRect(sh.x-48+i*24,sh.y-48,24,18)}TXT('$',sh.x,sh.y+22,52,'center')}
for(const p of pk){const b=Math.sin(tm*4+p.x)*2;if(p.c)orb(g,p.x,p.y+b,8,'#ffd93a');else{const c=RC[I[p.i.id].r];g.lineWidth=4;g.fillStyle=c;g.strokeStyle=dk(c);g.beginPath();g.roundRect(p.x-14,p.y-14+b,28,28,6);g.fill();g.stroke();g.font='15px Arial';g.textAlign='center';g.fillText(TI(I[p.i.id].t),p.x,p.y+6+b)}}
for(const m of mobs){const T=MT[m.t],r=T.r,an=Math.atan2(P.y-m.y,P.x-m.x),X=m.x,Y=m.y,e=(a,R=.5)=>{orb(g,X+Math.cos(an+a)*r*R,Y+Math.sin(an+a)*r*R,r*.2,'#fff');orb(g,X+Math.cos(an+a)*r*(R+.08),Y+Math.sin(an+a)*r*(R+.08),r*.09,'#111')};
if(m.t=='stone'){g.lineWidth=6;g.fillStyle=T.c;g.strokeStyle='#555a62';g.beginPath();for(let i=0;i<8;i++){const q=i*.785+m.a,R=r*(1+.12*Math.sin(i*2.3));g[i?'lineTo':'moveTo'](X+Math.cos(q)*R,Y+Math.sin(q)*R)}g.closePath();g.fill();g.stroke();orb(g,X-r*.25,Y-r*.25,r*.45,'#a5aab3')}
else if(m.t=='zombie'){orb(g,X+Math.cos(an+.7)*r*1.1,Y+Math.sin(an+.7)*r*1.1,r*.35,T.c);orb(g,X+Math.cos(an-.7)*r*1.1,Y+Math.sin(an-.7)*r*1.1,r*.35,T.c);orb(g,X,Y,r,T.c);e(.5);e(-.5)}
else if(m.t=='soldier'){orb(g,X,Y,r,'#d8a37a');orb(g,X,Y,r*.8,'#9aa3ad');e(.4,.35);e(-.4,.35);orb(g,X+Math.cos(an+1.6)*r*1.2,Y+Math.sin(an+1.6)*r*1.2,r*.3,'#c0392b')}
else if(m.t=='witch'){orb(g,X,Y,r,'#e8c39e');orb(g,X,Y,r*1.05,'#5b2c6f');orb(g,X,Y,r*.5,'#3a1a48');orb(g,X+Math.cos(an)*r*.9,Y+Math.sin(an)*r*.9,r*.25,'#b0f')}
else{orb(g,X,Y,r,'#f0c08a');orb(g,X,Y,r*.65,'#8b5a2b');e(.4,.7);e(-.4,.7)}
if(m.hp<m.mh)bar(X-22,Y+r+6,44,9,m.hp/m.mh,'#7eef6d')}
for(const p of pr)orb(g,p.x,p.y,9,'#b04bff');
if(S.eq.w){const w=I[S.eq.w.id],n=NB[w.r];for(let i=0;i<n;i++){const q=rot+i*6.283/n,X=P.x+Math.cos(q)*58,Y=P.y+Math.sin(q)*58;orb(g,X,Y,10,RC[w.r]);if(w.e)orb(g,X,Y,4,'#ffb347')}}
art(g,S.cls,P.x,P.y,22,P.a);bar(P.x-32,P.y+32,64,10,P.hp/s.hp,'#7eef6d');g.restore();
ft.forEach((f,i)=>{g.globalAlpha=Math.min(1,f.life);g.fillStyle=f.c;TXT(f.t,W2/2,H2/2-110-i*22,17,'center');f.life-=.016});g.globalAlpha=1;ft=ft.filter(f=>f.life>0).slice(-6);
TXT(me+' - '+S.cls,16,28,18);TXT('🪙 '+S.coins,16,56,20);if(S.sp>0)TXT('Skill points: '+S.sp+' (press K)',16,82,16);TXT('[K] Skills  [U] Combine  [P] Pouch  [E] Interact',16,H2-14,13);
if(near)TXT(near.k=='shop'?'Press E to shop':'Press E to open chest',W2/2,H2/2+80,20,'center');
const bx=W2/2-160;bar(bx,H2-70,320,22,P.hp/s.hp,'#7eef6d');TXT((P.hp|0)+' / '+(s.hp|0),W2/2,H2-53,14,'center');bar(bx,H2-42,320,22,S.xp/(40*Math.pow(S.lvl,1.5)),'#ffe65d');TXT('Lv '+S.lvl,W2/2,H2-25,14,'center');
const R=150,ox=W2,oy=H2,col=C[S.cls].col,gr=g.createRadialGradient(ox,oy,10,ox,oy,R);gr.addColorStop(0,col);gr.addColorStop(1,dk(col,.3));
g.lineWidth=7;g.strokeStyle=dk(col,.5);g.fillStyle=gr;g.beginPath();g.moveTo(ox,oy);g.arc(ox,oy,R,Math.PI,1.5*Math.PI);g.closePath();g.fill();g.stroke();
art(g,S.cls,ox-42,oy-42,26,-.8);
[['w',203],['a',227],['b',251]].forEach(([k,a])=>{const q=a*Math.PI/180,sx=ox+Math.cos(q)*102,sy=oy+Math.sin(q)*102,e=S.eq[k],c=e?RC[I[e.id].r]:'#00000055';g.lineWidth=4;g.fillStyle=c;g.strokeStyle=e?dk(c):'#0007';g.beginPath();g.roundRect(sx-23,sy-23,46,46,8);g.fill();g.stroke();g.font='20px Arial';g.textAlign='center';g.fillStyle='#fff';g.globalAlpha=e?1:.4;g.fillText(TI(k),sx,sy+4);g.globalAlpha=1;if(e)TXT('Lv'+e.l,sx,sy+19,10,'center')})}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;keys[e.key]=1;if(!S||$('auth').offsetParent||!$('cls').classList.contains('hide'))return;const k=e.key.toLowerCase();
if(k=='escape')closeM();else if(k=='k')openM('Skills');else if(k=='u')openM('Combine');else if(k=='p')openM('Pouch');else if(k=='e'&&near&&paused==0){near.k=='shop'?openM('Shop',near.sh):chest(near.c)}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0;keys[e.key]=0});cv.onmousedown=()=>mouse.d=1;onmouseup=()=>mouse.d=0;onmousemove=e=>{mouse.x=e.clientX;mouse.y=e.clientY};
function chest(c){c.t=180;msg('Chest opened!','#fd0');for(let i=0;i<3;i++)drop(c.x,c.y+30,stats().luck,2,1)}
let shopCur=null;function closeM(){$('menu').classList.add('hide');paused=0}
const SK=[['hp','❤️','Vitality','+15 max HP'],['str','💪','Strength','+10% damage'],['spd','👟','Agility','+4% speed'],['reg','🌿','Regeneration','+0.4 HP/s'],['lk','🍀','Fortune','+8% luck']];
const ib=(i,x='')=>{const c=RC[I[i.id].r];return`<div class=ib style="background:${c};border-color:${dk(c)}"><b>${TI(I[i.id].t)}</b><span>${I[i.id].n}</span><small>${RN[I[i.id].r]} · Lv ${i.l}</small>${x}</div>`};
function openM(t,sh){paused=1;shopCur=sh||shopCur;$('menu').classList.remove('hide');$('tabs').innerHTML=['Skills','Combine','Pouch'].map(x=>`<button class="${x==t?'on':''}" onclick="openM('${x}')">${x}</button>`).join('')+'<button onclick="closeM()">✕</button><br><b>🪙 '+S.coins+' &nbsp; Skill points: '+S.sp+'</b>';
let h='';
if(t=='Skills')h='<div class=grid>'+SK.map(([k,ic,n,d])=>`<div class=sk><b>${ic}</b><h4>${n}</h4><small>${d}</small><div class=pips>${'■'.repeat(S.sk[k]||0)}<i>${'■'.repeat(10-(S.sk[k]||0))}</i></div><button onclick="sk('${k}')" ${S.sp<1||S.sk[k]>=10?'disabled':''}>Upgrade</button></div>`).join('')+'</div>';
if(t=='Combine'){const gp={};S.pouch.forEach(i=>{(gp[i.id+'|'+i.l]??=[]).push(i)});h='<p>Combine 3 identical items (same level) into 1 item of the next level (max 10).</p><div class=grid>'+(Object.entries(gp).map(([k,a])=>{const[id,l]=k.split('|');return ib(a[0],`<em>x${a.length}</em><button onclick="comb('${id}',${l})" ${a.length<3||l>=10?'disabled':''}>Combine 3</button>`)}).join('')||'<p>Nothing in pouch.</p>')+'</div>'}
if(t=='Pouch')h='<h3>Loadout</h3><div class=grid>'+['w','a','b'].map(k=>{const e=S.eq[k];return e?ib(e,`<button onclick="uneq('${k}')">Unequip</button>`):`<div class="ib empty"><b>${TI(k)}</b><span>Empty</span></div>`}).join('')+'</div><h3>Pouch</h3><div class=grid>'+(S.pouch.map((i,n)=>ib(i,`<button onclick="eq(${n})">Equip</button><button onclick="dr(${n})">Drop</button>`)).join('')||'<p>Empty - kill mobs & raid villages!</p>')+'</div><hr><button class=red onclick="reset()">Reset progress (change class)</button>';
if(t=='Shop')h='<h3>Shop</h3><div class=grid>'+shopCur.stock.map(id=>{const c=(I[id].r+1)*50+(I[id].v>1?I[id].v*3:60)|0;return ib({id,l:0},`<button onclick="buy('${id}',${c})">Buy ${c}🪙</button>`)}).join('')+'</div><h3>Sell</h3><div class=grid>'+S.pouch.map((i,n)=>ib(i,`<button onclick="sell(${n})">Sell ${(I[i.id].r+1)*15*(i.l+1)}🪙</button>`)).join('')+'</div>';
$('mbody').innerHTML=h;$('mbody').dataset.t=t}
const re=()=>openM($('mbody').dataset.t);
const sk=k=>{if(S.sp>0&&S.sk[k]<10){S.sp--;S.sk[k]++}re()},uneq=k=>{S.pouch.push(S.eq[k]);S.eq[k]=null;re()},eq=n=>{const i=S.pouch.splice(n,1)[0],t=I[i.id].t;if(S.eq[t])S.pouch.push(S.eq[t]);S.eq[t]=i;re()},dr=n=>{const i=S.pouch.splice(n,1)[0];pk.push({x:P.x+60,y:P.y,i});re()},
buy=(id,c)=>{if(S.coins>=c){S.coins-=c;S.pouch.push({id,l:0})}re()},sell=n=>{const i=S.pouch.splice(n,1)[0];S.coins+=(I[i.id].r+1)*15*(i.l+1);re()},
comb=(id,l)=>{l=+l;let n=0;S.pouch=S.pouch.filter(i=>i.id==id&&i.l==l&&n<3?(n++,0):1);if(n==3)S.pouch.push({id,l:l+1});else msg('Need 3 identical items','#f66');re()},
reset=()=>{if(confirm('This deletes ALL progress for this account. Continue?')){S=null;U[me].s=null;sv();closeM();paused=1;pickCls()}};
if(localStorage.rl_s&&U[localStorage.rl_s]){me=localStorage.rl_s;showWel()}
