/* Run: node tests/depth_model.test.cjs. No dependencies. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../src/depth-model.js');
let count=0,truthCases=0,nonograms=0;const variants=new Map();const started=Date.now();
for(let seed=0;seed<60;seed++)for(const level of ['abyss','nightmare'])for(const chapter of Object.keys(M.CATALOG))for(let index=0;index<5;index++){
 const p=M.generate(chapter,index,level,'VERIFY-'+seed), v=M.solutionState(p),r=M.validate(p,v);assert.equal(r.ok,true,JSON.stringify({chapter,index,level,seed,r}));
 assert.deepEqual(p,M.generate(chapter,index,level,'VERIFY-'+seed),'Deterministic seed');
 assert.equal(M.validate(p,M.initial(p)).ok,false,'Nontrivial initial state');
 assert.deepEqual(M.sanitize(p,{invalid:true}),M.initial(p),'Malformed state falls back');
 assert.deepEqual(M.sanitize(p,M.initial(p)),M.initial(p));
 if(p.type==='nonogram'){assert.equal(M.nonogramCount(p.rows,p.cols,p.n),1);nonograms++;}
 if(p.type==='testimony'){let n=0;for(let bits=0;bits<(1<<p.n);bits++){const values=M.range(p.n).map(i=>(bits>>i)&1);if(M.validate(p,{values}).ok)n++;}assert.equal(n,1);truthCases++;}
 if(p.type==='cipher'){assert.equal(M.validate(p,{text:p.answer.slice(1)}).complete,false);assert.equal(M.validate(p,{text:String((+p.answer[0]+1)%10)+p.answer.slice(1)}).ok,false);}
 if(p.type==='lights'){const values=[...p.start];p.presses.forEach(i=>M.flip(values,i,p.n));assert(values.every(x=>x===0));}
 if(p.type==='linked'){const values=[...p.start];p.presses.forEach((n,j)=>{for(let k=0;k<n;k++)for(let row=0;row<p.n;row++)values[row]=M.mod(values[row]+p.matrix[row][j],p.mod);});assert.deepEqual(values,p.answer);}
 const raw=p.audit.permutation.map(i=>+p.receipt[i]),out=[];for(let i=0;i<raw.length;i++)out.push(M.mod(raw[i]*p.audit.coef+p.audit.offsets[i]+(i?(p.audit.chain===2?out[i-1]:p.audit.chain===1?raw[i-1]:0):0),10));assert.equal(out.join(''),p.audit.answer);
 const key=chapter+'-'+index+'-'+level;variants.set(key,new Set([...(variants.get(key)||[]),JSON.stringify({answer:p.answer,start:p.start,presses:p.presses})]));count++;
}
assert([...variants.values()].every(s=>s.size>1));
const report={passed:true,puzzles:count,seeds:60,levels:2,chapterRegions:25,nonogramUniquenessChecks:nonograms,testimonyExhaustiveUniquenessChecks:truthCases,deterministicGeneration:true,solutionStates:true,moveBasedSolutions:true,auditTransforms:true,invalidStateSanitization:true,allVariantsDiffer:true,milliseconds:Date.now()-started};
fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../test-results/depth-model-v4.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
