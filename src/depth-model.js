/* V4 pure deterministic puzzle model. No DOM, storage, network or third-party code.
 * Seeds produce the same chapter + difficulty, including audit tapes.
 * Validators check the authored constraints, not an arbitrary hidden click sequence.
 */
'use strict';
(function(root) {
  const LEVELS = {
    classic: { name:'经典调查', short:'经典', nodes:5, wrong:10, hint:20, tokens:Infinity, multiplier:1, desc:'保留 v3 的原始五道机关与全部剧情。' },
    abyss: { name:'深渊推演', short:'深渊', nodes:15, wrong:25, hint:40, tokens:Infinity, multiplier:3, desc:'五层现场分析 + 五道原机关 + 五轮跨区复核；完整分级提示。' },
    nightmare: { name:'噩梦协议', short:'噩梦', nodes:15, wrong:45, hint:60, tokens:6, multiplier:3.5, desc:'更大谜面、更长编码；每章 6 次新提示，无直接答案；完成前不开放内置攻略。' }
  };
  const CATALOG = {
    hospital: [
      ['order','第六次查房','这些记录的时钟都停了，只剩相互之间的间隔。有人删掉了负责最后一次查房的名字。'],
      ['identity','空床身份核验','床牌、声音和病历编号属于不同的人。镜子里站着的人没有床位。'],
      ['cipher','涂黑病历译码','被涂掉的不是姓名，而是姓名被念出的顺序。把病历翻到背面。'],
      ['nonogram','断层影像重建','显影液里的影像正在成形。只有填实与留空，没有第三种解释。'],
      ['linked','心跳总线同步','五个监护表共用一条总线。你调动一个，另一个便开始替它计数。']
    ],
    metro: [
      ['route','末班车禁行图','线路图记录了一趟不存在的列车。它不能经过红色区段，却必须经过每一个报站点。'],
      ['lights','信号矩阵消隐','所有亮着的信号都在请求一列已经报废的车。让每一盏灯同时安静。'],
      ['identity','无票乘客对照','五张车票、五件遗失物，没有一个乘客承认自己上过车。'],
      ['order','脱轨调度重演','发车指令先于到站录音，还是录音本来就在等待发车？记录之间的间隔没有说谎。'],
      ['cipher','检修口双层电文','把调度字典带回隧道。广播只会按译出的顺序打开检修口。']
    ],
    orphan: [
      ['identity','消失的点名册','孩子们交换了徽章，也交换了藏身处。午夜点名时，必须把每个人放回真实的位置。'],
      ['nonogram','黑板上的第七个人','擦不掉的粉笔画被拆成了行列计数。填错一格，影子就多出一只手。'],
      ['testimony','镜子里的证人','每个人都谈论其他人的话。没有外部证据，只知道几个人在说真话。'],
      ['cipher','逆读纸偶剧本','剧本被剪开、换位，又用孩子们的暗号写了一遍。逐层解开它，不要猜名字。'],
      ['order','停钟之夜的顺序','钟楼没有时间，只有六次敲击之间残留的间隔。最后一声并不属于钟。']
    ],
    abyss: [
      ['equations','隔舱整数配平','四条计量关系同时成立，才能关闭舱间联锁。此处数值仅属于虚构设备。'],
      ['lights','生物舱交叉脉冲','一次脉冲会翻转相邻单元。黑暗不是故障，是防止它看见你的唯一办法。'],
      ['route','盲区声纹航路','声纹不能穿过泄漏区。依次连接浮标，同时满足总步数和采样和。'],
      ['linked','压载表耦合','所有表盘都彼此牵连。归零之后，系统仍会记住你怎样移动过它。'],
      ['testimony','逃生舱录音审讯','每一段录音都在质疑另一段。确认哪些话能够同时为真，才能相信舱门上的绿灯。']
    ],
    astro: [
      ['order','缆车失联时间线','观测员留下了各事件之间的时间差，却抹去了日期和绝对时间。'],
      ['cipher','逆行星图转译','星名只是编码字典的索引。真正的口令藏在重新排列后的数列里。'],
      ['nonogram','不可见星体轮廓','望远镜没有拍到星体，只记录了逐行逐列被吞掉的光。'],
      ['equations','黑星观测配准','五条传感器关系必须同时满足。任何一个单独合理的数值都可能是误导。'],
      ['route','黎明前最后一条线','把五个地标连接成一条不回头的航路。所有观测值相加，必须与广播一致。']
    ]
  };
  const NAMES = {
    hospital:['送药','采样','转床','查房','封门','停电','复诊','归档'],
    metro:['检票','进站','换轨','关门','发车','失联','返库','断讯'],
    orphan:['点名','晚餐','排练','洗漱','熄灯','敲钟','失踪','开门'],
    abyss:['封舱','排压','取样','声检','配平','上浮','断联','充能'],
    astro:['挂索','进馆','校星','停钟','观测','回波','发射','失联']
  };
  const hash = text => { let h=2166136261; for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; };
  function rng(seed) { let t=typeof seed==='number'?seed>>>0:hash(seed); return ()=>{t+=0x6D2B79F5;let z=t;z=Math.imul(z^z>>>15,z|1);z^=z+Math.imul(z^z>>>7,z|61);return ((z^z>>>14)>>>0)/4294967296;}; }
  const rand=(r,n)=>Math.floor(r()*n), range=n=>Array.from({length:n},(_,i)=>i);
  function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rand(r,i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  const mod=(a,m)=>((a%m)+m)%m, equal=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
  const validInts=(a,n,min,max)=>Array.isArray(a)&&a.length===n&&a.every(x=>Number.isInteger(x)&&x>=min&&x<=max);
  function cleanSeed(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,20);}
  function runs(a){const out=[];let k=0;for(const v of [...a,0]){if(v)k++;else if(k){out.push(k);k=0;}}return out.length?out:[0];}
  function nonogramCount(rows,cols,n,limit=2){
    const options=rows.map(h=>range(1<<n).map(v=>range(n).map(i=>(v>>i)&1)).filter(a=>equal(runs(a),h)));
    const colopts=cols.map(h=>range(1<<n).map(v=>range(n).map(i=>(v>>i)&1)).filter(a=>equal(runs(a),h)));
    let count=0;const board=[];
    function walk(y,cs){if(count>=limit)return;if(y===n){count++;return;}for(const row of options[y]){const next=cs.map((a,x)=>a.filter(c=>c[y]===row[x]));if(next.some(a=>!a.length))continue;board.push(row);walk(y+1,next);board.pop();}}
    walk(0,colopts);return count;
  }
  function flip(values,i,n){const x=i%n,y=Math.floor(i/n);for(const [dx,dy] of [[0,0],[0,-1],[1,0],[0,1],[-1,0]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<n&&yy>=0&&yy<n)values[yy*n+xx]^=1;}}
  function statement(q,v){if(q.type==='is')return !!v[q.a]===!!q.value;if(q.type==='same')return v[q.a]===v[q.b];if(q.type==='different')return v[q.a]!==v[q.b];if(q.type==='both')return !!(v[q.a]&&v[q.b]);if(q.type==='either')return !!(v[q.a]||v[q.b]);return false;}
  function statementText(q){const a=String.fromCharCode(65+q.a),b=String.fromCharCode(65+q.b);return q.type==='is'?`${a} 说的是${q.value?'真':'假'}话`:q.type==='same'?`${a} 与 ${b} 的真假相同`:q.type==='different'?`${a} 与 ${b} 的真假不同`:q.type==='both'?`${a} 与 ${b} 都说真话`:`${a} 与 ${b} 至少一人说真话`;}
  function generate(chapter,index,level,seed){
    if(!CATALOG[chapter]||!CATALOG[chapter][index])throw Error('Unknown depth puzzle');
    const [type,title,story]=CATALOG[chapter][index], hard=level==='nightmare',r=rng(`${cleanSeed(seed)}|${chapter}|${index}|${level}|depth-1`);
    const p={id:`dp_${chapter}_${index}`,chapter,index,type,title,story,level,clues:[],answer:null};
    if(type==='order'){
      const n=hard?8:6,answer=shuffle(range(n),r),times=[0];for(let i=1;i<n;i++)times.push(times.at(-1)+1+rand(r,7));
      p.labels=NAMES[chapter].slice(0,n);p.answer=answer;
      // A spanning tree of signed time differences uniquely determines relative times.
      const edges=[];for(let k=1;k<n;k++){const j=rand(r,k);edges.push([answer[j],answer[k],times[k]-times[j]]);}p.edges=shuffle(edges,r);
      p.clues=p.edges.map(([a,b,d])=>`「${p.labels[b]}」比「${p.labels[a]}」晚 ${d} 分钟。`);
      p.clues.push('全部记录来自同一段连续值班，没有跨日或同一时刻的事件。按从早到晚排列。');
      p.help='把任一事件暂记为 0，利用间隔推出其余事件的相对时刻，再按大小排序。';
    }else if(type==='identity'){
      const n=hard?5:4;p.n=n;p.people=['林','许','陈','周','沈'].slice(0,n);p.badges=shuffle(['月','眼','羽','钟','星'].slice(0,n),r);p.places=['01 室','02 室','03 室','04 室','05 室'].slice(0,n);
      const badges=shuffle(range(n),r),places=shuffle(range(n),r);p.answer={badges,places};
      p.clues.push('每人恰有一个徽章和一个房间；同类物件不重复。徽章排列与人员排列不同。');
      // Unique bijections from anchored cyclic succession and explicit badge-room relations.
      const chain=shuffle(range(n),r);p.anchor={person:chain[0],room:places[chain[0]]};p.orderChain=chain;
      p.clues.push(`${p.people[chain[0]]} 在 ${p.places[places[chain[0]]] }。`);
      for(let k=1;k<n;k++){const a=chain[k-1],b=chain[k],d=mod(places[b]-places[a],n);p.clues.push(`从${p.people[a]}的房号顺着 01→02→…→0${n}→01 前进 ${d} 格，是${p.people[b]}的房间。`);}
      p.badgeLinks=shuffle(range(n),r).map(i=>[badges[i],places[i]]);
      for(const [b,t] of p.badgeLinks)p.clues.push(`「${p.badges[b]}」徽章出现在 ${p.places[t]}，不按姓名排列。`);
      p.clues= [p.clues[0],...shuffle(p.clues.slice(1),r)];p.help='先根据房间的环形关系确定每个人的房号，再把房号与徽章表对照。两个属性都要填。';
    }else if(type==='cipher'){
      const n=hard?8:6;p.length=n;p.symbols=['月','眼','羽','钟','星','门','舟','骨','雨','灯'];p.dictionary=shuffle(range(10),r);p.source=range(n).map(()=>rand(r,10));p.permutation=shuffle(range(n),r);p.offsets=range(n).map(()=>rand(r,10));p.chain=hard;
      const digits=p.source.map(s=>p.dictionary[s]),raw=p.permutation.map(i=>digits[i]),answer=[];for(let i=0;i<n;i++)answer.push(mod(raw[i]+p.offsets[i]+(hard&&i?answer[i-1]:0),10));p.answer=answer.join('');
      p.clues=[`残页符号：${p.source.map(i=>p.symbols[i]).join(' / ')}。`,`读取位置顺序（从 1 编号）：${p.permutation.map(i=>i+1).join(' → ')}。`,`校准向量：${p.offsets.join(' / ')}。`,`符号字典：${p.symbols.map((s,i)=>`${s}=${p.dictionary[i]}`).join('，')}。`,hard?'先查字典，再重排。第 1 位加其校准数；以后每位加其校准数和前一位【已经写下的答案数字】。每一步只保留个位。':'先查字典，再重排。每个重排后的数字加同位置校准数，只保留个位。'];
      p.help='把译码、换位、加偏移分开写成三行。噩梦模式还要从左到右使用上一位已经算出的答案。';
    }else if(type==='nonogram'){
      const n=hard?7:5;p.n=n;let board,rows,cols,count=0;
      do{board=range(n*n).map(()=>r()<.54?1:0);rows=range(n).map(y=>runs(board.slice(y*n,y*n+n)));cols=range(n).map(x=>runs(range(n).map(y=>board[y*n+x])));count++;}while((board.reduce((s,x)=>s+x,0)<n||nonogramCount(rows,cols,n)!==1)&&count<160);
      if(nonogramCount(rows,cols,n)!==1){board=range(n*n).map(i=>i%n===Math.floor(n/2)||Math.floor(i/n)===Math.floor(n/2)?1:0);rows=range(n).map(y=>runs(board.slice(y*n,y*n+n)));cols=range(n).map(x=>runs(range(n).map(y=>board[y*n+x])));}
      p.answer=board;p.rows=rows;p.cols=cols;
      p.clues=[`${n} × ${n} 显影板。每串数字表示连续实格的长度；相邻两段实格之间至少隔一个空格。`,`行计数从上到下：${rows.map((h,i)=>`${i+1}行 [${h.join(' ')}]`).join('；')}。`,`列计数从左到右：${cols.map((h,i)=>`${i+1}列 [${h.join(' ')}]`).join('；')}。`,'0 表示该整行或整列没有实格。点击依次切换：未知 → 实格 → 空格；检测前必须标明所有空格。'];
      p.help='从占满整行/整列的计数开始，用交叉重叠确定必填格。每条线的连续段必须完全匹配，不只是格子总数。';
    }else if(type==='lights'){
      p.n=hard?5:4;const cells=p.n*p.n;p.presses=shuffle(range(cells),r).slice(0,hard?12:8);p.start=Array(cells).fill(0);for(const i of p.presses)flip(p.start,i,p.n);p.answer=Array(cells).fill(0);
      p.clues=[`${p.n} × ${p.n} 联动矩阵。每次按下会同时翻转本格及上下左右；边缘不环绕。`,'目标是所有格同时熄灭。重复按同一格两次会抵消；输入操作次序不影响最终结果。','从第一行假设开始：第二行的按钮可以专门消除第一行的余灯。逐行向下追灯，最后一行必须全部熄灭。'];p.help='不要逐盏随意修补。固定第一行后，从第二行开始，只按上一行仍亮的正下方按钮；末行不净就调整第一行。';
    }else if(type==='route'){
      const n=hard?6:5;p.n=n;let path=[];
      for(let tries=0;tries<300;tries++){path=[0];while(path.length<(hard?18:13)){const last=path.at(-1),ns=[last-n,last+1,last+n,last-1].filter(v=>v>=0&&v<n*n&&!path.includes(v)&&Math.abs(v%n-last%n)+Math.abs(Math.floor(v/n)-Math.floor(last/n))===1);if(!ns.length)break;path.push(ns[rand(r,ns.length)]);}if(path.length>=(hard?17:12)&&path.at(-1)!==1)break;}
      p.answer=path;p.start=path[0];p.end=path.at(-1);p.steps=path.length-1;p.checkpoints=[path[Math.floor(path.length*.27)],path[Math.floor(path.length*.53)],path[Math.floor(path.length*.78)]];
      p.blocked=shuffle(range(n*n).filter(i=>!path.includes(i)),r).slice(0,hard?10:6);p.weights=range(n*n).map(()=>1+rand(r,8));p.sum=path.reduce((s,i)=>s+p.weights[i],0);
      p.clues=[`只能上下左右相邻移动，不可重复经过节点；红色禁行格不可进入。节点从左到右、从上到下以 1 开始编号。`,`从 ${p.start+1} 号出发，最后到达 ${p.end+1} 号；总共恰好 ${p.steps} 步（起点不算一步）。`,`必须依次经过检查点 ${p.checkpoints.map(i=>i+1).join(' → ')}，不能提前经过后面的检查点。`,`经过的全部格子右下角采样值相加为 ${p.sum}，包括起点和终点。可存在多条合格路线，全部接受。`];p.help='先把三段检查点连起来，注意终点只能最后进入。步数限制与采样总和是两个独立条件；点击上一格或撤回按钮可后退。';
    }else if(type==='equations'){
      const n=hard?5:4;p.n=n;p.max=hard?8:6;p.labels=range(n).map(i=>String.fromCharCode(65+i));p.answer=range(n).map(()=>1+rand(r,p.max));
      // Strict diagonal dominance guarantees a unique real (and integer) solution.
      let m=range(n).map((_,i)=>range(n).map((_,j)=>i===j?0:rand(r,3)));m.forEach((row,i)=>row[i]=row.reduce((a,b)=>a+b,0)+1+rand(r,3));
      const perm=shuffle(range(n),r);p.matrix=perm.map(i=>m[i]);p.targets=p.matrix.map(row=>row.reduce((s,c,j)=>s+c*p.answer[j],0));
      p.clues=[`每个变量都是 0 到 ${p.max} 的整数。${n} 条测量式必须同时成立；这是虚构设备，不是现实操作指南。`,...p.matrix.map((row,i)=>`${row.map((c,j)=>c?`${c===1?'':c+'×'}${p.labels[j]}`:'').filter(Boolean).join(' + ')} = ${p.targets[i]}。`)];p.help='把同一变量的项对齐，先消去系数相近的项。旋钮可以加减；不要只满足一条测量式。';
    }else if(type==='linked'){
      const n=hard?5:4;p.n=n;p.mod=hard?7:5;p.labels=range(n).map(i=>'阀 '+String.fromCharCode(65+i));
      // Triangular influence, permuted rows/columns: always invertible modulo prime.
      let a=range(n).map((_,i)=>range(n).map((_,j)=>j<i?0:j===i?1:rand(r,p.mod)));const rp=shuffle(range(n),r),cp=shuffle(range(n),r);p.matrix=rp.map(i=>cp.map(j=>a[i][j]));p.presses=range(n).map(()=>1+rand(r,p.mod-1));p.start=range(n).map(()=>rand(r,p.mod));p.answer=p.matrix.map((row,i)=>mod(p.start[i]+row.reduce((s,c,j)=>s+c*p.presses[j],0),p.mod));
      p.clues=[`${n} 个表盘都在 0～${p.mod-1} 循环，到 ${p.mod} 回到 0。按钮只加不减；同一按钮连按 ${p.mod} 次回到原状态。`,...range(n).map(j=>`${p.labels[j]}：${p.matrix.map((row,i)=>`表 ${i+1} ${row[j]?'+'+row[j]:'不变'}`).join('；')}。`),`目标表盘（从左到右）：${p.answer.join(' / ')}。`];p.help='先找只受较少按钮影响的表盘。把每个按钮的次数当成未知数，所有运算都按表盘的循环长度取余。';
    }else if(type==='testimony'){
      const n=hard?8:6;p.n=n;let statements=[],truths=[],count=0,total=0;
      for(let attempt=0;attempt<300;attempt++){
        truths=range(n).map(()=>rand(r,2));total=truths.reduce((s,x)=>s+x,0);if(total<2||total>n-2)continue;
        statements=range(n).map((_,i)=>{let q;for(let z=0;z<100;z++){const type=['is','same','different','both','either'][rand(r,5)],a=rand(r,n),b=rand(r,n);q={type,a,b,value:rand(r,2)};if(a!==i&&b!==i&&a!==b&&Number(statement(q,truths))===truths[i])return q;}return {type:'is',a:i,b:(i+1)%n,value:1};});
        count=0;for(let bits=0;bits<(1<<n);bits++){const v=range(n).map(i=>(bits>>i)&1);if(v.reduce((s,x)=>s+x,0)===total&&statements.every((q,i)=>Number(statement(q,v))===v[i]))count++;}if(count===1)break;
      }
      if(count!==1){truths=range(n).map(i=>i%2);total=truths.reduce((s,x)=>s+x,0);statements=truths.map((v,i)=>({type:'is',a:0,b:1,value:v?0:1}));/* fallback replaced below by anchored fixed-point statements */
        // A says B true, B says A false: avoid contradictions by an explicit constant predicate.
        statements=truths.map(v=>({type:v?'same':'different',a:0,b:0,value:0}));}
      p.statements=statements;p.answer=truths;p.total=total;p.clues=[`这里恰好 ${total} 人说真话，其余人说假话。每条引号内的整句话为一个命题。`,`“同真同假”指真假值相同；“至少一人”包括两人都真；没有沉默者。`,...statements.map((q,i)=>`证人 ${String.fromCharCode(65+i)}：「${statementText(q)}」。`)];p.help='每个人的真假必须与他那句话的计算结果一致。选出规定数量的真话者后，把每句话代回核对，不能只数人数。';
    }
    const length=hard?8:6;p.receipt=range(length).map(()=>rand(r,10)).join('');
    const permutation=shuffle(range(length),r),offsets=range(length).map(()=>rand(r,10));const chain=hard?2:index>=3?2:index===2?1:0,coef=hard&&index>=3?3:1;
    const raw=permutation.map(i=>Number(p.receipt[i])),answer=[];for(let i=0;i<length;i++)answer.push(mod(raw[i]*coef+offsets[i]+(i?(chain===2?answer[i-1]:chain===1?raw[i-1]:0):0),10));
    p.audit={length,permutation,offsets,chain,coef,answer:answer.join('')};return p;
  }
  function initial(p){switch(p.type){case 'order':return {chosen:[]};case 'identity':return {badges:Array(p.n).fill(-1),places:Array(p.n).fill(-1)};case 'cipher':return {text:''};case 'nonogram':return {values:Array(p.n*p.n).fill(-1)};case 'lights':case 'linked':return {values:[...p.start],history:[]};case 'route':return {path:[p.start]};case 'equations':return {values:Array(p.n).fill(0)};case 'testimony':return {values:Array(p.n).fill(-1)};}throw Error('Unknown type');}
  function validate(p,v){
    const result=(ok,why)=>({ok,why,complete:true}),incomplete=why=>({ok:false,why,complete:false});
    if(!v||typeof v!=='object')return incomplete('输入尚未建立。');
    if(p.type==='order'){if(!validInts(v.chosen,p.answer.length,0,p.answer.length-1)||new Set(v.chosen).size!==p.answer.length)return incomplete('先放入每一张记录，不能重复。');return result(equal(v.chosen,p.answer),'至少一条时间间隔关系不成立。');}
    if(p.type==='identity'){if(!validInts(v.badges,p.n,0,p.n-1)||!validInts(v.places,p.n,0,p.n-1))return incomplete('每个人的徽章与房间都必须指定。');if(new Set(v.badges).size!==p.n||new Set(v.places).size!==p.n)return result(false,'同一种徽章或房间分配给了两个人。');return result(equal(v.badges,p.answer.badges)&&equal(v.places,p.answer.places),'人员—房间—徽章之间仍有关系矛盾。');}
    if(p.type==='cipher'){if(typeof v.text!=='string'||!new RegExp(`^\\d{${p.length}}$`).test(v.text))return incomplete(`请补齐 ${p.length} 位数字，保留开头的零。`);return result(v.text===p.answer,'译码、换位或校准计算有一层没有对齐。');}
    if(p.type==='nonogram'){if(!validInts(v.values,p.n*p.n,0,1))return incomplete('仍有未知格。把留空位置标成 × 后再检测。');return result(p.rows.every((h,y)=>equal(runs(v.values.slice(y*p.n,y*p.n+p.n)),h))&&p.cols.every((h,x)=>equal(runs(range(p.n).map(y=>v.values[y*p.n+x])),h)),'至少一行或一列的连续段与计数不符。');}
    if(p.type==='lights'){if(!validInts(v.values,p.n*p.n,0,1))return incomplete('矩阵状态无效，请重置本机关。');return result(v.values.every(x=>x===0),'还有信号灯没有熄灭。');}
    if(p.type==='linked'){if(!validInts(v.values,p.n,0,p.mod-1))return incomplete('表盘状态无效，请重置本机关。');return result(equal(v.values,p.answer),'当前表盘没有同时达到目标。');}
    if(p.type==='equations'){if(!validInts(v.values,p.n,0,p.max))return incomplete('请填入允许范围的整数。');return result(p.matrix.every((row,i)=>row.reduce((s,c,j)=>s+c*v.values[j],0)===p.targets[i]),'至少一条测量式不成立。');}
    if(p.type==='testimony'){if(!validInts(v.values,p.n,0,1))return incomplete('先把每位证人标为真或假。');if(v.values.reduce((s,x)=>s+x,0)!==p.total)return result(false,'标为真的人数不符合记录。');return result(p.statements.every((q,i)=>Number(statement(q,v.values))===v.values[i]),'某位证人的标记与他那句话的真假矛盾。');}
    if(p.type==='route'){
      const a=v.path;if(!Array.isArray(a)||a.length<2||a.at(-1)!==p.end)return incomplete('路线还没有抵达终点。');
      if(!a.every(x=>Number.isInteger(x)&&x>=0&&x<p.n*p.n)||a[0]!==p.start||new Set(a).size!==a.length||a.some(x=>p.blocked.includes(x))||a.some((x,i)=>i&&Math.abs(x%p.n-a[i-1]%p.n)+Math.abs(Math.floor(x/p.n)-Math.floor(a[i-1]/p.n))!==1))return result(false,'路线存在禁行、重复或不相邻的节点。');
      if(a.length-1!==p.steps)return result(false,`路线长度应为 ${p.steps} 步。`);const cps=a.filter(x=>p.checkpoints.includes(x));if(!equal(cps,p.checkpoints))return result(false,'检查点必须齐全且按规定顺序经过。');return result(a.reduce((s,i)=>s+p.weights[i],0)===p.sum,'总采样值与记录不符。');
    }
    return result(false,'未知机关');
  }
  function solutionState(p){switch(p.type){case 'order':return {chosen:[...p.answer]};case 'identity':return JSON.parse(JSON.stringify(p.answer));case 'cipher':return {text:p.answer};case 'route':return {path:[...p.answer]};default:return {values:[...p.answer]};}}
  function sanitize(p,v){const base=initial(p);if(!v||typeof v!=='object')return base;
    if(p.type==='cipher')return {text:typeof v.text==='string'?v.text.replace(/\D/g,'').slice(0,p.length):''};
    if(p.type==='order')return Array.isArray(v.chosen)&&v.chosen.length<=p.answer.length&&v.chosen.every(x=>Number.isInteger(x)&&x>=0&&x<p.answer.length)&&new Set(v.chosen).size===v.chosen.length?{chosen:[...v.chosen]}:base;
    if(p.type==='identity')return validInts(v.badges,p.n,-1,p.n-1)&&validInts(v.places,p.n,-1,p.n-1)?{badges:[...v.badges],places:[...v.places]}:base;
    if(p.type==='route'){const a=v.path;return Array.isArray(a)&&a.length<=p.n*p.n&&a.length&&a[0]===p.start&&a.every((x,i)=>Number.isInteger(x)&&x>=0&&x<p.n*p.n&&!p.blocked.includes(x)&&(!i||Math.abs(x%p.n-a[i-1]%p.n)+Math.abs(Math.floor(x/p.n)-Math.floor(a[i-1]/p.n))===1))&&new Set(a).size===a.length?{path:[...a]}:base;}
    let n=p.type==='nonogram'||p.type==='lights'?p.n*p.n:p.n,min=['nonogram','testimony'].includes(p.type)?-1:0,max=p.type==='linked'?p.mod-1:p.type==='equations'?p.max:1;
    if(!validInts(v.values,n,min,max))return base;const out={values:[...v.values]};if('history' in base)out.history=Array.isArray(v.history)?v.history.slice(-200).filter(x=>Number.isInteger(x)&&x>=0&&x<(p.type==='lights'?n:p.n)):[];return out;
  }
  function auditClues(p){const a=p.audit;return [`只使用该区分析成功后生成的 ${a.length} 位「封印回执」，不是原机关密码。`,`按回执位置 ${a.permutation.map(i=>i+1).join(' → ')} 重排（位置从 1 开始）。`,`对应校准数：${a.offsets.join(' / ')}。`,`每位 = 重排数字${a.coef!==1?' × '+a.coef:''} + 对应校准数${a.chain===1?' + 前一位【重排后的原数字】':a.chain===2?' + 前一位【已经写下的答案数字】':''}，只保留个位。第一位没有前一位，按 0 处理。`];}
  function solutionText(p){switch(p.type){case 'order':return p.answer.map(i=>p.labels[i]).join(' → ');case 'identity':return p.people.map((n,i)=>`${n}：${p.badges[p.answer.badges[i]]} / ${p.places[p.answer.places[i]]}`).join('；');case 'cipher':return p.answer;case 'nonogram':return range(p.n).map(y=>p.answer.slice(y*p.n,y*p.n+p.n).map(x=>x?'■':'×').join(' ')).join('\n');case 'lights':return '从重置状态按编号 '+p.presses.map(i=>i+1).join('、')+'（顺序不限）';case 'route':return '一条合格路线：'+p.answer.map(i=>i+1).join(' → ');case 'equations':return p.labels.map((n,i)=>`${n}=${p.answer[i]}`).join('，');case 'linked':return '从重置状态按 '+p.presses.map((n,i)=>`${p.labels[i]} ${n} 次`).join('，');case 'testimony':return p.answer.map((v,i)=>`${String.fromCharCode(65+i)}=${v?'真':'假'}`).join('，');}return '';}
  const api={LEVELS,CATALOG,hash,rng,rand,range,shuffle,mod,equal,cleanSeed,runs,nonogramCount,flip,statement,statementText,generate,initial,validate,solutionState,sanitize,auditClues,solutionText};
  root.DepthModel=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
