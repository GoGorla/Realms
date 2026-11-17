const $=i=>document.getElementById(i),G=8000,cv=$('c'),g=cv.getContext('2d');
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
const RC=['#7eef6d','#ffe65d','#4d52e3','#861fde','#de1f1f','#1fdbde','#ff2b75','#2bffa3','#f4f4f4'],RN=['Common','Unusual','Rare','Epic','Legendary','Mythic','Ultra','Super','Eternal'],NB=[1,1,2,3,5,6,8,10,12],CH=[.64,.32,.16,.08,.04,.02,.01,.001];
const dk=(c,a=.35)=>{const n=parseInt(c.slice(1),16),f=1-a;return`rgb(${(n>>16)*f|0},${(n>>8&255)*f|0},${(n&255)*f|0})`};
function orb(x,X,Y,R,c){x.lineWidth=Math.max(2,R/4);x.fillStyle=c;x.strokeStyle=dk(c);x.beginPath();x.arc(X,Y,R,0,7);x.fill();x.stroke();const q=x.createRadialGradient(X-R*.35,Y-R*.35,R*.05,X,Y,R);q.addColorStop(0,'#fff5');q.addColorStop(.5,'#fff0');q.addColorStop(1,'#0003');x.fillStyle=q;x.beginPath();x.arc(X,Y,R,0,7);x.fill()}
const I={stick:{n:'Stick',t:'w',v:5,r:0},iron_sword:{n:'Iron Sword',t:'w',v:10,r:1},fire_staff:{n:'Fire Staff',t:'w',v:12,r:1,e:1},orc_club:{n:'Spiked Club',t:'w',v:14,r:1},
thorn:{n:'Thorn Branch',t:'w',v:9,r:1,e:1},dagger:{n:'Twin Dagger',t:'w',v:8,r:1},war_axe:{n:'War Axe',t:'w',v:16,r:1},wand:{n:'Magic Wand',t:'w',v:11,r:2,e:1},great:{n:'Greatsword',t:'w',v:24,r:3},
leather:{n:'Leather Vest',t:'a',v:30,r:0},robe:{n:'Cloth Robe',t:'a',v:40,r:1},chain:{n:'Chainmail',t:'a',v:60,r:1},plate:{n:'Plate Armour',t:'a',v:110,r:2},
sandals:{n:'Sandals',t:'b',v:.08,r:0},boots:{n:'Leather Boots',t:'b',v:.15,r:1},swift:{n:'Swiftboots',t:'b',v:.25,r:2},mithril:{n:'Mithril Mail',t:'a',v:160,r:3},wind:{n:'Windwalkers',t:'b',v:.32,r:3},storm:{n:'Storm Staff',t:'w',v:30,r:3,e:1},excal:{n:'Excalibur',t:'w',v:42,r:6},dragon:{n:'Dragon Plate',t:'a',v:240,r:6},hermes:{n:"Hermes' Boots",t:'b',v:.4,r:6}};
const MT={stone:{c:'#8a8f98',hp:90,d:8,r:24,s:0,x:6},soldier:{c:'#c0392b',hp:60,d:12,r:18,s:100,x:8},witch:{c:'#8e44ad',hp:40,d:6,r:16,s:70,x:10},
zombie:{c:'#6b8e4e',hp:100,d:10,r:19,s:55,x:9},villager:{c:'#e0b080',hp:20,d:0,r:14,s:60,x:3}};
let U=JSON.parse(localStorage.rl_u||'{}'),me,S,P,mobs=[],pk=[],pr=[],keys={},mouse={d:0,x:0,y:0},ft=[],near=null,paused=1,rot=0;
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0],hash=s=>{let h=5381;for(const c of s)h=h*33^c.charCodeAt(0);return''+(h>>>0)};
let selC=null;
function setBub(){$('bub').innerHTML=me?`👤 <b>${me}</b> <a onclick="logout()">log out</a>`:'👤 Not logged in'}
function stage(n){$('title').classList.remove('hide');for(let i=1;i<4;i++)$('s'+i).classList.toggle('hide',i!=n);$('nm').classList.toggle('hide',n!=3);$('ready').classList.toggle('hide',n!=3);$('nm').textContent=me||'';if(n==2){selC=null;$('ci').innerHTML='<p>Pick a class to see its perks and cons</p>';document.querySelectorAll('.cb').forEach(b=>b.classList.remove('on'))}}
function clsInfo(k){selC=k;const c=C[k],pr=[],cn=[];for(const x in LBL){if(c[x]>1)pr.push(`+ ${LBL[x]} ${c[x]}x`);if(c[x]<1)cn.push(`- ${LBL[x]} ${c[x]}x`)}
$('ci').innerHTML=`<canvas id=cpv width=150 height=110></canvas><h3 style="color:${c.col};margin:2px">${k}</h3><p>${c.d}</p><div class=pk>${pr.join('<br>')}</div><div class=cn>${cn.join('<br>')||'No cons'}</div><button class=go onclick="pickC()">Choose ${k}</button>`;art($('cpv').getContext('2d'),k,60,55,24,0);document.querySelectorAll('.cb').forEach(b=>b.classList.toggle('on',b.dataset.k==k))}
function pickC(){S={cls:selC,lvl:1,xp:0,sp:0,sk:{hp:0,str:0,spd:0,reg:0,lk:0},tn:[],coins:0,pouch:[],eq:{w:null,a:null,b:null}};sv();stage(3)}
function auth(reg){const n=$('u').value.trim(),p=$('p').value;if(!n||!p)return $('err').textContent='Fill in both fields';
if(reg){if(U[n])return $('err').textContent='Name taken';U[n]={pw:hash(p),s:null}}else if(!U[n]||U[n].pw!==hash(p))return $('err').textContent='Wrong login';
me=n;S=U[n].s;localStorage.rl_s=n;sv();setBub();$('err').textContent='';stage(S?3:2)}
function ready(){$('title').classList.add('hide');start()}
function logout(){localStorage.removeItem('rl_s');me=null;S=null;setBub();stage(1)}
const sv=()=>{if(me){if(S)U[me].s=S;localStorage.rl_u=JSON.stringify(U)}};setInterval(sv,5000);
function poly(x,f,o,...p){x.fillStyle=f;x.strokeStyle=dk(f,.45);x.lineWidth=o/6;x.lineJoin='round';x.beginPath();for(let i=0;i<p.length;i+=2)x[i?'lineTo':'moveTo'](p[i]*o,p[i+1]*o);x.closePath();x.fill();x.stroke()}
const IM={},IU={};function icon(id){if(IM[id])return IM[id];const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.lineJoin='round';const P=(f,...p)=>poly(x,f,1,...p),O=(X,Y,R,f)=>orb(x,X,Y,R,f),T=I[id].t;
if(T=='w'){x.translate(32,32);x.rotate(.785);x.translate(-32,-32);
if(['iron_sword','great','excal'].includes(id)){const w=id=='great'?9:6,f=id=='excal'?'#ffe680':id=='great'?'#cfd8ff':'#e6edf5';P(f,32,2,32+w,9,32+w,40,32-w,40,32-w,9);P('#c9a227',14,40,50,40,50,47,14,47);P('#7a4a22',29,47,35,47,35,60,29,60);O(32,62,4,id=='excal'?'#f33':'#c9a227')}
else if(id=='war_axe'){P('#7a4a22',29,6,35,6,35,60,29,60);P('#c9d1da',35,8,56,2,56,32,35,26);P('#c9d1da',29,8,8,2,8,32,29,26)}
else if(id=='orc_club'){P('#8b5a2b',27,6,37,6,34,60,30,60);[[22,12],[42,12],[22,26],[42,26],[32,4]].forEach(a=>O(a[0],a[1],4,'#ccc'))}
else if(id=='dagger'){P('#e0e6ec',32,16,37,24,37,44,27,44,27,24);P('#6b4a2b',22,44,42,44,42,49,22,49);P('#7a4a22',29,49,35,49,35,60,29,60)}
else{P(id=='thorn'?'#6b8e23':'#7a4a22',30,12,34,12,34,62,30,62);const gc={fire_staff:'#ff8a1f',storm:'#4fd0ff',wand:'#ffd93a',thorn:'#2e8b3a'}[id];if(gc){O(32,10,id=='wand'?6:9,gc);if(id=='thorn'){O(25,28,5,gc);O(39,38,5,gc)}}}}
else if(T=='a'){const f={leather:'#a56a3a',chain:'#9aa3ad',plate:'#c8d0d8',robe:'#6a3cb3',mithril:'#7fe0e0',dragon:'#c0392b'}[id];P(f,14,14,24,6,40,6,50,14,56,30,48,34,46,58,18,58,16,34,8,30);P(dk(f,.25),24,6,40,6,32,18);P(id=='dragon'||id=='plate'?'#ffd54a':dk(f,.3),30,18,34,18,34,58,30,58);if(id=='chain')for(let i=0;i<9;i++)O(20+i%3*12,28+(i/3|0)*9,2.5,'#cfd6dd')}
else{const f={sandals:'#d9b27a',boots:'#7a4a22',swift:'#4aa8e0',wind:'#58d6a0',hermes:'#ffd54a'}[id];P(f,22,6,40,6,40,34,56,42,56,56,22,56);P('#333',20,52,58,52,58,60,20,60);P(dk(f,.25),22,6,40,6,40,14,22,14);if(['swift','wind','hermes'].includes(id)){P('#fff',22,20,6,12,10,26,22,30);P('#fff',22,32,8,26,12,38,22,42)}}
return IM[id]=c}
const iu=id=>IU[id]??=icon(id).toDataURL();
function art(x,k,px,py,r,a){const c=C[k].col,o=r,ci=(X,Y,R,f)=>orb(x,X*o,Y*o,R*o,f),pg=(f,...p)=>poly(x,f,o,...p),sk='#f0c9a0',arms=(f,s=sk)=>{ci(.1,-.95,.36,f);ci(.1,.95,.36,f);ci(.85,-.95,.27,s);ci(.85,.95,.27,s)};
x.save();x.translate(px,py);x.rotate(a||0);x.fillStyle='#0003';x.beginPath();x.arc(0,.12*o,1.25*o,0,7);x.fill();
if(k=='Knight'){pg('#b22',-.8,-.9,-1.7,0,-.8,.9);arms('#9aa6b2');ci(0,0,1,c);ci(-.1,0,.68,'#cfd6dd');pg('#c33',-.3,-.12,.3,-.12,.3,.12,-.3,.12);pg('#c33',-.06,-.36,.06,-.36,.06,.36,-.06,.36);ci(.85,-.95,.62,'#3b78c8');ci(.85,-.95,.22,'#e8e8e8');pg('#e8eef5',.85,.8,2.5,.9,2.5,1,.85,1.1);pg('#c9a227',.7,.55,.95,.55,.95,1.35,.7,1.35);ci(.1,0,.62,'#a9b3bd');pg('#2d3640',.3,-.36,.68,-.28,.68,.28,.3,.36);pg('#d33',-.15,-.17,-.95,-.1,-.95,.1,-.15,.17);ci(.18,0,.1,'#fff')}
else if(k=='Sorcerer'){pg('#4b2a82',-.9,-1,-1.9,0,-.9,1);arms('#7b3fbf');ci(0,0,1.05,'#7b3fbf');ci(0,0,.82,c);pg('#ffd93a',-.1,-.55,.1,-.55,.1,.55,-.1,.55);pg('#8b2a2a',.7,-1.25,1.35,-1.25,1.35,-.65,.7,-.65);pg('#e8d9a0',.75,-1.2,1.3,-1.2,1.3,-.7,.75,-.7);pg('#6b4a2b',.85,.9,2.6,.9,2.6,1.05,.85,1.05);ci(2.7,1,.34,'#ff8a1f');ci(2.7,1,.16,'#ffe08a');ci(.1,0,.9,'#4b2a82');ci(.1,0,.6,'#6a3cb3');pg('#ffd93a',.3,-.1,.45,0,.3,.1);ci(.1,0,.16,'#ffd93a')}
else if(k=='Orc'){pg('#6b4a2b',-.7,-.7,-1.3,0,-.7,.7);arms('#5a7a20','#6f9a2a');ci(0,0,1,c);pg('#8b5a2b',.5,-.7,1,-.5,1,.5,.5,.7);ci(.2,-.95,.3,'#999');ci(.2,.95,.3,'#999');pg('#8b5a2b',.85,.85,2.3,.9,2.3,1.1,.85,1.15);ci(2.4,1,.5,'#7a5230');for(let i=0;i<6;i++)ci(2.4+Math.cos(i*1.05)*.5,1+Math.sin(i*1.05)*.5,.13,'#ccc');ci(.15,0,.62,'#6f9a2a');pg('#222',-.4,-.1,.1,-.1,.1,.1,-.4,.1);pg('#2d4010',.35,-.45,.7,-.2,.4,-.05);pg('#fff',.6,-.3,.98,-.4,.7,-.12);pg('#fff',.6,.3,.98,.4,.7,.12);ci(.45,-.22,.08,'#f33');ci(.45,.22,.08,'#f33')}
else if(k=='Druid'){for(let i=0;i<6;i++)ci(Math.cos(i*1.05-.3)*.9-.2,Math.sin(i*1.05-.3)*.9,.38,'#2e8b3a');arms('#2e8b3a','#e8c39e');ci(0,0,1,c);ci(0,0,.7,'#2e8b3a');pg('#8b5a2b',.85,.9,2.5,.9,2.5,1.05,.85,1.05);ci(2.55,1,.35,'#3fbf5a');ci(2.55,1,.15,'#ffd0f0');ci(.1,0,.58,'#e8c39e');pg('#8b5a2b',0,-.5,.5,-1,.6,-.9,.1,-.4);pg('#8b5a2b',0,.5,.5,1,.6,.9,.1,.4);ci(.3,-.2,.12,'#ff7ab8');ci(.3,.2,.12,'#ffe65d');ci(-.2,0,.15,'#fff');pg('#2e8b3a',-.3,-.6,.4,-.7,.4,-.6,-.3,-.5);ci(.4,0,.07,'#432')}
else if(k=='Rogue'){pg('#222',-.8,-.8,-1.8,0,-.8,.8);arms('#2d3138','#e8c39e');ci(0,0,1,c);pg('#7a1f1f',-.1,-.9,.1,-.9,.1,.9,-.1,.9);pg('#6b4a2b',.3,-.8,.5,-.8,.5,.8,.3,.8);pg('#e0e6ec',.85,.9,2,.95,2,1.05,.85,1.1);pg('#e0e6ec',.85,-.9,2,-.95,2,-1.05,.85,-1.1);pg('#6b4a2b',.7,.8,.9,.8,.9,1.2,.7,1.2);pg('#6b4a2b',.7,-.8,.9,-.8,.9,-1.2,.7,-1.2);ci(.1,0,.64,'#2d3138');ci(.25,0,.4,'#e8c39e');pg('#c33',.4,-.4,.7,-.3,.7,.3,.4,.4);ci(.5,-.15,.07,'#fff');ci(.5,.15,.07,'#fff');pg('#2d3138',-.5,-.3,-1.2,0,-.5,.3)}
else{ci(0,0,1.1,'#6b4a2b');arms(c,'#e8b48c');ci(0,0,.95,c);ci(0,0,.6,'#8b5a2b');pg('#7a2000',-.5,-.1,.5,-.1,.5,.1,-.5,.1);pg('#6b4a2b',.85,.85,2.4,.9,2.4,1.1,.85,1.15);pg('#c9d1da',2.1,1,2.8,.2,3.1,1,2.8,1.8);ci(2.7,1,.15,'#888');ci(.1,0,.62,'#e8b48c');pg('#8b4a1a',.2,-.5,.7,-.3,.7,.3,.2,.5);ci(0,0,.55,'#9aa0a6');pg('#f2ead0',-.1,-.5,.2,-1.5,.5,-.5);pg('#f2ead0',-.1,.5,.2,1.5,.5,.5);pg('#c33',.35,-.25,.62,-.2,.62,-.08,.35,-.12);ci(.4,.22,.07,'#fff')}
x.restore()}
let vill=[],shops=[],chests=[];
const hit=(a,b,m=0)=>a.x<b.x+b.w+m&&a.x+a.w+m>b.x&&a.y<b.y+b.h+m&&a.y+a.h+m>b.y;
function mkV(cx,cy,pl,rf){const w=rnd(700,1000),H=rnd(520,800),v={x:cx,y:cy,w,H,h:[],rd:[],pl,rf},R=(x,y,w,h)=>v.rd.push({x,y,w,h}),ty=pick(['cross','twin','ring','single']);
R(cx-w/2-200,cy-45,w+400,90);if(ty=='cross'||ty=='ring')R(cx-45,cy-H/2,90,H);if(ty=='twin'){R(cx-rnd(120,260),cy-H/2,80,H);R(cx+rnd(60,200),cy-H/2,80,H)}if(ty=='ring'){R(cx-w/2,cy-H/2,w,70);R(cx-w/2,cy+H/2-70,w,70)}
for(let n=0;n<200&&v.h.length<16;n++){const q={x:cx+rnd(-w/2,w/2),y:cy+rnd(-H/2,H/2),w:rnd(130,230),h:rnd(110,170)};if(v.rd.some(r=>hit(q,r,22))||v.h.some(r=>hit(q,r,25))||!v.rd.some(r=>hit(q,r,110)))continue;q.d=Math.random()<.5;v.h.push(q)}
for(const sx of[-1,1])shops.push({x:cx+sx*(w/2+260),y:cy,stock:Array.from({length:5},()=>({id:pick(Object.keys(I).filter(k=>I[k].r<3)),r:Math.random()<.7?0:1}))});
for(let i=-1;i<2;i++)chests.push({x:cx+i*w/4,y:cy+(i%2?25:-20),t:0});return v}
function mkWorld(){vill=[];shops=[];chests=[];const pal=[['#b8793c','#d35c4a'],['#c9b28a','#4a6fa5'],['#9c9c9c','#7a4a22'],['#e0cfa0','#2f8f5b'],['#a0614a','#555d66']],rf=['gable','hip','round','flat'];
vill.push(mkV(G/2+1000,G/2,pick(pal),pick(rf)));let t=0;while(vill.length<12&&t++<800){const x=rnd(900,G-900),y=rnd(900,G-900);if(vill.some(v=>Math.hypot(v.x-x,v.y-y)<1700))continue;vill.push(mkV(x,y,pick(pal),pick(rf)))}}
function start(){P={x:G/2,y:G/2,hp:1};const s=stats();P.hp=s.hp;mkWorld();mobs=[];pk=[];pr=[];paused=0;S.sk.lk??=0;S.tn??=[];if(!S.tn.length&&Object.values(S.sk).some(v=>v>0)){S.sp+=Object.values(S.sk).reduce((a,b)=>a+b,0);for(const k in S.sk)S.sk[k]=0}const mg=i=>i&&(i.r==null?{id:i.id,r:0}:i);S.pouch=S.pouch.map(mg);for(const k in S.eq)S.eq[k]=mg(S.eq[k]);if(!window.lp){lp=1;requestAnimationFrame(loop)}}
function stats(){const c=C[S.cls],E=S.eq,k=S.sk,it=e=>e?I[e.id].v*Math.pow(I[e.id].t=='b'?1.25:1.55,e.r):0,w=E.w;
return{hp:(100+it(E.a,.15)+k.hp*15)*c.hp,spd:(190+k.spd*8)*c.spd*(1+it(E.b,.05)),reg:(1.2+k.reg*.4)*c.reg,body:8*c.phys*(1+k.str*.1),
wd:w?it(w,.15)*(I[w.id].e?c.elem:c.wep)*(1+k.str*.1):0,luck:c.luck*(1+(k.lk||0)*.08)}}
function spawn(){const t=pick(Object.keys(MT)),T=MT[t];let x,y;do{x=rnd(50,G-50);y=rnd(50,G-50)}while(Math.hypot(x-P.x,y-P.y)<500);mobs.push({t,x,y,hp:T.hp,mh:T.hp,h:0,sh:rnd(1,3),a:rnd(0,6),w:0})}
function drop(x,y,luck,mult=1,coins=1){if(coins)pk.push({x:x+rnd(-15,15),y:y+rnd(-15,15),c:Math.ceil(rnd(2,9)*mult)});
const q=Math.random()/luck;if(q<.25*mult||(Math.random()<.15&&mult>=1)){const z=Math.random()/luck,tier=z<.0002?8:z<.001?7:z<.004?6:z<.012?5:z<.03?4:z<.07?3:z<.15?2:z<.35?1:0;
const l=Object.keys(I).filter(k=>I[k].r<=tier),id=Math.random()<.4?C[S.cls].w:pick(l);pk.push({x:x+rnd(-20,20),y:y+rnd(-20,20),i:{id,r:tier}})}}
const msg=(t,c='#fff')=>ft.push({t,c,life:2});
function loop(t0){if(paused){return requestAnimationFrame(loop)}const dt=0.016,s=stats(),W2=cv.width,H2=cv.height;rot+=dt*3;
let dx=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),dy=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);
if(mouse.d){dx=mouse.x-W2/2;dy=mouse.y-H2/2;const m=Math.hypot(dx,dy);if(m>25){dx/=m;dy/=m}else dx=dy=0}else{const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m}
P.x=Math.max(20,Math.min(G-20,P.x+dx*s.spd*dt));P.y=Math.max(20,Math.min(G-20,P.y+dy*s.spd*dt));for(const v of vill)if(Math.abs(v.x-P.x)<1000&&Math.abs(v.y-P.y)<900)for(const h of v.h){const nx=Math.max(h.x,Math.min(P.x,h.x+h.w)),ny=Math.max(h.y,Math.min(P.y,h.y+h.h)),d=Math.hypot(P.x-nx,P.y-ny);if(d>0&&d<24){P.x=nx+(P.x-nx)/d*24;P.y=ny+(P.y-ny)/d*24}}P.a=Math.atan2(dy||.001,dx||.001);
P.hp=Math.min(s.hp,P.hp+s.reg*dt);while(mobs.length<320)spawn();
const wp=S.eq.w?NB[S.eq.w.r]:0;
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
pk=pk.filter(p=>{if(Math.hypot(p.x-P.x,p.y-P.y)<34){if(p.c){S.coins+=p.c;msg('+'+p.c+' coins','#fd0')}else{S.pouch.push(p.i);msg('Got '+RN[p.i.r]+' '+I[p.i.id].n,RC[p.i.r])}return 0}return 1});
if(P.hp<=0){msg('You died! Lost half your coins','#f66');S.coins>>=1;P.x=G/2;P.y=G/2;P.hp=s.hp}
near=null;for(const c of chests)if(c.t>0)c.t-=dt;
for(const c of chests)if(Math.hypot(c.x-P.x,c.y-P.y)<60&&c.t<=0)near={k:'chest',c};
for(const sh of shops)if(Math.hypot(sh.x-P.x,sh.y-P.y)<110)near={k:'shop',sh};
draw(s);requestAnimationFrame(loop)}
const TXT=(t,x,y,z=16,al='left')=>{g.font=`bold ${z}px Ubuntu,Arial`;g.textAlign=al;g.lineWidth=z/4;g.strokeStyle='#000';g.lineJoin='round';g.strokeText(t,x,y);g.fillStyle='#fff';g.fillText(t,x,y)};
const bar=(x,y,w,h,p,c)=>{g.lineWidth=4;g.fillStyle='#2a2a2a';g.strokeStyle='#1c1c1c';g.beginPath();g.roundRect(x,y,w,h,h/2);g.fill();g.stroke();g.fillStyle=c;g.beginPath();g.roundRect(x+3,y+3,Math.max(h-6,(w-6)*Math.max(0,Math.min(1,p))),h-6,(h-6)/2);g.fill()};
const IC=['⚔️','🛡️','👟'],TI=k=>IC[['w','a','b'].indexOf(k)];
function slot(X,Y,z,i){const c=i?RC[i.r]:'#00000044';g.lineWidth=4;g.fillStyle=c;g.strokeStyle=i?dk(c):'#0008';g.beginPath();g.roundRect(X-z/2,Y-z/2,z,z,8);g.fill();g.stroke();if(i)g.drawImage(icon(i.id),X-z*.38,Y-z*.38,z*.76,z*.76)}
function draw(s){const W2=cv.width,H2=cv.height,cx=W2/2-P.x,cy=H2/2-P.y,tm=Date.now()/1000;
g.fillStyle='#157a47';g.fillRect(0,0,W2,H2);g.save();g.translate(cx,cy);g.fillStyle='#1ea761';g.fillRect(0,0,G,G);
g.strokeStyle='#0000001c';g.lineWidth=2;g.beginPath();for(let i=0;i<=G;i+=64){g.moveTo(i,0);g.lineTo(i,G);g.moveTo(0,i);g.lineTo(G,i)}g.stroke();g.lineWidth=8;g.strokeStyle='#0a3d22';g.strokeRect(0,0,G,G);
for(const v of vill){if(Math.abs(v.x-P.x)>1400||Math.abs(v.y-P.y)>1200)continue;g.lineWidth=6;for(const r of v.rd){g.fillStyle='#d2b27a';g.strokeStyle='#a98b55';g.beginPath();g.roundRect(r.x,r.y,r.w,r.h,18);g.fill();g.stroke()}
for(const h of v.h){const[w,rc]=v.pl,cxh=h.x+h.w/2,cyh=h.y+h.h/2;g.lineWidth=6;g.fillStyle=w;g.strokeStyle=dk(w,.5);g.beginPath();g.roundRect(h.x,h.y,h.w,h.h,10);g.fill();g.stroke();g.fillStyle=rc;g.strokeStyle=dk(rc,.5);
if(v.rf=='round'){g.beginPath();g.ellipse(cxh,cyh,h.w/2-10,h.h/2-10,0,0,7);g.fill();g.stroke();g.beginPath();g.arc(cxh,cyh,16,0,7);g.fillStyle=dk(rc,.3);g.fill()}
else{g.beginPath();g.roundRect(h.x+8,h.y+8,h.w-16,h.h-16,8);g.fill();g.stroke();g.beginPath();if(v.rf=='gable'){g.moveTo(h.x+8,cyh);g.lineTo(h.x+h.w-8,cyh)}else if(v.rf=='hip'){g.moveTo(h.x+8,h.y+8);g.lineTo(cxh,cyh);g.lineTo(h.x+h.w-8,h.y+8);g.moveTo(h.x+8,h.y+h.h-8);g.lineTo(cxh,cyh);g.lineTo(h.x+h.w-8,h.y+h.h-8)}else{g.rect(h.x+h.w-44,h.y+14,24,24)}g.stroke()}
g.fillStyle='#4a2c12';g.fillRect(cxh-12,h.y+h.h-4,24,10)}}
for(const c of chests){g.lineWidth=4;g.fillStyle=c.t>0?'#888':'#f0b429';g.strokeStyle=c.t>0?'#444':'#8a5a10';g.beginPath();g.roundRect(c.x-19,c.y-14,38,28,5);g.fill();g.stroke();g.fillStyle='#fff8';g.fillRect(c.x-3,c.y-4,6,10)}
for(const sh of shops){g.lineWidth=6;g.fillStyle='#ffe65d';g.strokeStyle='#a38c1c';g.beginPath();g.roundRect(sh.x-60,sh.y-60,120,120,14);g.fill();g.stroke();for(let i=0;i<5;i++){g.fillStyle=i%2?'#fff':'#de1f1f';g.fillRect(sh.x-60+i*24,sh.y-60,24,22)}TXT('$',sh.x,sh.y+26,60,'center')}
for(const p of pk){const b=Math.sin(tm*4+p.x)*2;if(p.c)orb(g,p.x,p.y+b,8,'#ffd93a');else slot(p.x,p.y+b,30,p.i)}
for(const m of mobs){if(Math.abs(m.x-P.x)>W2/2+80||Math.abs(m.y-P.y)>H2/2+80)continue;const T=MT[m.t],r=T.r,an=Math.atan2(P.y-m.y,P.x-m.x),o2=(a,b,R,f)=>orb(g,a*r,b*r,R*r,f),p2=(f,...p)=>poly(g,f,r,...p);g.save();g.translate(m.x,m.y);g.rotate(m.t=='stone'?m.a:an);
if(m.t=='stone'){const pts=[];for(let i=0;i<9;i++){const q=i*.698;pts.push(Math.cos(q)*(1+.12*Math.sin(i*2.3)),Math.sin(q)*(1+.12*Math.sin(i*2.3)))}p2('#8a8f98',...pts);p2('#a9aeb7',-.3,-.6,.3,-.7,.5,-.2,-.2,-.1);p2('#6b7078',.1,.2,.6,.5,.3,.7);p2('#555a62',-.5,.1,-.2,.3,-.35,.55,-.6,.3);o2(-.4,.45,.22,'#6a9b4a');o2(.45,-.35,.14,'#b9bec6')}
else if(m.t=='zombie'){p2('#6b8e4e',.3,-.9,1.7,-.7,1.7,-.4,.3,-.5);p2('#6b8e4e',.3,.9,1.7,.7,1.7,.4,.3,.5);o2(1.8,-.55,.28,'#5a7a3e');o2(1.8,.55,.28,'#5a7a3e');o2(0,0,1,'#6b8e4e');p2('#445',-.6,-.8,.2,-.7,-.1,.1,-.7,.4);o2(-.3,.45,.18,'#a33');o2(.1,0,.6,'#7fa05e');o2(.45,-.22,.14,'#fff');o2(.45,.22,.14,'#fff');o2(.5,-.22,.06,'#111');o2(.5,.22,.06,'#111');p2('#400',.55,-.15,.68,-.1,.68,.1,.55,.15)}
else if(m.t=='soldier'){p2('#c0392b',-.7,-.8,-1.5,0,-.7,.8);o2(.1,-.95,.38,'#9aa3ad');o2(.1,.95,.38,'#9aa3ad');o2(0,0,1,'#8e2b2b');o2(0,0,.7,'#b8c0c8');p2('#e0e6ec',.8,.85,2.2,.95,2.2,1.05,.8,1.15);o2(.8,-.95,.55,'#c0392b');o2(.8,-.95,.2,'#e6e6e6');o2(.1,0,.6,'#9aa3ad');p2('#d33',-.1,-.15,-.9,-.08,-.9,.08,-.1,.15);p2('#222',.3,-.3,.6,-.25,.6,.25,.3,.3)}
else if(m.t=='witch'){p2('#3a1a48',-.8,-.9,-1.6,0,-.8,.9);o2(.1,-.95,.3,'#5b2c6f');o2(.1,.95,.3,'#5b2c6f');o2(0,0,1,'#5b2c6f');o2(.85,.95,.25,'#9bd36a');o2(1.15,.95,.3,'#b04bff');o2(.1,0,.95,'#4a235a');o2(.1,0,.55,'#3a1a48');p2('#ffd93a',.35,-.12,.55,-.12,.55,.12,.35,.12);o2(0,0,.15,'#ffd93a')}
else{o2(0,0,1,'#6a8caf');o2(.1,-.95,.3,'#6a8caf');o2(.1,.95,.3,'#6a8caf');o2(.85,.85,.25,'#f0c08a');p2('#8b5a2b',.8,.78,2,.82,2,.92,.8,.96);p2('#aaa',2,.55,2.5,.6,2.5,.7,2,.75);p2('#aaa',2,.85,2.5,.9,2.5,1,2,1.05);o2(.1,0,.6,'#f0c08a');o2(.1,0,.9,'#e0c070');o2(.1,0,.5,'#c9a24a')}
g.restore();if(m.hp<m.mh)bar(m.x-24,m.y+r+8,48,12,m.hp/m.mh,'#7eef6d')}
for(const p of pr)orb(g,p.x,p.y,9,'#b04bff');
if(S.eq.w){const w=I[S.eq.w.id],n=NB[S.eq.w.r];for(let i=0;i<n;i++){const q=rot+i*6.283/n,X=P.x+Math.cos(q)*58,Y=P.y+Math.sin(q)*58;orb(g,X,Y,10,RC[S.eq.w.r]);if(w.e)orb(g,X,Y,4,'#ffb347')}}
art(g,S.cls,P.x,P.y,22,P.a);bar(P.x-34,P.y+34,68,13,P.hp/s.hp,'#7eef6d');TXT(me,P.x,P.y-40,14,'center');g.restore();
ft.forEach((f,i)=>{g.globalAlpha=Math.min(1,f.life);g.fillStyle=f.c;TXT(f.t,W2/2,H2/2-110-i*22,17,'center');f.life-=.016});g.globalAlpha=1;ft=ft.filter(f=>f.life>0).slice(-6);
g.save();g.beginPath();g.arc(48,52,30,0,7);g.fillStyle='#ffe65d';g.fill();g.clip();art(g,S.cls,48,52,17,0);g.restore();g.lineWidth=5;g.strokeStyle='#cfb93c';g.beginPath();g.arc(48,52,30,0,7);g.stroke();bar(70,24,240,34,P.hp/s.hp,'#7eef6d');TXT(me,88,49,18);bar(70,62,240,22,S.xp/(40*Math.pow(S.lvl,1.5)),'#ffe65d');TXT('Lv '+S.lvl,84,79,13);TXT('🪙 '+S.coins,18,112,18);if(S.sp>0)TXT(S.sp+' TP - open Talents',18,136,15);
if(near){TXT(near.k=='shop'?'Press E to shop':'Press E to open chest',W2/2,H2/2+90,20,'center');g.lineWidth=5;g.fillStyle='#7eef6d';g.strokeStyle='#4f9a3a';g.beginPath();g.arc(W2-210,H2-70,34,0,7);g.fill();g.stroke();TXT('E',W2-210,H2-60,28,'center')}

[['⚒️','#d99b57','#b8793c','U'],['⭐','#db5a5a','#b84444','K'],['🎒','#5aa0de','#3d7fb8','P']].forEach(([e,f,d,k],i)=>{const X=16+i*64;g.lineWidth=5;g.fillStyle=f;g.strokeStyle=d;g.beginPath();g.roundRect(X,H2-72,56,56,10);g.fill();g.stroke();g.font='28px Arial';g.textAlign='center';g.fillText(e,X+28,H2-35);TXT(k,X+10,H2-56,12)});
const mm=180,mx=W2-mm-16,my=16,kk=mm/G;g.save();g.beginPath();g.roundRect(mx,my,mm,mm,10);g.clip();g.fillStyle='#111';g.fillRect(mx,my,mm,mm);g.fillStyle='#f2f2f2';g.fillRect(mx+6,my+6,mm-12,mm-12);g.fillStyle='#8b5a2b';for(const v of vill)g.fillRect(mx+v.x*kk-7,my+v.y*kk-5,14,10);g.fillStyle='#ffe65d';for(const sh of shops)g.fillRect(mx+sh.x*kk-2,my+sh.y*kk-2,4,4);g.restore();
g.lineWidth=6;g.strokeStyle='#1c1c1c';g.beginPath();g.roundRect(mx,my,mm,mm,10);g.stroke();orb(g,mx+P.x*kk,my+P.y*kk,5,'#ff6ec7');
const R=150,ox=W2,oy=H2,col=C[S.cls].col,gr=g.createRadialGradient(ox,oy,10,ox,oy,R);gr.addColorStop(0,col);gr.addColorStop(1,dk(col,.3));
g.lineWidth=7;g.strokeStyle=dk(col,.5);g.fillStyle=gr;g.beginPath();g.moveTo(ox,oy);g.arc(ox,oy,R,Math.PI,1.5*Math.PI);g.closePath();g.fill();g.stroke();art(g,S.cls,ox-48,oy-48,22,-.8);
[['w',203],['a',227],['b',251]].forEach(([k,a])=>{const q=a*Math.PI/180;slot(ox+Math.cos(q)*104,oy+Math.sin(q)*104,50,S.eq[k]);if(!S.eq[k]){g.font='20px Arial';g.globalAlpha=.4;g.textAlign='center';g.fillText(TI(k),ox+Math.cos(q)*104,oy+Math.sin(q)*104+7);g.globalAlpha=1}})}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;keys[e.key]=1;if(!S||$('title').offsetParent)return;const k=e.key.toLowerCase();
if(k=='escape')closeM();else if(k=='k')openM('Skills');else if(k=='u')openM('Craft');else if(k=='p')openM('Pouch');else if(k=='e'&&near&&paused==0){near.k=='shop'?openM('Shop',near.sh):chest(near.c)}});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=0;keys[e.key]=0});cv.onmousedown=e=>{if(!S||paused){mouse.d=1;return}const by=cv.height-72;if(e.clientY>by&&e.clientY<by+56&&e.clientX>16&&e.clientX<208){openM(['Craft','Skills','Pouch'][(e.clientX-16)/64|0]);return}if(near&&Math.hypot(e.clientX-(cv.width-210),e.clientY-(cv.height-70))<40){near.k=='shop'?openM('Shop',near.sh):chest(near.c);return}mouse.d=1};
const tp=e=>{const t=e.touches[0]||e.changedTouches[0];return{clientX:t.clientX,clientY:t.clientY}};cv.addEventListener('touchstart',e=>{e.preventDefault();const p=tp(e);mouse.x=p.clientX;mouse.y=p.clientY;cv.onmousedown(p)},{passive:false});cv.addEventListener('touchmove',e=>{e.preventDefault();const p=tp(e);mouse.x=p.clientX;mouse.y=p.clientY},{passive:false});cv.addEventListener('touchend',()=>mouse.d=0);onmouseup=()=>mouse.d=0;onmousemove=e=>{mouse.x=e.clientX;mouse.y=e.clientY};
function chest(c){c.t=180;msg('Chest opened!','#fd0');for(let i=0;i<3;i++)drop(c.x,c.y+30,stats().luck,2,1)}
let shopCur=null,stk=1,drp=0,cs=null;function closeM(){$('menu').classList.add('hide');paused=0}
const TT={w:'Weapon',a:'Armour',b:'Boots'},AU={};
const artUrl=k=>AU[k]??=(()=>{const c=document.createElement('canvas');c.width=c.height=110;art(c.getContext('2d'),k,55,55,26,0);return c.toDataURL()})();
const ib=(i,x='')=>{const c=RC[i.r];return`<div class=ib style="background:${c};border-color:${dk(c)}"><img src="${iu(i.id)}"><span>${I[i.id].n}</span><small>${RN[i.r]}</small>${x}</div>`};
const sl=(i,n,oc,gray)=>{const c=gray?'#777':RC[i.r];return`<div class=sl style="background:${c};border-color:${dk(c)}" onclick="${oc}"><img src="${iu(i.id)}"><span>${I[i.id].n}</span>${n>1?`<b>x${n}</b>`:''}</div>`};
const BR=[['lk','🍀',-55],['str','💪',-28],['spd','🌀',0],['reg','💗',28],['hp','✚',55]],TN=[];
BR.forEach(([b,ic,a])=>{const d=a*Math.PI/180;for(let k=0;k<6;k++){const l=110*(k+1),w=(k%2?1:-1)*26;TN.push({id:b+k,b,ic,k,par:k?b+(k-1):'root',cost:k+1,x:Math.cos(d)*l-Math.sin(d)*w,y:Math.sin(d)*l+Math.cos(d)*w})}});
function talH(){const s=stats(),ox=110,oy=520,av=n=>!S.tn.includes(n.id)&&(n.par=='root'||S.tn.includes(n.par))&&S.sp>=n.cost,P0=n=>n.par=='root'?{x:0,y:0}:TN.find(t=>t.id==n.par);
return`<div class=ttl>Talents</div><div class=tp>${S.sp} TP</div><button class="red rs" onclick="trs()">Reset</button><div class=tree><svg width=900 height=1040>${TN.map(n=>{const p=P0(n);return`<line x1=${ox+p.x} y1=${oy+p.y} x2=${ox+n.x} y2=${oy+n.y}></line>`}).join('')}</svg>`+TN.map(n=>`<div class="tn ${S.tn.includes(n.id)?'on':av(n)?'av':''}" style="left:${ox+n.x-29}px;top:${oy+n.y-29}px" onclick="tn('${n.id}')">${n.ic}<i>${n.cost}</i></div>`).join('')+`<img class=root src="${artUrl(S.cls)}" style="left:${ox-50}px;top:${oy-50}px"><div class=rt style="left:${ox-70}px;top:${oy+58}px">Health: ${s.hp|0}<br>Body Damage: ${s.body.toFixed(2)}</div></div>`}
function craftH(){const gp={};S.pouch.forEach(i=>{(gp[i.id+'|'+i.r]??=[]).push(i)});const ks=Object.keys(gp).sort((a,b)=>b.split('|')[1]-a.split('|')[1]||a.localeCompare(b)),sel=gp[cs]?cs:null,[id,r]=sel?sel.split('|'):['',0],n=sel?Math.min(5,gp[sel].length):0,ok=sel&&gp[sel].length>=5&&r<8;let ps='';
for(let k=0;k<5;k++){const q=(-90+72*k)*Math.PI/180,X=150+Math.cos(q)*75-34,Y=150+Math.sin(q)*75-34;ps+=`<div class="sl pos ${k<n?'':'e'}" style="left:${X}px;top:${Y}px;${k<n?`background:${RC[r]};border-color:${dk(RC[r])}`:''}">${k<n?`<img src="${iu(id)}">`:''}</div>`}
return`<div class=ttl>Craft</div><p class=sub>Combine 5 of the same item to craft an upgrade</p><div class=pent>${ps}</div><p class=sub>${sel&&r<8?CH[r]*100+'% success chance':'?% success chance'}</p><button class=cr ${ok?'':'disabled'} onclick="comb('${id}',${r})">Craft</button><div class=grid2>`+ks.map(k=>{const[i,r2]=k.split('|');return sl({id:i,r:+r2},gp[k].length,`cs='${k}';re()`,k!=sel)}).join('')+'<div class="sl e"></div>'.repeat(Math.max(0,32-ks.length))+'</div>'}
function invH(){let h=`<div class=ttl>Inventory</div><p class=sub>Tap an item to ${drp?'drop':'equip'} it</p><label class=sub><input type=checkbox ${stk?'checked':''} onchange="stk=this.checked;re()"> Stack</label> <label class=sub><input type=checkbox ${drp?'checked':''} onchange="drp=this.checked;re()"> Drop mode</label><div class=band><span>Equipped</span></div><div class=row2>`+['w','a','b'].map(k=>{const e=S.eq[k];return e?sl(e,0,`uneq('${k}')`):`<div class="sl e"><span>${TT[k]}</span></div>`}).join('')+'</div>';
for(let r=8;r>=0;r--){const it=S.pouch.map((i,n)=>[i,n]).filter(x=>x[0].r==r).sort((a,b)=>I[a[0].id].n.localeCompare(I[b[0].id].n));if(!it.length)continue;const gp=[],m={};it.forEach(([i,n])=>{if(stk&&m[i.id]!=null)gp[m[i.id]].c++;else{m[i.id]=gp.length;gp.push({i,n,c:1})}});
h+=`<div class=band style="color:${RC[r]}"><span>${RN[r]}</span></div><div class=row2>`+gp.map(x=>sl(x.i,x.c,`${drp?'dr':'eq'}(${x.n})`)).join('')+'</div>'}
return h+(S.pouch.length?'':'<p class=sub>Empty - kill mobs & raid villages!</p>')+'<br><button class=red onclick="reset()">Reset progress (change class)</button>'}
const shopH=()=>'<div class=ttl>Shop</div><p class=sub>🪙 '+S.coins+'</p><div class=band><span>Buy</span></div><div class=row2>'+shopCur.stock.map(i=>{const c=((i.r+1)*50+(I[i.id].v>1?I[i.id].v*3:60))*Math.pow(2.5,i.r)|0;return ib(i,`<button onclick="buy('${i.id}',${i.r},${c})">Buy ${c}🪙</button>`)}).join('')+'</div><div class=band><span>Sell</span></div><div class=row2>'+S.pouch.map((i,n)=>ib(i,`<button onclick="sell(${n})">Sell ${15*Math.pow(2.5,i.r)|0}🪙</button>`)).join('')+'</div>';
function openM(t,sh){const mb=$('mbx'),sc=mb.scrollTop,sx=mb.scrollLeft,ch=$('mbody').dataset.t!=t||$('menu').classList.contains('hide');paused=1;shopCur=sh||shopCur;$('menu').className='ov '+{Pouch:'inv',Craft:'craft',Skills:'tal',Shop:'shop'}[t];$('tabs').innerHTML='<button id=xb onclick="closeM()">✕</button>';
$('mbody').innerHTML={Skills:talH,Craft:craftH,Pouch:invH,Shop:shopH}[t]();$('mbody').dataset.t=t;mb.scrollTop=ch?(t=='Skills'?420:0):sc;mb.scrollLeft=ch?0:sx}
const re=()=>openM($('mbody').dataset.t);
const tn=id=>{const n=TN.find(t=>t.id==id);if(!n||S.tn.includes(id)||!(n.par=='root'||S.tn.includes(n.par))||S.sp<n.cost)return;S.sp-=n.cost;S.tn.push(id);S.sk[n.b]++;re()},
trs=()=>{S.tn.forEach(id=>S.sp+=TN.find(t=>t.id==id).cost);S.tn=[];for(const k in S.sk)S.sk[k]=0;re()},
uneq=k=>{S.pouch.push(S.eq[k]);S.eq[k]=null;re()},eq=n=>{const i=S.pouch.splice(n,1)[0],t=I[i.id].t;if(S.eq[t])S.pouch.push(S.eq[t]);S.eq[t]=i;re()},dr=n=>{const i=S.pouch.splice(n,1)[0];pk.push({x:P.x+60,y:P.y,i});re()},
buy=(id,r,c)=>{if(S.coins>=c){S.coins-=c;S.pouch.push({id,r})}re()},sell=n=>{const i=S.pouch.splice(n,1)[0];S.coins+=15*Math.pow(2.5,i.r)|0;re()},
comb=(id,r)=>{r=+r;let n=0;S.pouch=S.pouch.filter(i=>i.id==id&&i.r==r&&n<5?(n++,0):1);if(n<5)return re();if(Math.random()<CH[r]){S.pouch.push({id,r:r+1});msg('Craft success! '+RN[r+1]+' '+I[id].n,RC[r+1]);cs=null}else{const back=1+Math.random()*4|0;for(let i=0;i<5-back;i++)S.pouch.push({id,r});msg('Craft failed - lost '+back,'#f66')}re()},
reset=()=>{if(confirm('This deletes ALL progress for this account. Continue?')){S=null;U[me].s=null;sv();closeM();paused=1;stage(2)}};
// title screen
$('cb').innerHTML=Object.keys(C).map(k=>`<button class=cb data-k=${k} style="background:${C[k].col};border-color:${dk(C[k].col)}" onclick="clsInfo('${k}')">${k}</button>`).join('');
const tc=$('tc'),tg=tc.getContext('2d'),fs=Array.from({length:28},()=>({x:Math.random(),y:Math.random(),v:rnd(.5,1.5),a:rnd(0,6),k:Math.random()*2|0,c:pick(RC),z:rnd(7,20)}));
function tl(){if($('title').offsetParent){const W=tc.width=innerWidth,H=tc.height=innerHeight;tg.fillStyle='#1ea761';tg.fillRect(0,0,W,H);tg.fillStyle='#1b9a57';for(let b=0;b<4;b++){const y=x=>H*(.02+b*.27)+Math.sin(x/170+b*2)*45;tg.beginPath();for(let x=0;x<=W;x+=20)tg[x?'lineTo':'moveTo'](x,y(x));for(let x=W;x>=0;x-=20)tg.lineTo(x,y(x)+H*.13);tg.fill()}
for(const f of fs){f.x=(f.x+Math.cos(f.a)*f.v/W+1)%1;f.y=(f.y+Math.sin(f.a)*f.v/H+1)%1;if(f.k)poly(tg,'#eee',f.z,1,0,-.7,.7,-.7,-.7);else orb(tg,f.x*W,f.y*H,f.z,f.c)}}requestAnimationFrame(tl)}
if(localStorage.rl_s&&U[localStorage.rl_s]){me=localStorage.rl_s;S=U[me].s}setBub();stage(me?(S?3:2):1);tl();
