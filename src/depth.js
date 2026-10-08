/* V4 multi-stage investigation. Shared state across 3D, top-down, and investigation.
 * Each area: collect local + remotely-released fragment -> analysis -> base lock.
 * The next area supplies an audit tape: return to the old terminal to countersign.
 * The fifth countersignature uses a final tape released in the first area.
 */
'use strict';
(() => {
  const M=DepthModel, PREF='silent-ward-depth-prefs-v4';
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const preference=readLocal(PREF)||{};let selectedLevel=M.LEVELS[preference.level]?preference.level:'abyss',seedInput=M.cleanSeed(preference.seed),activeIndex=0,activeKind='analysis';
  let generated=null,generationKey='',originalInspect=inspect,originalJournal=openJournal,originalWalkthrough=walkthrough;
  const hospitalMain=['drawer','locker','safe','power','exit'],hospitalObjects=['drawer','locker','safe','circuit','gate'],hospitalNotes=['shift','symbols','rules','warning','door'];
  const bools=a=>M.range(5).map(i=>a?.[i]===true), clamp=(n,a,b)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;
  const enabled=()=>phase==='playing'&&!!state?.depth&&state.depth.level!=='classic';
  const config=()=>M.LEVELS[state?.depth?.level]||M.LEVELS.classic;
  const rooms=()=>Campaign.current().rooms;
  const baseKey=i=>state?.chapter==='hospital'?hospitalMain[i]:rooms()[i].puzzle.id;
  const baseObject=i=>state?.chapter==='hospital'?hospitalObjects[i]:rooms()[i].puzzle.id;
  const noteObject=i=>state?.chapter==='hospital'?hospitalNotes[i]:rooms()[i].puzzle.id+'_clue0';
  const baseDone=i=>!!state?.solved[baseKey(i)];
  const d=()=>state.depth, hasRecord=key=>d().read.includes(key);
  function puzzles(){const key=`${state.chapter}|${d().level}|${d().seed}`;if(key!==generationKey){generationKey=key;generated=M.range(5).map(i=>M.generate(state.chapter,i,d().level,d().seed));}return generated;}
  function freshSeed(){const a=new Uint32Array(2);try{crypto.getRandomValues(a);}catch{a[0]=Date.now()>>>0;a[1]=Math.random()*4294967296;}return a[0].toString(36).toUpperCase()+'-'+a[1].toString(36).toUpperCase();}
  function sanitizeDepth(chapter,value){
    if(!value||!['abyss','nightmare'].includes(value.level))return null;
    const seed=M.cleanSeed(value.seed)||'RESTORED-0117',out={version:1,level:value.level,seed,analysed:bools(value.analysed),audits:bools(value.audits),read:[],ui:{},auditInput:{},hints:{},hintSpent:Math.floor(clamp(value.hintSpent,0,10000)),echo:clamp(value.echo,0,100),scratch:typeof value.scratch==='string'?value.scratch.slice(0,6000):'',events:Math.floor(clamp(value.events,0,1e6))};
    out.read=[...new Set((Array.isArray(value.read)?value.read:[]).filter(k=>typeof k==='string'&&/^(l[0-4]|s[0-4]|f)$/.test(k)))];
    for(let i=0;i<5;i++){const p=M.generate(chapter,i,out.level,seed);out.ui[i]=M.sanitize(p,value.ui?.[i]);out.auditInput[i]=typeof value.auditInput?.[i]==='string'?value.auditInput[i].replace(/\D/g,'').slice(0,p.audit.length):'';}
    if(value.hints&&typeof value.hints==='object')for(const [k,n] of Object.entries(value.hints)){if(/^(local|remote|analysis|audit|main|final|exit)[0-4]?$/.test(k)&&Number.isInteger(n)&&n>=0&&n<=3)out.hints[k]=n;}
    return out;
  }
  function prepareState(s,resume){
    generationKey='';generated=null;
    if(resume){s.depth=sanitizeDepth(s.chapter||'hospital',s.depth);if(s.depth){const minutes=duration(s.depth.level,Campaign.current());s.duration=minutes*60;s.remaining=Math.min(s.remaining,s.duration);}return;}
    if(selectedLevel==='classic'){delete s.depth;s.duration=Campaign.current().minutes*60;return;}
    const seed=seedInput||freshSeed();s.depth=sanitizeDepth(s.chapter,{level:selectedLevel,seed});s.duration=duration(selectedLevel,Campaign.current())*60;s.remaining=s.duration;
  }
  function duration(level,c){return Math.ceil(c.minutes*(M.LEVELS[level]?.multiplier||1));}
  function persistPref(){writeLocal(PREF,{level:selectedLevel,seed:seedInput});}
  function refreshMenu(){
    if(!$('#depthSelect'))return;
    document.body.dataset.difficulty=selectedLevel;
    $$('#depthSelect [data-depth="level"]').forEach(b=>{b.classList.toggle('active',b.dataset.level===selectedLevel);b.setAttribute('aria-pressed',String(b.dataset.level===selectedLevel));});
    const c=Campaign.current(),cfg=M.LEVELS[selectedLevel],minutes=duration(selectedLevel,c);
    $('#depthDescription').textContent=cfg.desc;
    $('#seedEntry').hidden=selectedLevel==='classic';
    $('[data-mode="challenge"] span').textContent=`${minutes}:00 / 本章限时`;
    $('.surveillance-time').innerHTML=selectedLevel==='classic'?`23<span>:</span>${String(60-c.minutes).padStart(2,'0')}`:`${String(Math.floor((1440-minutes)/60)).padStart(2,'0')}<span>:</span>${String((1440-minutes)%60).padStart(2,'0')}`;
    $('.hero-desc strong').textContent=selectedLevel==='classic'?'5 个区域 · 5 道原机关 · 经典规则':`5 个区域 · 15 个完成节点 · 随机种子 · 跨区闭环`;
    $$('.chapter-card').forEach(b=>{const ch=Campaign.chapters.find(x=>x.id===b.dataset.chapter);b.querySelector('small').textContent=`${duration(selectedLevel,ch)} MIN · ${cfg.nodes} 节点`;const rec=Campaign.profile.records[ch.id];if(rec?.nightmareClears)b.querySelector('.chapter-status').textContent='噩梦协议已完成 ◆';else if(rec?.depthClears)b.querySelector('.chapter-status').textContent='深层闭环已完成 ◇';});
    if($('#continueBtn')&&!$('#continueBtn').hidden){const savedDepth=Campaign.profile.runs[Campaign.selected]?.depth;$('#continueBtn').textContent='继续本章 · '+(savedDepth?M.LEVELS[savedDepth.level]?.short||'经典':'经典');}
  }
  function count(){return enabled()?completed()+d().analysed.filter(Boolean).length+d().audits.filter(Boolean).length:completed();}
  function canEnter(id){if(!enabled())return true;const i=rooms().findIndex(r=>r.id===id);return i>=0&&(i===0||baseDone(i-1));}
  function locked(id){const i=rooms().findIndex(r=>r.id===id),r=rooms()[Math.max(0,i-1)];openModal('多层联锁尚未解除',`<div class="depth-lock"><span>RESTRICTED / 协议联锁</span><h3>先完成${escape(r.name)}的原机关</h3><p>高难度模式按区域逐步开放。区域开放以后可以随时返回。现场分析只是第一层，不会直接打开下一道通道。</p></div><button class="btn primary wide" data-action="go" data-room="${r.id}">返回${escape(r.name)}</button>`,'DEPTH / 无需盲目尝试');}
  function target(kind,index,title,desc){return {kind,index,key:`${kind}${index??''}`,title,desc,room:rooms()[kind==='remote'?Math.max(0,index-1):kind==='final'?0:index??4].id};}
  function nextTask(){
    if(!enabled())return null;
    for(let i=0;i<5;i++){
      if(!hasRecord('l'+i))return target('local',i,`收集${rooms()[i].name}的深层记录`,'检查场景中的文字线索，在「深层夹层」中读取现场记录。');
      if(!hasRecord('s'+i))return target('remote',i,i?`回到${rooms()[i-1].name}取校准残页`:'读取同区的校准残页',i?'刚找到的现场记录触发了上一区域的夹层。旧房间里有新的信息。':'现场记录与校准残页合起来，才是完整谜面。');
      if(i>0&&!d().audits[i-1])return target('audit',i-1,`回签${rooms()[i-1].name}的封印`,'用刚找到的纸带改写上一处分析回执。必须回到旧终端复核。');
      if(!d().analysed[i])return target('analysis',i,puzzles()[i].title,'两份残页已齐。完成现场分析，解除本区原机关的保护盖。');
      if(!baseDone(i)){const stage=STAGES[i];return target('main',i,stage.title,stage.desc);}
    }
    if(!hasRecord('f'))return target('final',0,`返回${rooms()[0].name}提取终核纸带`,'五道原机关全部解除后，第一处资料夹才会吐出最后一段纸带。');
    if(!d().audits[4])return target('audit',4,`最后回签 · ${rooms()[4].name}`,'带着首区的终核纸带回到最后一个终端。第五道复核完成后才可撤离。');
    return target('exit',4,'深层协议闭环 · 可以撤离','十五个节点已经全部核验。带齐三份证词，再检查最后一扇门。');
  }
  function objective(){const t=nextTask();if(!t)return null;return {...t,hints:hintsFor(t)};}
  function hintsFor(t){const p=puzzles()[Math.min(t.index||0,4)];
    if(t.kind==='analysis')return [`先对照「现场记录」和「校准残页」。${p.story}`,p.help,M.solutionText(p)];
    if(t.kind==='audit')return [`需要本区分析成功后的封印回执，以及${t.index===4?'第一处资料夹的终核纸带':'下一区域现场记录附带的回签纸带'}。`,M.auditClues(p).join('\n'),`本轮复核码：${p.audit.answer}`];
    if(t.kind==='main')return STAGES[t.index].hints;
    if(t.kind==='remote')return [`残页在${rooms()[Math.max(0,t.index-1)].name}，不是当前谜题按钮里。`,'检查原有文字线索，在新增的「深层夹层」里点对应残页。','任务矩阵会标明残页的区域；返回那个房间后，先读资料夹。'];
    if(t.kind==='final')return ['必须先完成五个原机关。','返回第一处区域，检查原有的文字线索。','在「深层夹层」中读取「终核纸带」，再回最后区域的终端。'];
    return [t.desc,'线索可以从已开放区域反复阅读，不会被消耗。','打开调查矩阵查看每个区域的记录与复核状态。'];
  }
  function updatePanel(){
    $('#depthToolbar').hidden=!enabled();
    if(!enabled()){document.body.classList.remove('depth-active');return;}
    document.body.classList.add('depth-active');document.body.dataset.difficulty=d().level;
    const cfg=config();$('#progressIndex').textContent=String(count()).padStart(2,'0')+' / 15';
    $('#steps').innerHTML=rooms().map((r,i)=>`<div class="depth-step"><div><span>0${i+1}</span><b>${escape(r.name)}</b></div><div class="depth-step-pips">${[d().analysed[i],baseDone(i),d().audits[i]].map((ok,j)=>`<span class="${ok?'verified':''}">${ok?'✓':'○'} ${['分析','原锁','复核'][j]}</span>`).join('')}</div></div>`).join('');
    $('#depthStatus').textContent=`${cfg.short} · ${count()}/15 · 回响 ${Math.floor(d().echo)}`;
    $('#depthMeter').style.width=d().echo+'%';
    $('#depthSeedTag').textContent='SEED / '+d().seed;
    const t=nextTask();if(t){$('#objectiveTitle').textContent=t.title;$('#objectiveText').textContent=t.desc;$('#mobileObjective').textContent=t.title;$('#worldObjective').textContent=t.title;$('#worldSubtext').textContent=t.desc;$('#worldProgress').style.width=count()/15*100+'%';}
  }
  function localReady(key){if(!enabled()||paused)return false;const i=Number(key.slice(1));if(key==='f')return baseDone(4)&&state.room===rooms()[0].id;
    if(key[0]==='l')return state.room===rooms()[i].id&&canEnter(state.room);
    return hasRecord('l'+i)&&state.room===rooms()[Math.max(0,i-1)].id;
  }
  function recordTitle(key){if(key==='f')return '终核纸带 · 第五道封印';const i=Number(key.slice(1));return `${key[0]==='l'?'现场记录':'校准残页'} 0${i+1} · ${puzzles()[i].title}`;}
  function recordLines(key){if(key==='f')return M.auditClues(puzzles()[4]);const i=Number(key.slice(1)),p=puzzles()[i],lines=p.clues.filter((_,n)=>n%2===(key[0]==='l'?0:1));if(key[0]==='l'&&i>0)lines.push('—— 附带：上一处封印的回签纸带 ——',...M.auditClues(puzzles()[i-1]));return lines;}
  function readRecord(key,collected=false){
    if(!enabled()||paused||!(/^(l[0-4]|s[0-4]|f)$/.test(key)))return;
    if(!hasRecord(key)){
      if(collected||!localReady(key)){toast('必须到记录所在区域，且满足它的释放条件。');return;}
      d().read.push(key);if(key[0]==='l'&&key!=='l0')toast(`新夹层已开放：${rooms()[Number(key.slice(1))-1].name}。`);saveGame();renderScene();
    }
    const index=key==='f'?4:Number(key.slice(1));
    openModal(recordTitle(key),`<article class="depth-document"><div class="depth-doc-header"><span>ARCHIVE / 深层协议</span><span>${escape(d().seed)}</span></div><h3>${escape(recordTitle(key))}</h3>${recordLines(key).map(line=>`<p>${escape(line)}</p>`).join('')}<footer>此记录已存入深层档案 · 可在调查矩阵中复读 · 不会消耗</footer></article><div class="btn-row"><button class="btn ghost" data-depth="board">调查矩阵</button><button class="btn primary" data-depth="analysis" data-index="${index}">查看对应分析仪</button></div>`,'EVIDENCE / 文字线索始终可读',true,'depth-record');
  }
  function attachmentKeys(){const i=rooms().findIndex(r=>r.id===state.room),keys=['l'+i];if(i===0&&hasRecord('l0'))keys.push('s0');if(i<4&&hasRecord('l'+(i+1)))keys.push('s'+(i+1));if(i===0&&baseDone(4))keys.push('f');return keys;}
  function attachmentHTML(){const keys=attachmentKeys();return `<section class="depth-attachments"><div class="depth-small-heading"><span>夹层已开启</span><b>DEEP EVIDENCE</b></div><p>原文仍在上方。这些新记录用于多层分析与跨区域复核。</p>${keys.map(key=>`<button class="depth-file" data-depth="record" data-key="${key}"><span>${hasRecord(key)?'✓':'＋'}</span><div><b>${escape(recordTitle(key))}</b><small>${hasRecord(key)?'已收集 · 可复读':'读取后加入深层档案'}</small></div><i>↗</i></button>`).join('')}<button class="text-button" data-depth="board">打开调查矩阵 →</button></section>`;}
  function beforeInspect(id){
    if(!enabled()||paused)return false;
    const i=M.range(5).find(i=>baseObject(i)===id);
    if(i!==undefined&&!d().analysed[i]){openAnalysis(i);return true;}
    return false;
  }
  inspect=function(id){if(beforeInspect(id))return;originalInspect(id);if(enabled()&&activeModal&&phase==='playing'){
    if(NOTES[id]||id==='door')$('#modalBody').insertAdjacentHTML('beforeend',attachmentHTML());
    const i=M.range(5).find(i=>baseObject(i)===id);if(i!==undefined&&d().analysed[i])$('#modalBody').insertAdjacentHTML('beforeend',`<div class="depth-mini-receipt"><span>分析回执 <b>${puzzles()[i].receipt}</b></span><button class="btn ghost small" data-depth="audit" data-index="${i}">${d().audits[i]?'查看已完成复核':'打开封印复核'}</button></div>`);
  }};Ward.inspect=inspect;
  function allowBase(key){if(!enabled())return true;const i=M.range(5).find(i=>baseKey(i)===key);if(i!==undefined&&!d().analysed[i]){openAnalysis(i);return false;}return true;}
  function button(action,index,label,cls='',extra=''){return `<button type="button" class="${cls}" data-depth="${action}" data-index="${index}" ${extra}>${label}</button>`;}
  function openAnalysis(index){
    if(!enabled()||paused||!Number.isInteger(index)||index<0||index>4)return;
    if(state.room!==rooms()[index].id){locationNotice(index);return;}
    activeIndex=index;activeKind='analysis';
    if(d().analysed[index]){showReceipt(index);return;}
    renderAnalysis();
  }
  function locationNotice(index){openModal('分析仪不在此处',`<p>这个终端固定在<strong>${escape(rooms()[index].name)}</strong>。已收集的记录可以远程复读，但核验必须返回设备所在区域。</p><button class="btn primary wide" data-action="go" data-room="${rooms()[index].id}">前往${escape(rooms()[index].name)}</button>`,'LOCATION / 区域限制');}
  function ready(index){return hasRecord('l'+index)&&hasRecord('s'+index)&&(index===0||d().audits[index-1]);}
  function missingHTML(index){const missing=[];if(!hasRecord('l'+index))missing.push(`${rooms()[index].name}的现场记录`);if(!hasRecord('s'+index))missing.push(`${rooms()[Math.max(0,index-1)].name}的校准残页`);if(index>0&&!d().audits[index-1])missing.push(`${rooms()[index-1].name}的封印复核`);return `<div class="depth-prereq"><strong>保护盖仍然封闭</strong><p>还需要：${missing.map(escape).join('、')}。读取本区原有文字线索可找到新增夹层；下一份现场记录会释放上一处残页。</p><div class="btn-row">${button('source',index,'检查本区资料夹','btn ghost')}${button('board',index,'查看调查矩阵','btn primary')}</div></div>`;}
  function collectedClues(p){return p.clues.map((line,i)=>({line,available:hasRecord((i%2?'s':'l')+p.index)}));}
  function clueHTML(p){return `<details class="depth-rules" open><summary>已收集的现场规则 · ${collectedClues(p).filter(c=>c.available).length}/${p.clues.length}</summary><div>${collectedClues(p).map(c=>`<p class="${c.available?'':'redacted'}">${c.available?escape(c.line):'—— 这段内容在另一份残页里 ——'}</p>`).join('')}</div></details>`;}
  function renderAnalysis(){
    const i=activeIndex,p=puzzles()[i],v=d().ui[i],unlocked=ready(i);let html=`<div class="depth-puzzle-heading"><span>CASE / 0${Campaign.chapters.findIndex(c=>c.id===state.chapter)+1} — AREA / 0${i+1}</span><b>第一层 / 现场分析</b></div><p class="depth-story">${escape(p.story)}</p>${clueHTML(p)}`;
    if(!unlocked)html+=missingHTML(i);else{
      html+=`<form id="depthPuzzleForm" autocomplete="off"><div class="depth-console">`;
      if(p.type==='order')html+=`<p class="depth-instruction">按从早到晚点击记录。点击已放入的卡片可撤回。</p><div class="depth-order-slots">${M.range(p.answer.length).map(j=>button('remove',j,`<small>${j+1}</small><strong>${v.chosen[j]===undefined?'待定':escape(p.labels[v.chosen[j]])}</strong>`,'depth-slot')).join('')}</div><div class="depth-choices">${p.labels.map((label,j)=>button('choose',j,escape(label),'depth-choice',v.chosen.includes(j)?'disabled':'')).join('')}</div>`;
      if(p.type==='identity')html+=`<div class="depth-identity"><div class="depth-identity-head"><span>人员</span><span>所持徽章</span><span>所在房间</span></div>${p.people.map((person,j)=>`<div class="depth-identity-row"><strong>${escape(person)}</strong><select aria-label="${person}的徽章" data-depth-select="badges" data-index="${j}"><option value="-1">尚未确定</option>${p.badges.map((b,k)=>`<option value="${k}" ${v.badges[j]===k?'selected':''}>${b}</option>`).join('')}</select><select aria-label="${person}的房间" data-depth-select="places" data-index="${j}"><option value="-1">尚未确定</option>${p.places.map((room,k)=>`<option value="${k}" ${v.places[j]===k?'selected':''}>${room}</option>`).join('')}</select></div>`).join('')}</div>`;
      if(p.type==='cipher')html+=`<div class="depth-cipher-strip">${p.source.map(j=>`<span>${p.symbols[j]}</span>`).join('')}</div><label class="depth-input-label" for="depthCode">${p.length} 位校准结果（保留前导零）</label><input class="depth-code" id="depthCode" inputmode="numeric" pattern="[0-9]*" maxlength="${p.length}" value="${escape(v.text)}" placeholder="${'—'.repeat(p.length)}" spellcheck="false">`;
      if(p.type==='nonogram'){
        html+=`<p class="depth-instruction">点击：未知 · → 实格 ■ → 空格 ×。必须标出全部空格。</p><div class="depth-nonogram" style="--n:${p.n}"><div></div>${p.cols.map((c,j)=>`<div class="depth-colhint" aria-label="第${j+1}列计数${c.join('，')}">${c.map(x=>`<span>${x}</span>`).join('')}</div>`).join('')}${M.range(p.n).map(y=>`<div class="depth-rowhint">${p.rows[y].join(' ')}</div>${M.range(p.n).map(x=>{const k=y*p.n+x,a=v.values[k];return button('cell',k,a<0?'·':a?'':'×',`depth-pixel ${a===1?'filled':a===0?'empty':'unknown'}`,`aria-label="${y+1}行${x+1}列，${a<0?'未知':a?'填实':'留空'}"`);}).join('')}`).join('')}</div>`;
      }
      if(p.type==='lights')html+=`<div class="depth-reading"><span>仍亮起 <b>${v.values.reduce((a,b)=>a+b,0)}</b> / ${p.n*p.n}</span><span>交叉联动 / 不环绕</span></div><div class="depth-grid" style="--n:${p.n}">${v.values.map((x,j)=>button('light',j,`<i></i><small>${j+1}</small>`,`depth-light ${x?'on':''}`,`aria-label="第${j+1}格，${x?'亮':'灭'}" aria-pressed="${!!x}"`)).join('')}</div>${button('undo',i,'撤销上一次脉冲','btn ghost small')}`;
      if(p.type==='linked')html+=`<div class="depth-gauges">${v.values.map((x,j)=>`<div class="depth-gauge"><div class="depth-dial" style="--rotation:${x/p.mod*360}deg"><i></i><b>${x}</b></div><span>表 ${j+1} / 目标 ${p.answer[j]}</span></div>`).join('')}</div><div class="depth-choices">${p.labels.map((label,j)=>button('link',j,escape(label),'depth-choice')).join('')}</div>${button('undo',i,'撤销上一次调节','btn ghost small')}`;
      if(p.type==='route'){
        const sum=v.path.reduce((s,j)=>s+p.weights[j],0),points=v.path.map(j=>`${(j%p.n+.5)*100/p.n},${(Math.floor(j/p.n)+.5)*100/p.n}`).join(' ');
        html+=`<div class="depth-reading"><span>步数 <b>${v.path.length-1} / ${p.steps}</b></span><span>采样和 <b>${sum} / ${p.sum}</b></span></div><p class="depth-instruction">大字为节点编号，小字为采样值。IN 起点、OUT 终点；①②③ 须按顺序经过。</p><div class="depth-grid depth-route" style="--n:${p.n}"><svg viewBox="0 0 100 100" aria-hidden="true"><polyline points="${points}"/></svg>${M.range(p.n*p.n).map(j=>button('route',j,`<b>${j+1}</b><small>${p.blocked.includes(j)?'禁行':'值 '+p.weights[j]}</small><em>${j===p.start?'IN':j===p.end?'OUT':p.checkpoints.includes(j)?['①','②','③'][p.checkpoints.indexOf(j)]:''}</em>`,`depth-node ${v.path.includes(j)?'visited':''} ${p.blocked.includes(j)?'blocked':''}`,`aria-label="节点${j+1}，采样${p.weights[j]}${p.blocked.includes(j)?'，禁行':''}" ${p.blocked.includes(j)?'disabled':''}`)).join('')}</div>${button('undo',i,'撤回一步','btn ghost small')}`;
      }
      if(p.type==='equations')html+=`<div class="depth-equation-rows">${p.matrix.map((row,j)=>`<div><span>${row.map((c,k)=>c?`${c===1?'':c+'×'}${p.labels[k]}`:'').filter(Boolean).join(' + ')} = ${p.targets[j]}</span>${d().level==='abyss'?`<b>当前 ${row.reduce((s,c,k)=>s+c*v.values[k],0)}</b>`:''}</div>`).join('')}</div><div class="depth-integer-bank">${v.values.map((x,j)=>`<div><label>${p.labels[j]}</label><div>${button('minus',j,'−','',`aria-label="减少${p.labels[j]}"`)}<strong>${x}</strong>${button('plus',j,'＋','',`aria-label="增加${p.labels[j]}"`)}</div><small>0 – ${p.max}</small></div>`).join('')}</div>`;
      if(p.type==='testimony')html+=`<div class="depth-reading"><span>标记真话 <b>${v.values.filter(x=>x===1).length} / ${p.total}</b></span><span>点击：未知 → 真 → 假</span></div><div class="depth-testimonies">${p.statements.map((q,j)=>button('truth',j,`<span class="depth-witness">${String.fromCharCode(65+j)}</span><div><q>${escape(M.statementText(q))}</q></div><b class="truth-mark">${v.values[j]<0?'未知':v.values[j]?'真':'假'}</b>`,`depth-testimony ${v.values[j]===1?'true':v.values[j]===0?'false':''}`)).join('')}</div>`;
      html+=`</div><div class="depth-feedback" id="depthFeedback" role="status">${state.mode==='challenge'?`错误核验扣 ${config().wrong} 秒。`:'无时限探索，不扣时间。'} 未填完不扣罚，普通操作与撤回不扣罚。</div><button class="btn primary wide" type="submit">核验现场分析 <span>⟶</span></button><div class="btn-row">${button('reset',i,'重置本机关','btn ghost small')}${button('hint',i,'分析提示','btn ghost small')}${button('board',i,'调查矩阵 / 草稿','btn ghost small')}</div></form>`;
    }
    openModal(p.title,html,`DEEP ANALYSIS / ${config().short} · SEED ${d().seed}`,true,'depth-puzzle');
  }
  function showReceipt(i){const p=puzzles()[i];openModal('保护盖已解除',`<div class="depth-success"><div class="depth-seal">✓</div><span>第一层分析 / VERIFIED</span><h3>${escape(p.title)}</h3><p>原机关现已开放。这不是本区的结束；下一区域会提供回签纸带。</p><div class="depth-receipt"><small>封印回执 · 不是原机关密码</small><strong>${p.receipt}</strong><span>SEED ${escape(d().seed)} / AREA 0${i+1}</span></div></div><div class="btn-row">${button('base',i,'打开原机关','btn primary')}${button('audit',i,'封印复核','btn ghost')}${button('board',i,'调查矩阵','btn ghost')}</div>`,'INTERLOCK / 第一层完成',true,'depth-receipt');}
  function auditReady(i){return d().analysed[i]&&baseDone(i)&&hasRecord(i===4?'f':'l'+(i+1));}
  function openAudit(i){
    if(!enabled()||paused||!Number.isInteger(i)||i<0||i>4)return;
    if(state.room!==rooms()[i].id){locationNotice(i);return;}
    activeIndex=i;activeKind='audit';const p=puzzles()[i],a=p.audit,isReady=auditReady(i),done=d().audits[i];
    let body=`<div class="depth-puzzle-heading"><span>COUNTERSIGN / AREA 0${i+1}</span><b>第三层 / 跨区复核</b></div><p class="depth-story">${done?'这个封印已经闭环。读过的回执和纸带仍可保留。':'原机关开过以后，终端会要求第二个人签名。现在只有你在这里。'}</p>`;
    if(!isReady)body+=`<div class="depth-prereq"><strong>回签条件尚未齐全</strong><p>需要：本区现场分析、本区原机关，以及${i===4?'五个原机关完成后，在第一处资料夹释放的终核纸带':rooms()[i+1].name+'的现场记录（内附回签纸带）'}。</p>${button('board',i,'查看调查矩阵','btn primary wide')}</div>`;
    else body+=`<div class="depth-receipt"><small>已取出的封印回执</small><strong>${p.receipt}</strong><span>回执位置从 1 编号</span></div><div class="depth-rules static">${M.auditClues(p).map(s=>`<p>${escape(s)}</p>`).join('')}</div>${done?'<div class="depth-complete">✓ 复核通过 · 证据链已经闭合</div>':`<form id="depthAuditForm"><label class="depth-input-label" for="depthAuditCode">${a.length} 位回签码</label><input class="depth-code" id="depthAuditCode" inputmode="numeric" maxlength="${a.length}" value="${escape(d().auditInput[i])}" placeholder="${'—'.repeat(a.length)}" autocomplete="off"><div class="depth-feedback" id="depthFeedback" role="status">${state.mode==='challenge'?`完整但错误的核验扣 ${config().wrong} 秒。`:'探索模式没有倒计时。'} 前导零必须保留。</div><button type="submit" class="btn primary wide">提交跨区复核</button><div class="btn-row">${button('hint',i,'复核提示','btn ghost')}${button('board',i,'调查矩阵','btn ghost')}</div></form>`}`;
    openModal(`封印 0${i+1} · ${rooms()[i].name}`,body,'COUNTERSIGN / 不是重复输入旧密码',true,'depth-audit');
  }
  function feedbackDepth(text,error=false){const el=$('#depthFeedback');if(el){el.textContent=text;el.classList.toggle('error',error);}}
  function bumpEcho(amount){if(!enabled())return;const old=d().echo;d().echo=clamp(old+amount,0,100);if(Math.floor(old/25)<Math.floor(d().echo/25)){d().events++;const messages=['记录仪播放了你的声音，但你没有说话。','有人正在另一端逐个复述你填错的数字。','你以为是回声。它却比你先读出了下一行。','封印另一侧的敲击，和你的心跳对上了。'];if(preferences.scares){scare(messages[Math.min(3,Math.floor(d().echo/25)-1)]);SW.app?.triggerScare(messages[Math.min(3,Math.floor(d().echo/25)-1)],3.8);}else toast('回响增强：终端记录了一次核验异常。');}updatePanel();}
  function wrongCost(){return enabled()?config().wrong:10;}
  function penaltyDepth(){
    state.stats.wrong++;if(state.mode==='challenge')state.remaining=Math.max(0,state.remaining-config().wrong);bumpEcho(d().level==='nightmare'?18:12);audio.error();updateTimer();saveGame();if(state.mode==='challenge'&&state.remaining<=0){finish(false);return false;}return true;
  }
  function submitAnalysis(){
    if(!enabled()||paused||activeModal!=='depth-puzzle'||!ready(activeIndex)||d().analysed[activeIndex]||state.room!==rooms()[activeIndex].id)return;
    const p=puzzles()[activeIndex],v=d().ui[activeIndex];if(p.type==='cipher')v.text=$('#depthCode').value.replace(/\D/g,'');const check=M.validate(p,v);
    if(!check.complete){feedbackDepth(check.why);saveGame();return;}
    if(!check.ok){if(penaltyDepth())feedbackDepth(d().level==='nightmare'?'核验失败。至少一项规则不成立；噩梦协议不指出具体矛盾。':check.why,true);return;}
    d().analysed[activeIndex]=true;bumpEcho(-8);audio.chime();renderScene();saveGame();showReceipt(activeIndex);
  }
  function submitAudit(){
    if(!enabled()||paused||activeModal!=='depth-audit'||!auditReady(activeIndex)||d().audits[activeIndex]||state.room!==rooms()[activeIndex].id)return;
    const p=puzzles()[activeIndex],text=$('#depthAuditCode').value.replace(/\D/g,'');d().auditInput[activeIndex]=text;
    if(text.length!==p.audit.length){feedbackDepth(`请补齐 ${p.audit.length} 位。此次不扣罚。`);saveGame();return;}
    if(text!==p.audit.answer){if(penaltyDepth())feedbackDepth('回签不一致。检查位置编号、校准数和进位规则。',true);return;}
    d().audits[activeIndex]=true;bumpEcho(-12);audio.chime();renderScene();saveGame();openModal('封印复核通过',`<div class="depth-success"><div class="depth-seal">◇</div><span>COUNTERSIGN / CLOSED</span><h3>${escape(rooms()[activeIndex].name)}的证据链已闭合</h3><p>这次核验不会被后续错误清空。所有已收集记录仍然有效。</p></div><p class="depth-next">下一步：${escape(nextTask().title)}</p><div class="btn-row">${button('board',activeIndex,'调查矩阵','btn ghost')}<button class="btn primary" data-action="go" data-room="${nextTask().room}">前往下一处目标</button></div>`,'PROGRESS / '+count()+' OF 15 VERIFIED',true,'depth-success');
  }
  function renderAgain(action,index){const modal=$('#modal'),scroll=modal.scrollTop;renderAnalysis();modal.scrollTop=scroll;requestAnimationFrame(()=>{const btn=$(`[data-depth="${action}"][data-index="${index}"]`);btn?.focus({preventScroll:true});});saveGame();}
  function puzzleAction(a,i){
    if(!enabled()||paused||activeModal!=='depth-puzzle'||!ready(activeIndex)||d().analysed[activeIndex])return;
    const p=puzzles()[activeIndex],v=d().ui[activeIndex];
    if(a==='reset'){d().ui[activeIndex]=M.initial(p);renderAgain(a,i);return;}
    if(a==='choose'&&p.type==='order'){if(v.chosen.length<p.answer.length&&!v.chosen.includes(i))v.chosen.push(i);}
    else if(a==='remove'&&p.type==='order')v.chosen.splice(i,1);
    else if(a==='cell'&&p.type==='nonogram')v.values[i]=v.values[i]===-1?1:v.values[i]===1?0:-1;
    else if(a==='light'&&p.type==='lights'){M.flip(v.values,i,p.n);v.history.push(i);v.history=v.history.slice(-200);}
    else if(a==='link'&&p.type==='linked'){v.values=v.values.map((x,j)=>M.mod(x+p.matrix[j][i],p.mod));v.history.push(i);v.history=v.history.slice(-200);}
    else if((a==='plus'||a==='minus')&&p.type==='equations')v.values[i]=M.mod(v.values[i]+(a==='plus'?1:-1),p.max+1);
    else if(a==='truth'&&p.type==='testimony')v.values[i]=v.values[i]===-1?1:v.values[i]===1?0:-1;
    else if(a==='route'&&p.type==='route'){
      const last=v.path.at(-1);if(i===v.path.at(-2))v.path.pop();else if(!p.blocked.includes(i)&&!v.path.includes(i)&&last!==p.end&&Math.abs(i%p.n-last%p.n)+Math.abs(Math.floor(i/p.n)-Math.floor(last/p.n))===1)v.path.push(i);else{feedbackDepth('只能选择相邻未走过的非禁行格；终点不能再往外走。点击上一格可撤回。');return;}
    }else if(a==='undo'){
      if(p.type==='route'&&v.path.length>1)v.path.pop();else if(p.type==='lights'&&v.history.length)M.flip(v.values,v.history.pop(),p.n);else if(p.type==='linked'&&v.history.length){const last=v.history.pop();v.values=v.values.map((x,j)=>M.mod(x-p.matrix[j][last],p.mod));}else return;
    }else return;
    audio.click();renderAgain(a,i);
  }
  function openBoard(){
    if(!enabled()||paused)return;
    const task=nextTask(),cfg=config(),ratio=count();
    openModal('深层调查矩阵',`<div class="depth-board-hero"><div><div class="eyebrow">THE DEEP PROTOCOL / ${cfg.short}</div><h3>不是打开门。<br><span>是证明门后发生了什么。</span></h3><p>现场记录 → 回溯残页 → 分析 → 原机关 → 下一区纸带 → 返回复核</p></div><div class="depth-board-count"><b>${ratio}</b><span>/ 15 完成节点</span></div></div><div class="depth-board-meta"><span>种子 <b>${escape(d().seed)}</b></span><span>新提示 ${d().hintSpent}${cfg.tokens===Infinity?'':' / '+cfg.tokens}</span><span>回响 ${Math.floor(d().echo)} / 100</span></div><div class="depth-current"><span>CURRENT THREAD / 当前线索</span><h4>${escape(task.title)}</h4><p>${escape(task.desc)}</p><button class="btn ghost small" data-action="go" data-room="${task.room}">前往目标区域 →</button></div><div class="depth-matrix">${rooms().map((r,i)=>`<article class="depth-case ${canEnter(r.id)?'available':'sealed'}"><header><span>0${i+1} / ${escape(puzzles()[i].type.toUpperCase())}</span><b>${escape(r.name)}</b></header><h4>${escape(puzzles()[i].title)}</h4><div class="depth-case-stages">${[d().analysed[i],baseDone(i),d().audits[i]].map((ok,j)=>`<span class="${ok?'done':''}">${ok?'✓':'○'} ${['分析','原锁','复核'][j]}</span>`).join('')}</div><div class="depth-case-docs">${['l','s'].map(k=>hasRecord(k+i)?button('read',i,k==='l'?'现场记录 ↗':'校准残页 ↗','',`data-key="${k+i}"`):`<span>${k==='l'?'现场记录':'校准残页'} · 未收集</span>`).join('')}</div>${d().analysed[i]?`<p class="depth-case-receipt">封印回执 <strong>${puzzles()[i].receipt}</strong></p>`:'<p class="depth-case-receipt">回执尚未生成</p>'}<div class="depth-case-actions"><button data-action="go" data-room="${r.id}" class="btn ghost small">前往区域</button>${button('analysis',i,'分析','btn ghost small')}${button('audit',i,'复核','btn ghost small')}</div></article>`).join('')}</div>${hasRecord('f')?button('read',4,'复读终核纸带 →','btn ghost', 'data-key="f"'):''}<section class="depth-scratch"><label for="depthScratch">推理草稿 <small>自动保存 · 最多 6000 字符 · 不会提供判题结果</small></label><textarea id="depthScratch" maxlength="6000" placeholder="记录排除关系、临时序列、计算中间值……">${escape(d().scratch)}</textarea></section><p class="depth-board-foot">高难度档案与本章原存档一起保存。回响只影响氛围，不会改写线索、销毁物品或清空已完成机关。打开本面板仍然计时；需要休息请使用暂停。</p><div class="btn-row">${button('journal',0,'原线索本','btn ghost')}${button('hint',-1,'当前目标提示','btn ghost')}<button class="btn primary" data-action="close">继续现场调查</button></div>`,'INVESTIGATION MATRIX / 证据与依赖',true,'depth-board');
  }
  function hintTask(){if(['depth-puzzle','depth-receipt'].includes(activeModal))return target('analysis',activeIndex,puzzles()[activeIndex].title,'');if(activeModal==='depth-audit')return target('audit',activeIndex,'封印复核 0'+(activeIndex+1),'');return nextTask();}
  let currentHintTask=null;
  function openHintDepth(task=null){
    if(!enabled()||paused)return;currentHintTask=task||hintTask();const t=currentHintTask,cfg=config(),level=d().hints[t.key]||0,hints=hintsFor(t).slice(0,d().level==='nightmare'?2:3),canMore=level<hints.length&&d().hintSpent<cfg.tokens;
    openModal('沿着证据，而不是猜测',`<div class="depth-hint-head"><span>${cfg.short} / HELP</span><h3>${escape(t.title)}</h3><p>${d().level==='nightmare'?`每章最多 6 次新的提示，目前已用 ${d().hintSpent} 次；没有第三层直接答案。`:'提示依次提供方向、推理、直接答案；已展开的内容可免费复读。'}${state.mode==='challenge'?`每条新提示扣 ${cfg.hint} 秒。`:''}</p></div>${hints.slice(0,level).map((line,i)=>`<article class="depth-hint"><b>HINT / 0${i+1}</b><pre>${escape(line)}</pre></article>`).join('')}${!level?'<p>先阅读两份残页。缺的是信息，还是推理关系？</p>':''}<div class="btn-row"><button class="btn ghost" data-action="close">继续思考</button>${canMore?button('reveal',0,`展开第 ${level+1} 条提示`,'btn primary'):''}${button('board',0,'调查矩阵','btn ghost')}</div>`,'HINT / '+d().hintSpent+' 次新提示',true,'depth-hint');
  }
  function revealHintDepth(){if(!enabled()||paused||activeModal!=='depth-hint'||!currentHintTask)return;const cfg=config(),key=currentHintTask.key,limit=d().level==='nightmare'?2:3;if((d().hints[key]||0)>=limit||d().hintSpent>=cfg.tokens)return;d().hints[key]=(d().hints[key]||0)+1;d().hintSpent++;state.stats.hints++;if(state.mode==='challenge')state.remaining=Math.max(0,state.remaining-cfg.hint);bumpEcho(4);updateTimer();saveGame();if(state.mode==='challenge'&&state.remaining<=0){finish(false);return;}openHintDepth(currentHintTask);}
  function blockExit(){if(!enabled())return false;if(count()<15){openModal('门外仍有一份未签名的记录',`<div class="depth-lock"><span>EXTRACTION DENIED / 深层联锁</span><h3>完成 ${count()} / 15 个节点</h3><p>五道原机关只是通道权限。现场分析和跨区复核必须全部完成，才能关闭静默协议。</p><strong>下一步：${escape(nextTask().title)}</strong></div><div class="btn-row">${button('board',0,'调查矩阵','btn primary')}<button class="btn ghost" data-action="go" data-room="${nextTask().room}">前往目标</button></div>`,'FINAL GATE / 不消耗物品',true,'depth-blocked');return true;}return false;}
  function rating(){if(!state?.depth)return '';return state.evidence.length===3&&state.stats.hints===0&&state.stats.wrong<=2?'S+ / 无援助完整闭环':state.evidence.length===3?'A+ / 完整证据闭环':'B+ / 协议闭环';}
  function endingHTML(escaped=true){if(!state?.depth)return '';const q=state.depth;return `<section class="depth-ending"><span>THE DEEP PROTOCOL / ${M.LEVELS[q.level].name}</span><h3>${escaped&&state.solved.exit&&q.audits.every(Boolean)?rating():'深层记录中断'}</h3><p>分析 ${q.analysed.filter(Boolean).length}/5 · 复核 ${q.audits.filter(Boolean).length}/5 · 种子 ${escape(q.seed)}</p><p>本轮新提示 ${q.hintSpent} 次 · 回响事件 ${q.events} 次</p></section>`;}
  openJournal=function(){originalJournal();if(enabled())$('#modalBody').insertAdjacentHTML('afterbegin',`<div class="depth-journal-banner"><span>原始线索保留在这里；新增残页与推理草稿在深层档案。</span>${button('board',0,'打开深层档案','btn primary small')}</div>`);};
  walkthrough=function(){
    if(enabled()&&d().level==='nightmare'){openModal('噩梦协议 · 外援受限','<p>本轮进行中不开放内置完整攻略。你仍可使用六次新提示、草稿和已收集的全部文字线索。结束本轮后可查看本轮种子的完整答案。</p><button class="btn primary wide" data-action="close">返回现场</button>','NO SPOILERS / 规则在开局前公示');return;}
    if(state?.depth&&(phase==='playing'||phase==='ending')){const ps=puzzles();openModal('本轮深层攻略 · 包含全部答案',`<p>仅对应种子 <b>${escape(d().seed)}</b> 和难度 <b>${M.LEVELS[d().level].name}</b>。重新开局可能改变答案。</p><div class="journal-list">${ps.map((p,i)=>`<article class="journal-entry"><div class="entry-id">0${i+1} / ${escape(rooms()[i].name)}</div><h3>${escape(p.title)}</h3><pre class="depth-solution">${escape(M.solutionText(p))}</pre><p>分析回执 ${p.receipt}；复核码 ${p.audit.answer}。</p></article>`).join('')}</div><p>每区先读本区现场记录，再回上一处取校准残页并复核上一封印，然后做本区分析与原机关。第五道原机关完成后，回第一处取终核纸带，再回第五区复核。</p>${button('old-walkthrough',0,'查看五道原机关攻略','btn ghost wide')}`,'SPOILERS / 本轮种子答案',true,'walkthrough');return;}
    originalWalkthrough();
  };
  function mainAction(a,b){const i=Number(b.dataset.index);if(a==='level'){if(phase!=='title'||!M.LEVELS[b.dataset.level])return;selectedLevel=b.dataset.level;persistPref();refreshMenu();return;}
    if(a==='old-walkthrough'){originalWalkthrough();return;}
    if(!enabled()||paused)return;
    if(a==='board')openBoard();else if(a==='analysis')openAnalysis(i);else if(a==='audit')openAudit(i);else if(a==='base'){if(state.room===rooms()[i].id){originalInspect(baseObject(i));if(activeModal)$('#modalBody').insertAdjacentHTML('beforeend',`<div class="depth-mini-receipt"><span>分析已完成 · 还需跨区复核</span>${button('audit',i,'打开封印复核','btn ghost small')}</div>`);}else locationNotice(i);}
    else if(a==='source'){if(state.room===rooms()[i].id)inspect(noteObject(i));else locationNotice(i);}
    else if(a==='record')readRecord(b.dataset.key);else if(a==='read')readRecord(b.dataset.key,true);else if(a==='hint')openHintDepth();else if(a==='reveal')revealHintDepth();else if(a==='journal')originalJournal();else puzzleAction(a,i);
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-depth]');if(!b||b.disabled)return;e.preventDefault();mainAction(b.dataset.depth,b);});
  document.addEventListener('submit',e=>{if(e.target.id==='depthPuzzleForm'){e.preventDefault();submitAnalysis();}else if(e.target.id==='depthAuditForm'){e.preventDefault();submitAudit();}});
  document.addEventListener('input',e=>{
    if(e.target.id==='depthSeed'){seedInput=M.cleanSeed(e.target.value);e.target.value=seedInput;persistPref();return;}
    if(!enabled()||paused)return;
    if(e.target.id==='depthCode'){const p=puzzles()[activeIndex];e.target.value=e.target.value.replace(/\D/g,'').slice(0,p.length);d().ui[activeIndex].text=e.target.value;saveGame();}
    else if(e.target.id==='depthAuditCode'){e.target.value=e.target.value.replace(/\D/g,'').slice(0,puzzles()[activeIndex].audit.length);d().auditInput[activeIndex]=e.target.value;saveGame();}
    else if(e.target.id==='depthScratch'){d().scratch=e.target.value.slice(0,6000);saveGame();}
  });
  document.addEventListener('change',e=>{if(!enabled()||paused||activeModal!=='depth-puzzle'||!e.target.matches('[data-depth-select]'))return;const v=d().ui[activeIndex],p=puzzles()[activeIndex],i=Number(e.target.dataset.index),key=e.target.dataset.depthSelect,value=Number(e.target.value);if(p.type==='identity'&&['badges','places'].includes(key)&&i>=0&&i<p.n&&value>=-1&&value<p.n){v[key][i]=value;saveGame();}});
  window.addEventListener('ward:scene',updatePanel);
  const menu=document.createElement('section');menu.id='depthSelect';menu.className='depth-select';menu.innerHTML=`<div class="depth-select-label"><span>解谜强度</span><span>与计时模式独立</span></div><div class="depth-levels">${Object.entries(M.LEVELS).map(([key,cfg],i)=>`<button data-depth="level" data-level="${key}" aria-pressed="${key===selectedLevel}"><small>0${i+1} / ${cfg.nodes} NODES</small><b>${cfg.name}</b></button>`).join('')}</div><p id="depthDescription"></p><label id="seedEntry" class="depth-seed-label"><span>谜题种子 <small>留空随机</small></span><input id="depthSeed" maxlength="20" value="${escape(seedInput)}" placeholder="例如 NIGHT-0117" autocomplete="off" spellcheck="false" aria-label="谜题种子，留空随机"></label>`;
  $('.mode-select').before(menu);
  const tools=document.createElement('div');tools.id='depthToolbar';tools.className='depth-toolbar';tools.hidden=true;tools.innerHTML=`<button data-depth="board"><span class="depth-toolbar-symbol">◇</span><span><b>调查矩阵</b><small id="depthStatus">深层协议</small></span><i>↗</i></button><div class="depth-echo"><span id="depthMeter"></span></div><small id="depthSeedTag"></small>`;$('#gameScreen .scene-toolbar').after(tools);
  window.Depth={enabled,config,get selectedLevel(){return selectedLevel;},setLevel(level){if(M.LEVELS[level]&&phase==='title'){selectedLevel=level;persistPref();refreshMenu();}},prepareState,sanitizeDepth,refreshMenu,duration,count,canEnter,locked,nextTask,objective,updatePanel,allowBase,wrongCost,penalty:penaltyDepth,openHint:openHintDepth,revealHint:revealHintDepth,blockExit,endingHTML,rating,puzzles,openBoard,openAnalysis,openAudit,readRecord,recordLines,ready,auditReady};
  refreshMenu();
})();
