"""V4 penalties, hint cap, backup import, legacy compatibility and safe text tests.
Uses normal UI/controller calls; deliberately sets a small number of fixtures for
specific corner cases. about:blank has a test-only storage shim, not real hosting.
"""
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, browser_options
import json, time
results=[]
def log(name,value=True):
 print(name,json.dumps(value,ensure_ascii=False),flush=True);results.append({'test':name,'result':value})
with sync_playwright() as pw:
 opts=browser_options();opts.setdefault('executable_path','/usr/bin/chromium');b=pw.chromium.launch(**opts)
 p=b.new_page(viewport={'width':1280,'height':1000});p.set_default_timeout(15000);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.set_content(inline_html(storage=True),wait_until='load');p.wait_for_function('!!Depth && !!SW.app')
 p.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.reduceMotion=true;SW.app.prefs.quality="low"')
 def click(s):p.locator(s+':visible').first.click()
 def close():
  if p.evaluate('!!Ward.modal'):click('.modal-close')
 def start(ch,level,mode='challenge'):
  if p.evaluate('Ward.phase')!='title':p.evaluate('Ward.returnTitle()')
  click(f'[data-campaign="select"][data-chapter="{ch}"]');click(f'[data-depth="level"][data-level="{level}"]')
  p.locator('#depthSeed').fill('STATE-0117');click(f'[data-mode="{mode}"]');click('[data-action="start"]')
  if p.locator('[data-action="new-confirm"]:visible').count():click('[data-action="new-confirm"]')
  p.wait_for_function('Ward.phase==="playing"');p.evaluate('SW.app.setView("investigate",false)')
 def records0():
  p.evaluate('Depth.readRecord("l0")');close();p.evaluate('Depth.readRecord("s0")');close()
 for level,cost,minutes in [('abyss',25,36),('nightmare',45,42)]:
  start('hospital',level);assert p.evaluate('Ward.state.duration')==minutes*60;records0();p.evaluate('Depth.openAnalysis(0)')
  wrong=p.evaluate('Ward.state.stats.wrong');before=p.evaluate('Ward.state.remaining');click('#depthPuzzleForm button[type="submit"]')
  assert p.evaluate('Ward.state.stats.wrong')==wrong;assert before-p.evaluate('Ward.state.remaining')<4;log(level+' incomplete does not penalize')
  answer=p.evaluate('Depth.puzzles()[0].answer');bad=answer[::-1]
  for i in bad:click(f'[data-depth="choose"][data-index="{i}"]')
  before=p.evaluate('Ward.state.remaining');click('#depthPuzzleForm button[type="submit"]');delta=before-p.evaluate('Ward.state.remaining')
  assert cost-.5<=delta<cost+4,delta;assert p.evaluate('Ward.state.stats.wrong')==wrong+1;log(level+' incorrect penalty',round(delta,2))
  assert p.evaluate('Ward.state.depth.echo')>0;assert not p.evaluate('Ward.prefs.scares')
  # Missing hints do not silently provide an answer in nightmare.
  click('[data-depth="hint"]');before=p.evaluate('Ward.state.remaining');click('[data-depth="reveal"]');delta=before-p.evaluate('Ward.state.remaining');hint_cost=40 if level=='abyss' else 60
  assert hint_cost-.5<=delta<hint_cost+4,delta;log(level+' new hint penalty',round(delta,2));click('[data-depth="reveal"]')
  assert p.evaluate('Ward.state.depth.hintSpent')==2
  if level=='nightmare':assert not p.locator('[data-depth="reveal"]:visible').count()
  close();before=p.evaluate('Ward.state.remaining');p.evaluate('Depth.openHint({kind:"analysis",index:0,key:"analysis0",title:"测试",desc:""})')
  assert p.evaluate('Ward.state.depth.hintSpent')==2;assert before-p.evaluate('Ward.state.remaining')<4;log(level+' rereading hints is free')
  close()
  # Explicit test fixture for remaining-token boundary, with actual reveal button.
  if level=='nightmare':
   p.evaluate('Ward.state.depth.hintSpent=5;Depth.openHint({kind:"analysis",index:1,key:"analysis1",title:"额度边界",desc:""})')
   click('[data-depth="reveal"]');assert p.evaluate('Ward.state.depth.hintSpent')==6;assert not p.locator('[data-depth="reveal"]:visible').count();close()
   p.evaluate('Depth.openHint({kind:"audit",index:0,key:"audit0",title:"额度耗尽",desc:""})');assert not p.locator('[data-depth="reveal"]:visible').count();close();log('Nightmare 6-token hard cap across targets')
   p.evaluate('walkthrough()');assert '进行中不开放内置完整攻略' in p.locator('#modalBody').inner_text();close();log('Nightmare in-run walkthrough restriction')
  # Exact state restoration includes unsubmitted order, seed, hints and echo.
  p.evaluate('Depth.openBoard()');p.locator('#depthScratch').fill('A = 7\n<script>window.__unsafe=true</script>\n</textarea><img src=x onerror="window.__unsafe=true">')
  assert not p.evaluate('!!window.__unsafe');close()
  p.evaluate('Ward.saveGame()');before=p.evaluate('JSON.stringify(Ward.state.depth)');click('#gameScreen [data-action="pause"]')
  timer=p.evaluate('Ward.state.remaining');p.wait_for_timeout(750);assert p.evaluate('Ward.state.remaining')==timer;click('[data-action="title"]')
  snapshot=p.evaluate('JSON.parse(JSON.stringify(Campaign.profile))');p.evaluate('(data)=>Campaign.restoreBackup(data)',snapshot);click('[data-action="continue"]');p.wait_for_function('Ward.phase==="playing"')
  assert p.evaluate('JSON.stringify(Ward.state.depth)')==before;assert p.evaluate('Ward.state.remaining')>12*60
  p.evaluate('Depth.openBoard()');assert '<script>' in p.locator('#depthScratch').input_value();assert not p.evaluate('!!window.__unsafe');close();log(level+' backup round-trip incl. long timer, scratch escaping and pending inputs')
 # Export through the actual download action, then import JSON through file selector.
 p.evaluate('Ward.returnTitle()');click('[data-campaign="archive"]')
 with p.expect_download() as dl:click('[data-campaign="export"]')
 download=dl.value;backup=OUT/'v4-test-backup.json';download.save_as(backup);data=json.loads(backup.read_text());assert data['version']==3 and data['runs']['hospital']['depth'];log('Actual JSON backup download')
 close();click('[data-campaign="archive"]');p.locator('#campaignImport').set_input_files(str(backup));p.wait_for_selector('[data-campaign="import-confirm"]');click('[data-campaign="import-confirm"]');assert p.evaluate('Campaign.profile.runs.hospital.depth.level')=='nightmare';log('Actual JSON file import with confirmation')
 # Old saves lack depth, continue in classic even if the menu has high difficulty selected.
 legacy=json.loads(json.dumps(data));legacy['runs']['hospital'].pop('depth');legacy['runs']['hospital']['remaining']=650;legacy['runs']['hospital'].pop('duration',None)
 p.evaluate('(v)=>Campaign.restoreBackup(v)',legacy);click('[data-action="continue"]');p.wait_for_function('Ward.phase==="playing"');assert not p.evaluate('Depth.enabled()');assert not p.evaluate('!!Ward.state.depth');log('v3 save continues classic without new gates')
 # Input sanitization and chapter isolation.
 p.evaluate('Ward.returnTitle()');corrupt=json.loads(json.dumps(data));v=corrupt['runs']['hospital']['depth'];v['ui']['0']={'chosen':[999,-8]};v['seed']='<script>BAD</script>';v['scratch']='x'*7000;v['echo']=999;v['read']=['l0','l0','unknown'];
 p.evaluate('(v)=>Campaign.restoreBackup(v)',corrupt);click('[data-action="continue"]');p.wait_for_function('Ward.phase==="playing"')
 assert p.evaluate('Ward.state.depth.ui[0].chosen.length')==0;assert p.evaluate('Ward.state.depth.scratch.length')==6000;assert p.evaluate('Ward.state.depth.echo')==100;assert p.evaluate('Ward.state.depth.read')==['l0'];assert '<' not in p.evaluate('Ward.state.depth.seed');log('Malformed deep inputs are bounded and sanitized')
 p.evaluate('Ward.returnTitle()');hospital=p.evaluate('JSON.stringify(Campaign.profile.runs.hospital)');start('metro','abyss','explore');assert p.evaluate('JSON.stringify(Campaign.profile.runs.hospital)')==hospital;log('New chapter does not overwrite hospital slot')
 # Infinite mode still runs high-difficulty mechanics without a hidden countdown.
 before=p.evaluate('Ward.state.remaining');p.wait_for_timeout(500);assert p.evaluate('Ward.state.remaining')==before;assert p.evaluate('Depth.enabled()');log('High complexity independent of timer')
 p.evaluate('Ward.returnTitle()');start('astro','nightmare');p.evaluate('Ward.state.remaining=.05');p.wait_for_function('Ward.phase==="ending"');assert 'ENDING C' in p.locator('#endingScreen').inner_text();assert '记录中断' in p.locator('.depth-ending').inner_text();log('High-difficulty timeout ends safely')
 assert not errors,errors;log('No page errors',errors)
 (OUT/'depth-state-v4.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));b.close()
