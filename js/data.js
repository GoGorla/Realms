// ===== Hollowmark game data. Edit numbers here to rebalance. =====
const RARITY=['Common','Unusual','Rare','Epic','Legendary','Mythic','Ultra','Super','Eternal'];
// Common green, Unusual yellow, Rare indigo, Epic purple, Legendary red, Mythic cyan, Ultra pink, Super orange, Eternal white
const RCOLOR=['#4ccf5a','#f2d23a','#6c6cff','#b05cf0','#e8453c','#35d6e0','#ff7ac8','#ff9a2a','#ffffff'];
const RDARK=RCOLOR.map(c=>{const n=parseInt(c.slice(1),16);return '#'+[16,8,0].map(s=>Math.round(((n>>s)&255)*.35).toString(16).padStart(2,'0')).join('')});
// drop rarity: how many times rarer each step is (1x = most common at the current wave band)
const RSPAWN=[1,3.75,13.5,54,324,3159,145800,4374000,26244000];
const CRAFT=[64,32,16,8,4,2,1,0.1]; // % chance to upgrade FROM rarity index
const rmult=r=>Math.pow(1.7,r);

const MLABEL={weapon:'Weapon Strength',health:'Health',elem:'Elemental Strength',luck:'Luck',regen:'Health Regen',phys:'Physical Strength',speed:'Speed',range:'Range Strength',splash:'Splash Strength',dodge:'Dodge'};
// i = position in assets/classes.png (each sprite 100px wide)
const CLASSES={
 knight:{name:'Knight',i:0,color:'#aab4c0',m:{weapon:2,health:1.25}},
 sorcerer:{name:'Sorcerer',i:1,color:'#a070ff',m:{elem:3,health:.5,luck:1.5}},
 orc:{name:'Orc',i:2,color:'#4fb55f',m:{weapon:3,health:.75,regen:1.5}},
 druid:{name:'Druid',i:3,color:'#e68a9c',m:{health:.25,regen:2,speed:5}},
 rogue:{name:'Rogue',i:4,color:'#e8e8e8',m:{speed:3,luck:3,health:.5,weapon:.75,elem:.75,phys:.75,range:.75,splash:.75}},
 barbarian:{name:'Barbarian',i:5,color:'#d9985f',m:{health:.5,regen:.5,phys:2,weapon:2,speed:2}},
 ranger:{name:'Ranger',i:6,color:'#8bc34a',m:{speed:5,range:2,health:.5}},
 warlock:{name:'Warlock',i:7,color:'#d04fd0',m:{weapon:5,elem:5,phys:5,range:5,splash:5,regen:.5,luck:.5,speed:.75}},
 assassin:{name:'Assassin',i:8,color:'#9a9ab0',m:{speed:5,dodge:5,range:5,regen:0,health:.25}},
 alchemist:{name:'Alchemist',i:9,color:'#3fd0c0',m:{splash:5,regen:3,health:.5,speed:.5}},
 necromancer:{name:'Necromancer',i:10,color:'#7affb0',m:{health:.5},special:'Summons up to 3 mobs from past waves (0.5x health) to fight for you'}

};

const SKILLS=[
 {id:'basedmg',cat:'Fight',name:'Base damage',desc:'+2 flat damage per level on top of the starting 10.'},
 {id:'speed',cat:'Fight',name:'Speed',desc:'+5% attack speed per level.'},
 {id:'mind',cat:'Fight',name:'Mind',desc:'+8% damage with elemental weapons and spells per level.'},
 {id:'swing',cat:'Fight',name:'Swing',desc:'+8% damage with normal weapons per level.'},
 {id:'tactics',cat:'Fight',name:'Battle tactics',desc:'+0.1x critical damage per level.'},
 {id:'resist',cat:'Health',name:'Resistance',desc:'Each level removes 0.5 damage from every hit you take.'},
 {id:'tough',cat:'Health',name:'Toughness',desc:'+0.3 health regeneration per second per level.'},
 {id:'basehp',cat:'Health',name:'Base health',desc:'+10 max health per level.'},
 {id:'dodge',cat:'Health',name:'Dodge',desc:'Starts at 1/25 chance. +1% per level.'},
 {id:'focus',cat:'Knowledge',name:'Focus',desc:'+10% training speed for every other skill per level.'},
 {id:'productivity',cat:'Knowledge',name:'Productivity',desc:'+10% faster farming per level.'},
 {id:'craft',cat:'Knowledge',name:'Craft sense',desc:'+1% crafting chance per level.'},
 {id:'bargain',cat:'Knowledge',name:'Bargaining',desc:'-2% shop prices and +1% sell value per level.'},
 {id:'shopfame',cat:'Knowledge',name:'Shop fame',desc:'Better rarities in shops, and +1 item every 4 levels.'},
 {id:'looting',cat:'Knowledge',name:'Looting',desc:'Better and more drops, +2% drop chance per level.'},
 {id:'luck',cat:'Knowledge',name:'Luck',desc:'+4% luck (better loot rarity) per level.'}
];

const ITEMS={};
const add=(id,o)=>ITEMS[id]=Object.assign({id},o);
add('club',{name:'Club',slot:'weapon',kind:'phys',dmg:6,price:20});
add('iron_sword',{name:'Iron Sword',slot:'weapon',kind:'phys',dmg:14,price:60});
add('spiked_stick',{name:'Spiked Stick',slot:'weapon',kind:'phys',dmg:10,price:40});
add('wand',{name:'Wand',slot:'weapon',kind:'elem',dmg:12,price:70});
add('spell_script',{name:'Spell Script',slot:'weapon',kind:'elem',dmg:22,price:150,only:'sorcerer'});
add('bow',{name:'Bow',slot:'weapon',kind:'range',dmg:12,price:70});
add('flask',{name:'Alchemist Flask',slot:'weapon',kind:'splash',dmg:12,price:70});
const TIERS=[['cloth',4,15],['iron',10,45],['steel',18,110],['obsidian',32,260]];
const SLOTS=[['helmet','Helmet',1],['chest','Chest Plate',1.8],['gloves','Gloves',0],['legs','Leggings',1.4],['boots','Boots',.8]];
TIERS.forEach(([t,hp,pr],ti)=>SLOTS.forEach(([s,n,k])=>add(t+'_'+s,{name:t[0].toUpperCase()+t.slice(1)+' '+n,slot:s,hp:Math.round(hp*k),spd:s==='gloves'?.04*(ti+1):0,price:Math.round(pr*(k||1))})));
add('potion',{name:'Health Potion',slot:'potion',heal:40,price:25});
add('relic_dmg',{name:'Damage Relic',slot:'relic',type:'dmg',price:300});
add('relic_hp',{name:'Health Relic',slot:'relic',type:'hp',price:300});
add('goblin_lord_ear',{name:"Goblin Lord's Ear",slot:'relic',type:'regen',price:500,boss:true});
add('backpack',{name:'Backpack',slot:'pack',slots:10,price:200});
// materials: remains + farm goods
const MATS={zombie_flesh:['Zombie Flesh',4],bone:['Bone',3],witch_brew:['Witch Brew',8],spider_silk:['Spider Silk',4],goblin_ear:['Goblin Ear',5],slime_goo:['Slime Goo',3],bandit_mask:['Bandit Mask',7],ghoul_claw:['Ghoul Claw',10],wraith_dust:['Wraith Dust',12],troll_tooth:['Troll Tooth',18],guard_badge:['Guard Badge',6],food:['Food',2],stone:['Stone',3],wood:['Wood',2]};
Object.entries(MATS).forEach(([id,[n,p]])=>add(id,{name:n,price:p,mat:true}));
const FARM=['food','stone','wood'];

const EQSLOTS=[['weapon','Weapon'],['helmet','Helmet'],['chest','Chest'],['gloves','Gloves'],['legs','Legs'],['boots','Boots'],['relic1','Relic 1'],['relic2','Relic 2'],['relic3','Relic 3'],['pack','Backpack']];

const MOBS={
 zombie:{name:'Zombie',hp:30,dmg:4,gold:3,remain:'zombie_flesh'},skeleton:{name:'Skeleton',hp:25,dmg:5,gold:3,remain:'bone'},
 witch:{name:'Witch',hp:35,dmg:6,gold:5,remain:'witch_brew'},spider:{name:'Spider',hp:20,dmg:5,gold:3,remain:'spider_silk'},
 goblin:{name:'Goblin',hp:28,dmg:5,gold:4,remain:'goblin_ear'},slime:{name:'Slime',hp:40,dmg:3,gold:3,remain:'slime_goo'},
 bandit:{name:'Bandit',hp:40,dmg:7,gold:6,remain:'bandit_mask'},ghoul:{name:'Ghoul',hp:60,dmg:9,gold:8,remain:'ghoul_claw'},
 wraith:{name:'Wraith',hp:55,dmg:11,gold:10,remain:'wraith_dust'},troll:{name:'Troll',hp:120,dmg:12,gold:15,remain:'troll_tooth'},
 guard:{name:'Village Guard',hp:45,dmg:6,gold:7,remain:'guard_badge'}
};
const STRUCTS=[
 {kind:'mob',name:'Graveyard',mobs:['zombie','skeleton','ghoul']},
 {kind:'mob',name:'Witch Hut',mobs:['witch','spider','slime']},
 {kind:'mob',name:'Goblin Camp',mobs:['goblin','bandit','troll']},
 {kind:'mob',name:'Haunted Crypt',mobs:['skeleton','wraith','ghoul']},
 {kind:'mob',name:'Murky Swamp',mobs:['slime','witch','zombie']},
 {kind:'explore',name:'Abandoned Mine',mobs:['spider','goblin','slime']},
 {kind:'explore',name:'Ruined Tower',mobs:['skeleton','wraith','bandit']},
 {kind:'explore',name:'Sunken Temple',mobs:['zombie','ghoul','witch']},
 {kind:'explore',name:'Forgotten Cabin',mobs:['bandit','spider','zombie']},
 {kind:'raid',name:'Farming Village',mobs:['guard','bandit']},
 {kind:'raid',name:'Mining Hamlet',mobs:['guard','goblin']},
 {kind:'raid',name:'Riverside Port',mobs:['guard','bandit','goblin']}
];
const HOUSES=['Hut','Small House','Cabin','Family House','Manor','Mansion','Estate','Villa','Castle','Keep','Citadel','Palace','Sky Fortress','Dragon Spire','Eternal Throne'];
const houseCost=i=>Math.round(150*Math.pow(2.6,i-1));
const NPCS=['Old Marta','Brother Hale','Tinker Wix','Captain Rusk','Widow Sable','Young Pip','Alchemist Orrin'];

// ----- v3 additions -----
const START={sorcerer:'wand',warlock:'wand',ranger:'bow',assassin:'bow',alchemist:'flask'};
// worst to best: upgrade base time runs from 10s (worst) to 25s (best)
const SKILLRANK=['bargain','productivity','craft','shopfame','tactics','tough','resist','luck','mind','swing','speed','dodge','looting','focus','basedmg','basehp'];
SKILLS.forEach(s=>{s.rank=SKILLRANK.indexOf(s.id);s.base=10+15*s.rank/(SKILLRANK.length-1)});
const BOSS={name:'Goblin Lord',hp:1500,dmg:35,iv:2000,gold:250,drop:'goblin_lord_ear',chance:.4}; // 50x a normal mob (30 hp, 5 dmg)
const TOWNS=[
 {id:'hearth',name:'Hearthrest',skill:'basehp',trainer:'Mother Bramble'},
 {id:'clover',name:'Clover Crossing',skill:'luck',trainer:'Lucky Finn'},
 {id:'anvil',name:'Anvilgate',skill:'basedmg',trainer:'Smith Brannoc'},
 {id:'swift',name:'Swiftwater',skill:'speed',trainer:'Courier Zephyr'},
 {id:'shade',name:'Willowshade',skill:'dodge',trainer:'Shade Ilya'},
 {id:'quiet',name:'Quietpine Monastery',skill:'focus',trainer:'Abbot Seren'},
 {id:'magpie',name:'Magpie Hollow',skill:'looting',trainer:'Scrounger Dov'},
 {id:'haggle',name:'Haggle Harbor',skill:'bargain',trainer:'Dockmaster Pell'}
];
const SCEN=[
 {t:'The hallway forks in two directions.',o:[['Take a different hallway',{mobs:1,loot:1.3}],['Keep going straight',{}]]},
 {t:'You spot a cave mouth in the wall.',o:[['Enter the cave',{mobs:1,loot:1.5}],['Walk past it',{}]]},
 {t:'Two routes lie ahead.',o:[['Take the safe path',{mobs:-1,loot:.8}],['Enter the dangerous path',{mobs:2,loot:2}]]},
 {t:'A glowing shrine hums nearby.',o:[['Rest at the shrine',{heal:.3}],['Ignore it and move on',{}]]},
 {t:'The way ahead is dark and narrow.',o:[['Light a torch and press on',{loot:1.2}],['Take the wide road',{mobs:-1,loot:.9}]]}
];
