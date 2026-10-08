#!/usr/bin/env node
/* Explicit developer/spoiler CLI. Not included in the deployed site. */
'use strict';
const M=require('../src/depth-model.js');
const [chapter,level,seed]=process.argv.slice(2);
if(!M.CATALOG[chapter]||!['abyss','nightmare'].includes(level)||!M.cleanSeed(seed)){
 console.error('Usage: node tools/explain_seed.cjs <hospital|metro|orphan|abyss|astro> <abyss|nightmare> <seed>');
 process.exitCode=1;
}else{
 console.log(`SPOILERS / ${chapter} / ${level} / ${M.cleanSeed(seed)}\n`);
 for(let i=0;i<5;i++){
  const p=M.generate(chapter,i,level,seed);
  console.log(`${i+1}. ${p.title} [${p.type}]\n${M.solutionText(p)}\n分析回执：${p.receipt}\n复核结果：${p.audit.answer}\n`);
 }
}
