/* Twenty authored spaces built from local geometry; shared by all three views. */
'use strict';
(() => {
  const S = window.SW, K = S.WorldKit, PI = Math.PI;
  const rooms = new Map();
  const theme = {
    metro: { wall:'#9e9c87',tile:'#685e48',floor:'#626160',accent:'#dfb779',fog:[.037,.032,.022] },
    orphan: { wall:'#a8979a',tile:'#705b6b',floor:'#796458',accent:'#d8aec1',fog:[.042,.028,.040] },
    abyss: { wall:'#799aa2',tile:'#3c6470',floor:'#526d77',accent:'#83cce1',fog:[.014,.033,.051] },
    astro: { wall:'#9695ad',tile:'#56576c',floor:'#656176',accent:'#b9afe9',fog:[.025,.023,.049] }
  };
  // Reuse deterministic material textures across authored rooms, reducing GPU/CPU memory.
  const surface = S.surface, textureCache = new Map();
  S.surface = (...args) => { const key = JSON.stringify(args); if (!textureCache.has(key)) textureCache.set(key,surface(...args)); return textureCache.get(key); };
  const blocked = (b,x,z,w,d,name,kind='cabinet') => { b.colliders.push({x,z,w,d}); b.prop(x,z,w,d,name,kind); };
  function bench(b,x,z,w=3,rot=0){const c=Math.cos(rot),s=Math.sin(rot),box=(xx,y,zz,ww,h,d,mat)=>b.box(x+xx*c+zz*s,y,z-xx*s+zz*c,ww,h,d,mat,rot);box(0,.52,0,w,.13,.65,'fabric');box(0,.98,-.28,w,.85,.075,'metal');for(const xx of [-w/2+.16,w/2-.16])for(const zz of [-.22,.22])box(xx,.24,zz,.05,.48,.05,'darkMetal');b.colliders.push({x,z,w:Math.abs(w*c)+Math.abs(.72*s),d:Math.abs(.72*c)+Math.abs(w*s)});b.prop(x,z,w,.72,'长椅','bench',rot);}
  function screen(b,id,label,x,z,w=1.1){b.box(x,1.24,z,w+0.2,1.8,.6,'darkMetal',0,true);K.sign(b,id,label,x,1.66,z+.315,w,.55,0,{bg:'#101b21',fg:b.accent,glow:true,small:'LOCAL TERMINAL',size:44});for(let k=0;k<4;k++)b.box(x-.3+k*.2,1.1,z+.34,.12,.06,.04,'ivory');b.prop(x,z,w+.2,.6,label,'generator');}
  function pipe(b,x,z,len=5){ b.tube([x,2.8,z-len/2],[x,2.8,z+len/2],.13,'rust');for(let q=-len/2;q<=len/2;q+=1.5)b.box(x,2.8,z+q,.34,.36,.13,'metal'); }
  function tank(b,x,z,r=.85,h=2.65,glass=false){b.cylinder(x,h/2,z,r,r,h,glass?'glass':'metal',24);b.cylinder(x,.12,z,r+.12,r+.12,.24,'darkMetal');b.cylinder(x,h-.10,z,r+.08,r+.08,.2,'darkMetal');if(glass){b.sphere(x,1.5,z,.24,.64,.24,'lamp',12,8);b.tube([x,h,z],[x,3.5,z],.03,'metal');}blocked(b,x,z,(r+.12)*2,(r+.12)*2,glass?'培养罐':'储压罐','tank');}
  function windowPane(b,x,z,w=2.3,h=1.5,rot=0){const co=Math.cos(rot),si=Math.sin(rot),box=(xx,y,zz,ww,hh,d,mat)=>b.box(x+xx*co+zz*si,y,z-xx*si+zz*co,ww,hh,d,mat,rot);box(0,2.22,0,w,h,.12,'darkMetal');box(0,2.22,.08,w-.15,h-.15,.02,'night');box(0,2.22,.10,.035,h,.03,'metal');box(0,2.22,.1,w,.035,.03,'metal');for(let i=0;i<5;i++)box(-w*.42+i*w*.2,2.21,.115,.008,h*.85,.01,'glass');}
  function wheel(b,x,y,z,r=.75,mat='brass'){for(let i=0;i<32;i++){let a=i*PI/16,c=(i+1)*PI/16;b.tube([x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(c)*r,y+Math.sin(c)*r,z],.04,mat,6);}for(let a=0;a<PI*2;a+=PI/4)b.tube([x,y,z],[x+Math.cos(a)*r,y+Math.sin(a)*r,z],.025,mat,6);}
  function puppet(b,x,z,scale=.8){b.sphere(x,1.7*scale,z,.17*scale,.2*scale,.15*scale,'ivory',12,8);b.cylinder(x,1.23*scale,z,.21*scale,.1*scale,.68*scale,'velvet',12);b.tube([x-.12*scale,1.5*scale,z],[x-.37*scale,.9*scale,z],.045*scale,'wood');b.tube([x+.12*scale,1.5*scale,z],[x+.37*scale,.9*scale,z],.045*scale,'wood');b.tube([x,1.85*scale,z],[x,3.4,z],.005,'metal',5);}
  function rails(b,x,z,d){for(const dx of [-.65,.65]) b.box(x+dx,.065,z,.1,.12,d,'metal');for(let q=-d/2;q<=d/2;q+=.72)b.box(x,.035,z+q,1.75,.06,.15,'wood');b.prop(x,z,1.7,d,'轨道','track');}
  function starWall(b,z,w){const rng=S.rng(3907);for(let i=0;i<65;i++){const x=(rng()-.5)*(w-1),y=1.55+rng()*1.85;b.sphere(x,y,z,.008+rng()*.014,.01,.01,'lamp',6,4);}}
  function telescope(b,x,z){b.cylinder(x,.6,z,.8,.4,1.2,'metal',20);b.tube([x-.6,1.65,z+1.1],[x+.55,2.5,z-1.1],.34,'metal',24);b.tube([x+.55,2.5,z-1.1],[x+.64,2.57,z-1.28],.39,'darkMetal',24);b.sphere(x,1.6,z,.38,.38,.38,'brass',14,8);blocked(b,x,z,2.4,3,'折射望远镜','telescope');}
  function decorate(b,r,c){
    const w=r.w,d=r.d,L=-w/2+1.3,R=w/2-1.3,F=-d/2+1.3;
    switch(r.kind){
      case 'concourse':
        for(const x of [-3,-1,1,3]) {b.box(x,.65,1, .5,1.3,2,'metal',0,true);b.box(x,1.33,1,.3,.06,.45,'lamp');b.prop(x,1,.5,2,'检票闸机','gate');}
        screen(b,'ticket1','售票 / VOID',L+1,-3);screen(b,'ticket2','已售出',R-1,-3);K.sign(b,'lineBoard',['零 号 线','下一班：已到站'],0,2.6,F+.05,5,1,0,{bg:'#232523',fg:'#e2bf80',small:'NO TERMINUS',size:43});
        for(const x of [L,R]){b.box(x,1.8,3,.4,3.6,.5,'tile',0,true);bench(b,x,5,2.2,PI/2);}
        break;
      case 'platform':
        rails(b,L+.1,0,d-3);b.box(L+1.3,.04,0,.12,.03,d-2,'brass');for(const z of [-7,0,7]){b.box(R,1.8,z,.44,3.6,.44,'metal',0,true);bench(b,R-.45,z+1,2,PI/2);K.sign(b,'platform'+z,'0',R,2.7,z+.25,.6,.6,0,{glow:true,fg:'#e3c689',size:80});}
        for(const z of [-9,-3,3,9])K.ceilingLight(b,1,z,2.8,false);
        break;
      case 'carriage':
        for(const z of [-7,-3,1,5,9]){windowPane(b,-w/2+.17,z,2.2,1.25,PI/2);windowPane(b,w/2-.17,z,2.2,1.25,-PI/2);}
        for(const z of [-7.5,-3.5,.5,4.5,8.5]){for(const x of [L,R]){bench(b,x,z,1.8,PI/2);b.tube([x*.76,.15,z],[x*.76,3.4,z],.028,'metal');}b.tube([L,3.25,z],[R,3.25,z],.028,'metal');}
        for(const x of [-1,1])for(const z of [-5,0,5]){wheel(b,x,2.77,z,.13,'ivory');b.tube([x,2.9,z],[x,3.3,z],.015,'fabric');}break;
      case 'signal':
        for(const x of [L+.4,R-.4])for(const z of [-4,1,6])screen(b,`rack${x}${z}`,'信号丢失',x,z,1.35);
        b.box(0,2.6,F,4,.9,.12,'black');K.sign(b,'trackboard',['89.6 / ECHO','← 00 — 07 — 11 →'],0,2.6,F+.08,3.9,.85,0,{bg:'#172625',fg:'#bcce9b',glow:true,size:39,small:'DISPATCH NETWORK'});break;
      case 'tunnel':
        rails(b,0,0,d-2);for(const z of [-10,-6,-2,2,6,10]){for(const x of [L-.4,R+.4]) b.box(x,1.7,z,.22,3.4,.3,'rust');b.box(0,3.3,z,w-.8,.22,.3,'rust');}
        pipe(b,L+.2,0,d-2);pipe(b,R-.2,0,d-2);for(const z of [-8,0,8])K.wallLamp(b,R,z);break;
      case 'foyer':
        for(const x of [L,R]){K.counter(b,x,0,1.6,3.5);b.box(x,2.4,0,.3,2.3,.3,'wood');}K.sign(b,'welcome',['欢 迎 回 家','请叫我的名字'],0,2.75,F+.1,3.3,.75,0,{bg:'#57464d',fg:'#ddc2c7',size:45,small:'NO CHILD LEFT UNNAMED'});windowPane(b,L,F,2);windowPane(b,R,F,2);puppet(b,-2.1,4,.8);break;
      case 'classroom':
        for(const x of [-4.2,4.2])for(const z of [-3,1,5]){K.table(b,x,z,1.5,.9);K.chair(b,x,z+1);}
        K.sign(b,'blackboard',['1   2   4   8   16','记住你的名字'],0,2.5,F,5,1.25,0,{bg:'#25372e',fg:'#b9c9b3',size:47,small:'ATTENDANCE: 0 / 6'});break;
      case 'dormitory':
        for(const x of [L+.45,R-.45])for(const z of [-5,0,5])K.bed(b,x,z);
        windowPane(b,0,F,3.8,1.85);for(const x of [-2.5,2.5])puppet(b,x,-7,.7);break;
      case 'theatre':
        b.box(0,.14,-d*.25,w-3,.28,3.1,'wood',0,false);for(const x of [L,R]){b.box(x,1.6,-d*.25,1.3,3.2,2.8,'velvet',0,true);for(let q=0;q<5;q++)b.cylinder(x-.5+q*.24,1.6,-d*.25+.9,.15,.15,3,'velvet',10);}b.box(0,3.2,-d*.25,w-2,.5,.4,'velvet');for(const x of [-2,0,2])puppet(b,x,-d*.25,1);for(const x of [-5,5])for(const z of [1,4,7])K.chair(b,x,z);break;
      case 'belltower':
        for(const x of [L,R]){b.box(x,1.7,0,.32,3.4,d-2,'wood');for(const z of [-5,0,5])b.box(x,1.7,z,.4,3.4,.4,'wood');}b.cylinder(0,2.6,-2,.95,.44,1.15,'brass',32);b.sphere(0,2.04,-2,.13,.18,.13,'darkMetal');b.tube([0,2.15,-2],[0,.3,-2],.018,'fabric');b.prop(0,-2,1.9,1.9,'铜钟','bell');K.clock(b,0,2.6,F);break;
      case 'airlock':
        for(const x of [L,R]){tank(b,x,-1,.7);pipe(b,x,1,11);}for(const z of [-6,1,6]){b.box(0,3.3,z,w-1,.18,.3,'metal');}wheel(b,0,1.6,F,.9);break;
      case 'pump':
        for(const x of [L+.3,R-.3])for(const z of [-4,3]){tank(b,x,z,.95);pipe(b,x,z,6);}for(const x of [-2.7,2.7])b.tube([x,.25,-5],[x,.25,6],.18,'rust');K.sign(b,'pressureSign','3 / 4 / 0',0,2.6,F,3,.6,0,{glow:true,bg:'#163039',fg:'#b4e1df',size:65});break;
      case 'biolab':
        for(const x of [L+.25,R-.25])for(const z of [-5,0,5])tank(b,x,z,.8,2.8,true);
        for(const x of [-3,3]){K.table(b,x,2,1.5,.8);for(let k=0;k<3;k++)b.cylinder(x-.4+k*.4,1.12,2,.07,.07,.44,'glass',12);}break;
      case 'sonar':
        for(const x of [L,R])for(const z of [-4,2,7])screen(b,`sonar${x}${z}`,'·  ·  ·  ECHO',x,z,1.2);for(let r=.45;r<2.1;r+=.45)wheel(b,0,1.9,F,r,'lamp');break;
      case 'capsule':
        for(const x of [L+.2,R-.2])for(const z of [-5,-1,3,7])bench(b,x,z,1.4,PI/2);
        for(const z of [-7,0,7]){b.tube([L,3.1,z],[R,3.1,z],.12,'metal');}K.sign(b,'surface','SURFACE / ↑',0,2.9,F,2.5,.5,0,{glow:true,bg:'#204048',fg:'#b4e5e0',size:49});break;
      case 'cable':
        rails(b,L+1,0,d-3);b.box(L+1,1.25,1,2.1,2.5,4,'darkMetal',0,true);b.box(L+1,1.7,3.05,1.8,1.15,.03,'night');b.box(L+1,2.6,1,2.2,.18,4.2,'metal');for(const x of [-.75,.75])b.tube([x,3.3,-d/2],[x,3.3,d/2],.05,'metal');for(const z of [-4,3,7])bench(b,R-.5,z,2);starWall(b,F-.8,w);break;
      case 'gallery':
        for(const x of [L,R])for(const z of [-4,2,7]){b.cylinder(x,.5,z,.55,.55,1,'metal');b.sphere(x,1.4,z,.65,.65,.65,'night',20,12);for(let q=0;q<3;q++)wheel(b,x,1.4,z+.62,.64-q*.13,'brass');blocked(b,x,z,1.4,1.4,'星球仪','orb');}starWall(b,F-.6,w);break;
      case 'clockhall':
        for(const x of [L,R])for(const z of [-5,0,5]){b.box(x,1.1,z,1.2,2.2,.7,'wood',0,true);K.clock(b,x,1.7,z+.39);b.tube([x,1.2,z+.4],[x,.35,z+.4],.017,'brass');b.sphere(x,.3,z+.4,.17,.17,.05,'brass');b.prop(x,z,1.2,.8,'摆钟','clock');}for(const x of [-1.7,0,1.7])wheel(b,x,2.7,F,.6,'brass');break;
      case 'dome':
        telescope(b,-3,0);telescope(b,3,-3);starWall(b,F-.7,w);for(let a=0;a<PI*2;a+=PI/6){const x=Math.cos(a)*(w/2-.5),z=Math.sin(a)*(d/2-.5);b.tube([x,.1,z],[x*.7,3.5,z*.7],.07,'metal');}for(let a=0;a<PI*2;a+=PI/18){let n=a+PI/18;b.tube([Math.cos(a)*6,3.48,Math.sin(a)*7],[Math.cos(n)*6,3.48,Math.sin(n)*7],.06,'brass');}break;
      case 'transmitter':
        for(const x of [L,R])for(const z of [-7,-2,3,8]){screen(b,`trans${x}${z}`,'RELAY / 0117',x,z,1.25);b.tube([x,2.4,z],[x,3.5,z],.035,'metal');}for(const x of [-1.3,0,1.3]){b.box(x,2.3,F,.05,1.7,.1,'lamp');}K.sign(b,'dawn','E B X O',0,2.65,F+.12,3.6,.75,0,{bg:'#232039',fg:'#d8c6ef',glow:true,small:'REVOCATION / A → B',size:68});break;
    }
  }
  function make(r,c){
    const b=K.makeBase(r.id),w=r.w,d=r.d,F=-d/2+1.3;
    b.material('brass','#b9a472',{roughness:.32});b.material('velvet',c.id==='orphan'?'#603c4c':'#33444e',{texture:S.surface('fabric','#715368',311)});b.material('night',c.id==='abyss'?'#102b3f':'#14172d',{emissive:.35,mode:1});
    for(let k=1;k<=4;k++)b.material('book'+k,['#847461','#767b69','#575f71','#8d8276'][k-1]);
    b.spawn=[0,1.65,d/2-2.3];b.preview=[w*.065,2.0,d*.33];b.look=[0,1.4,-d*.27];b.exposure=c.id==='orphan'?1.25:c.id==='abyss'?1.32:1.35;b.fogDensity=c.id==='abyss'?.025:.018;
    b.lights[0]={pos:[0,3.18,-d*.19],color:S.rgb(c.color),intensity:4.8};b.lights[1]={pos:[-w*.32,2.8,d*.15],color:S.rgb(c.color),intensity:2.1};b.lights[2]={pos:[w*.32,2.7,-d*.35],color:S.rgb(c.id==='abyss'?'#628ade':'#dcba8c'),intensity:2.5};b.lights[3]={pos:[0,2.4,F],color:S.rgb(c.color),intensity:1.8};
    K.ceilingLight(b,0,3,2.4,false);K.ceilingLight(b,0,-4,2.4,false);
    if(c.id==='orphan')b.materials.floor.texture=S.surface('wood','#63504e',501);
    if(c.id==='abyss')b.materials.floor.texture=S.surface('metal','#456475',507);
    if(r.kind==='dome'){
      delete b.batches.ceiling;b.material('sky','#080c21',{alpha:.999,mode:1});b.sphere(0,2,0,14,8,15,'sky',36,20);
      const rng=S.rng(764);for(let i=0;i<110;i++){const a=rng()*PI*2,e=.25+rng()*1.25;const x=Math.cos(a)*Math.cos(e)*12,z=Math.sin(a)*Math.cos(e)*13,y=2+Math.sin(e)*7;b.sphere(x,y,z,.018,.018,.018,'lamp',6,4);}
      for(const a of [0,PI/4,PI/2,PI*3/4])for(let t=0;t<PI;t+=PI/20){let u=t+PI/20;b.tube([Math.cos(t)*9*Math.cos(a),3.4+Math.sin(t)*4,Math.cos(t)*9*Math.sin(a)],[Math.cos(u)*9*Math.cos(a),3.4+Math.sin(u)*4,Math.cos(u)*9*Math.sin(a)],.05,'metal');}
    }
    decorate(b,r,c);
    const p=r.puzzle;
    // Dedicated interaction panels remain on reachable faces, away from furniture collision volumes.
    const positions=[[-w*.29,1.8,F+.2],[w*.29,1.8,F+.2],[w*.22,1.42,-d*.22],[-w*.27,1.35,-d*.14]];
    r.clues.forEach((n,i)=>{const [x,y,z]=positions[i];K.sign(b,'clue'+i,n[0],x,y,z,1.2,.76,0,{paper:true,bg:c.id==='abyss'?'#99b6b8':'#beb39d',fg:'#273d3b',small:'READ / ARCHIVE',size:42});b.hotspot(p.id+'_clue'+i,n[0],[x,y,z+.13]);});
    const [px,py,pz]=positions[2];K.table(b,px,pz,1.5,.65);b.box(px,1.23,pz,.95,.7,.18,'darkMetal');K.sign(b,'mechanism',p.title,px,1.39,pz+.12,.88,.43,0,{bg:'#1b252d',fg:c.color,glow:true,small:'INTERLOCK / 0'+(r.index+1),size:37});b.hotspot(p.id,p.title,[px,py,pz+.55]);
    if(r.evidence){const [x,y,z]=positions[3];K.table(b,x,z,1.3,.8);K.phone(b,x,1.01,z);K.sign(b,'evidence',r.evidence[0],x,1.45,z+.16,.7,.5,0,{paper:true,bg:'#beb6a2',fg:'#484254',small:'VOICE RECORD',size:34});b.hotspot(p.id+'_evidence',r.evidence[0],[x,y,z+.59]);}
    if(r.index===4){K.door(b,0,-d/2+.35,0,'撤 离 通 道','EXTRACTION');b.hotspot(p.id+'_exit','本章撤离门',[0,1.6,-d/2+.76]);}
    K.ghost(b,-w*.14,-d*.34);return b;
  }
  for(const c of CAMPAIGN_DATA)for(const r of c.rooms){rooms.set(r.id,{r,c});K.palettes[r.id]={...theme[c.id],w:r.w,d:r.d};S.sceneMeta[r.id]={name:r.name,en:r.en,subtitle:r.mood,short:r.puzzle.title,mood:r.mood,index:String(r.index+1).padStart(2,'0'),color:c.color,ambient:c.ambient,scare:r.scare};K.register(r.id,()=>make(r,c));}
  function fallback(id){const {r,c}=rooms.get(id);return `<svg class="scene-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 620" preserveAspectRatio="none"><defs><radialGradient id="${id}g"><stop stop-color="${c.color}" stop-opacity=".22"/><stop offset="1" stop-color="#060b13"/></radialGradient></defs><rect width="1000" height="620" fill="#0d1722"/><rect width="1000" height="620" fill="url(#${id}g)"/><path d="M0 0L200 110H800L1000 0M200 110V440L0 620M800 110V440L1000 620M200 440H800" fill="none" stroke="${c.color}" opacity=".26"/><rect x="390" y="145" width="220" height="288" fill="#0b1720" stroke="${c.color}" stroke-opacity=".22"/><text x="500" y="90" text-anchor="middle" fill="${c.color}" font-family="serif" font-size="26" letter-spacing="8">${r.name}</text><text x="500" y="490" text-anchor="middle" fill="${c.color}" font-family="monospace" font-size="14">${r.en}</text>${r.clues.map((v,i)=>`<rect x="${150+i*575}" y="220" width="125" height="150" fill="#c0bca0" opacity=".43"/>`).join('')}<path d="M550 385H800V475H550Z" fill="#233242" stroke="${c.color}" stroke-opacity=".3"/><circle cx="500" cy="307" r="75" fill="none" stroke="${c.color}" opacity=".12"/></svg>`;}
  window.CampaignArt={has:id=>rooms.has(id),scene(id){ if(window.CAMPAIGN_SHOTS?.[id]){const src=window.INLINE_SCENE_IMAGES?.[id]||`assets/${id}.webp`;const lines=window.Ward?.phase==='playing'&&Ward.state?.room===id?`<svg class="campaign-leaders" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ROOMS[id].hotspots.map(h=>{const p=CAMPAIGN_SHOTS[id].points[h[0]];return p?`<path d="M${h[2]} ${h[3]} L${p[0]} ${p[1]}"/><circle cx="${p[0]}" cy="${p[1]}" r=".45"/>`:'';}).join('')}</svg>`:'';return `<img class="campaign-scene-image" src="${src}" alt="" draggable="false">${lines}`;}return fallback(id);},rooms};
})();
