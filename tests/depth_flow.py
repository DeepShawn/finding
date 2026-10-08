"""V4 UI regression. Production offline build, Chromium, about:blank + storage shim.
Run: SW_BROWSER=/usr/bin/chromium python tests/depth_flow.py [chapter] [abyss|nightmare]
Each new and original puzzle is solved through actual UI controls, not solved flags.
The model supplies test answers; this is not a human difficulty/play-time study.
"""
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, browser_options
from pathlib import Path
import json, sys, time
CHAPTERS=['hospital','metro','orphan','abyss','astro']
requested=[sys.argv[1]] if len(sys.argv)>1 else CHAPTERS
levels=[sys.argv[2]] if len(sys.argv)>2 else ['abyss','nightmare']
results=[];t0=time.time()
def log(name,detail=True):
 print(name,json.dumps(detail,ensure_ascii=False),flush=True);results.append({'test':name,'result':detail})
with sync_playwright() as pw:
 opts=browser_options();opts.setdefault('executable_path','/usr/bin/chromium');b=pw.chromium.launch(**opts)
 page=b.new_page(viewport={'width':1440,'height':1080});page.set_default_timeout(15000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_html(storage=True),wait_until='load');page.wait_for_function('!!window.Depth && !!SW.app')
 page.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.quality="low";SW.app.prefs.reduceMotion=true')
 log('Renderer availability',{'webgl':page.evaluate('!!SW.app.renderer'),'error':page.evaluate('String(SW.app.renderError)')})
 def click(s):page.locator(s+':visible').first.click()
 def close():
  if page.evaluate('!!Ward.modal'):click('.modal-close')
 def enter(room):
  close();click(f'#roomNav [data-room="{room}"]')
  if page.locator('[data-action="unlock-room"]:visible').count():click('[data-action="unlock-room"]')
  page.wait_for_function('(r)=>Ward.state.room===r',arg=room)
 def inspect(id):click(f'#hotspots [data-id="{id}"]')
 def start(ch,level):
  if page.evaluate('Ward.phase')!='title':page.evaluate('Ward.returnTitle()')
  click(f'[data-campaign="select"][data-chapter="{ch}"]');click(f'[data-depth="level"][data-level="{level}"]')
  page.locator('#depthSeed').fill('UI-TEST-0117');click('[data-mode="explore"]');click('[data-action="start"]')
  if page.locator('[data-action="new-confirm"]:visible').count():click('[data-action="new-confirm"]')
  page.wait_for_function('Ward.phase==="playing"');page.evaluate('SW.app.setView("investigate",false)')
 def solve_deep(p):
  typ=p['type'];a=p['answer']
  if typ=='order':
   for i in a:click(f'[data-depth="choose"][data-index="{i}"]')
  elif typ=='identity':
   for key in ['badges','places']:
    for i,v in enumerate(a[key]):page.locator(f'[data-depth-select="{key}"][data-index="{i}"]').select_option(str(v))
  elif typ=='cipher':page.locator('#depthCode').fill(a)
  elif typ=='nonogram':
   for i,v in enumerate(a):
    for _ in range(1 if v else 2):click(f'[data-depth="cell"][data-index="{i}"]')
  elif typ=='lights':
   for i in p['presses']:click(f'[data-depth="light"][data-index="{i}"]')
  elif typ=='linked':
   for i,n in enumerate(p['presses']):
    for _ in range(n):click(f'[data-depth="link"][data-index="{i}"]')
  elif typ=='route':
   for i in a[1:]:click(f'[data-depth="route"][data-index="{i}"]')
  elif typ=='equations':
   for i,n in enumerate(a):
    for _ in range(n):click(f'[data-depth="plus"][data-index="{i}"]')
  elif typ=='testimony':
   for i,v in enumerate(a):
    for _ in range(1 if v else 2):click(f'[data-depth="truth"][data-index="{i}"]')
 def solve_campaign(p):
  t=p['type']
  if t=='code':page.locator('#campaignCode').fill(p['answer'].lower())
  elif t in ['order','memory']:
   for i in p['answer']:click(f'[data-pc="choose"][data-index="{i}"]')
  elif t=='lights':
   for i in p['presses']:click(f'[data-pc="light"][data-index="{i}"]')
  elif t in ['dials','mix']:
   for i,n in enumerate(p['answer']):
    for _ in range(n):click(f'[data-pc="dial"][data-index="{i}"]')
  elif t=='balance':
   for i in p['answer']:click(f'[data-pc="weight"][data-index="{i}"]')
  elif t=='linked':
   for i,n in enumerate(p['presses']):
    for _ in range(n):click(f'[data-pc="link"][data-index="{i}"]')
  elif t=='route':
   for i in p['answer'][1:]:click(f'[data-pc="route"][data-index="{i}"]')
  click('#campaignPuzzleForm button[type="submit"]')
 def oldcode(code):page.locator('#codeInput').fill(code);click('#codeForm button[type="submit"]')
 def solve_hospital(i):
  if i==0:oldcode('1103')
  elif i==1:oldcode('2479')
  elif i==2:
   for label in ['medicine','blood','rounds','lights']:click(f'[data-action="add-file"][data-id="{label}"]')
   click('[data-action="check-archive"]')
  elif i==3:
   # OpenFuse may be the base inspect result if no fuse has yet been installed.
   close();inspect('fuse');click('[data-action="install-fuse"]');click('#modalBody [data-action="inspect"][data-id="circuit"]');click('[data-action="reset-circuit"]')
   for j,n in enumerate([1,1,2,1,1,2,1,1,1]):
    for _ in range(n):click(f'[data-action="rotate"][data-index="{j}"]')
   click('[data-action="check-circuit"]')
  else:oldcode('4297')
 def audit(i,main,p):
  inspect(main);click(f'[data-depth="audit"][data-index="{i}"]');assert page.evaluate('Ward.modal')=='depth-audit'
  page.locator('#depthAuditCode').fill(p['audit']['answer']);click('#depthAuditForm button[type="submit"]')
  assert page.evaluate('(i)=>Ward.state.depth.audits[i]',i);close()
 for level in levels:
  for ch in requested:
   start(ch,level);c=page.evaluate('Campaign.current()');ps=page.evaluate('Depth.puzzles()')
   rs=[r['id'] for r in c['rooms']];mains=['drawer','locker','safe','circuit','gate'] if ch=='hospital' else [r['puzzle']['id'] for r in c['rooms']]
   sources=['shift','symbols','rules','warning','door'] if ch=='hospital' else [p+'_clue0' for p in mains]
   originals=[['shift','calendar','phone'],['symbols','chart','mirror'],['rules','photo'],['warning'],[]] if ch=='hospital' else [[m+'_clue0',m+'_clue1']+([m+'_evidence'] if c['rooms'][i].get('evidence') else []) for i,m in enumerate(mains)]
   # Future-room gate and analysis gate cannot be skipped through ordinary controls.
   click(f'#roomNav [data-room="{rs[4]}"]');assert page.evaluate('Ward.state.room')==rs[0];close()
   inspect(mains[0]);assert page.locator('.depth-prereq').count();close()
   for i,room in enumerate(rs):
    if i:enter(room)
    for note in originals[i]:inspect(note);close()
    inspect(sources[i]);click(f'[data-depth="record"][data-key="l{i}"]');close()
    if i:enter(rs[i-1])
    inspect(sources[max(0,i-1)]);click(f'[data-depth="record"][data-key="s{i}"]');close()
    if i:
     audit(i-1,mains[i-1],ps[i-1]);enter(room)
    inspect(mains[i]);assert page.evaluate('Ward.modal')=='depth-puzzle';assert not page.locator('.depth-prereq').count()
    solve_deep(ps[i]);
    # Round-trip every in-progress analytical state through pause, title, and continue.
    close();before=page.evaluate('JSON.stringify(Ward.state.depth)');click('#gameScreen [data-action="pause"]');click('[data-action="title"]');click('[data-action="continue"]');page.wait_for_function('Ward.phase==="playing"');assert page.evaluate('JSON.stringify(Ward.state.depth)')==before
    inspect(mains[i]);click('#depthPuzzleForm button[type="submit"]');assert page.evaluate('(i)=>Ward.state.depth.analysed[i]',i)
    click(f'[data-depth="base"][data-index="{i}"]')
    if ch=='hospital':solve_hospital(i)
    else:solve_campaign(c['rooms'][i]['puzzle'])
    close();assert page.evaluate('(i)=>!!Ward.state.solved[Ward.stages[i].key]',i)
    assert page.evaluate('Ward.state.stats.wrong')==0
    log(f'{level}:{ch}:area-{i+1}',{'analysis':ps[i]['type'],'baseSolved':True,'previousAudit':i>0,'restoredInput':True})
    # Views share the exact same underlying state; unsupported WebGL safely falls back.
    before=page.evaluate('JSON.stringify(Ward.state.depth)')
    for view in ['2d','3d','investigate']:
     page.evaluate('(v)=>SW.app.setView(v,false)',view);page.wait_for_timeout(60);assert page.evaluate('JSON.stringify(Ward.state.depth)')==before
   assert page.evaluate('Depth.count()')==14
   door='door' if ch=='hospital' else mains[-1]+'_exit'
   inspect(door);click('[data-action="escape"]');assert page.evaluate('Ward.phase')=='playing';assert page.evaluate('Ward.modal')=='depth-blocked';close()
   enter(rs[0]);inspect(sources[0]);click('[data-depth="record"][data-key="f"]');close();enter(rs[4]);audit(4,mains[4],ps[4]);assert page.evaluate('Depth.count()')==15
   inspect(door);click('[data-action="escape"]');assert page.evaluate('Ward.phase')=='ending'
   rec=page.evaluate('(id)=>Campaign.profile.records[id]',ch);assert rec['truth'] and rec['depthClears']>0
   if level=='nightmare':assert rec['nightmareClears']>0
   assert '无援助完整闭环' in page.locator('#endingScreen').inner_text()
   log(f'{level}:{ch}:full-clear',{'record':rec,'nodes':15,'finalGateEnforced':True,'pagesErrors':len(errors)})
 assert not errors,errors
 log('No JavaScript page errors',errors);log('Duration seconds',round(time.time()-t0,1))
 (OUT/('depth-flow-'+('-'.join(requested) if len(requested)<5 else 'all')+'-'+('-'.join(levels))+'.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2))
 b.close()
