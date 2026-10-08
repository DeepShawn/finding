"""V4 classic-mode regression: original UI flow, reachability and save isolation.
Runs against the production single-file build on about:blank (test storage shim).
"""
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, browser_options
import json, os
results=[]
def log(name,value=True):
 print(name,json.dumps(value,ensure_ascii=False),flush=True);results.append({'test':name,'result':value})
with sync_playwright() as pw:
 b=pw.chromium.launch(**browser_options());page=b.new_page(viewport={'width':1360,'height':960});page.set_default_timeout(12000)
 errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content(inline_html(storage=True),wait_until='load');page.wait_for_function('!!SW.app && SW.app.frame>1')
 log('Renderer availability',{'webgl':page.evaluate('!!SW.app.renderer'),'error':page.evaluate('String(SW.app.renderError)')})
 page.evaluate('Depth.setLevel("classic")')
 page.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.reduceMotion=true;SW.app.prefs.quality="low"')
 def click(s):page.locator(s+":visible").first.click()
 def close():
  if page.evaluate('!!Ward.modal'):click('.modal-close')
 def enter(r):
  close();click(f'#roomNav [data-room="{r}"]')
  if page.locator('[data-action="unlock-room"]').count():click('[data-action="unlock-room"]')
  page.wait_for_function('(r)=>Ward.state.room===r && SW.app.room===r',arg=r)
 def inspect(i):click(f'#hotspots [data-id="{i}"]')
 def reach():
  data=page.evaluate('SW.app.world.hotspots.map(h=>({id:h.id,route:SW.app.pathTo(h.pos[0],h.pos[2],true).length}))')
  bad=[x for x in data if not x['route']];log('reach '+page.evaluate('Ward.state.room'),data)
  assert not bad,bad
 def start(ch):
  if page.evaluate('Ward.phase')!='title':page.evaluate('Ward.returnTitle()')
  click(f'[data-campaign="select"][data-chapter="{ch}"]');click('[data-mode="explore"]');click('[data-action="start"]')
  if page.locator('[data-action="new-confirm"]').count():click('[data-action="new-confirm"]')
  page.wait_for_function('Ward.phase==="playing"');page.evaluate('SW.app.setView("investigate",false)')
  page.wait_for_function('SW.app.room===Ward.state.room')
 def oldcode(code):page.locator('#codeInput').fill(code);click('#codeForm button[type="submit"]')
 # Original chapter is still completed through its original interface.
 start('hospital');reach()
 for i in ['shift','calendar','phone']:inspect(i);close()
 inspect('drawer');oldcode('1103');enter('ward');reach()
 for i in ['symbols','chart','mirror']:inspect(i);close()
 inspect('locker');oldcode('2479');enter('archive');reach()
 for i in ['rules','photo']:inspect(i);close()
 inspect('safe')
 for i in ['medicine','blood','rounds','lights']:click(f'[data-action="add-file"][data-id="{i}"]')
 click('[data-action="check-archive"]');enter('power');reach();inspect('fuse');click('[data-action="install-fuse"]');close();inspect('circuit');click('[data-action="reset-circuit"]')
 for i,n in enumerate([1,1,2,1,1,2,1,1,1]):
  for _ in range(n):click(f'[data-action="rotate"][data-index="{i}"]')
 click('[data-action="check-circuit"]');enter('exit');reach();inspect('gate');oldcode('4297');close();inspect('door');click('[data-action="escape"]')
 assert page.evaluate('Campaign.profile.records.hospital.truth');log('Hospital original full UI + evidence')
 chapters=page.evaluate('CAMPAIGN_DATA')
 for c in chapters:
  start(c['id'])
  click(f'#roomNav [data-room="{c["rooms"][1]["id"]}"]');assert page.evaluate('Ward.state.room')==c['rooms'][0]['id'];close();log('Gate enforced '+c['id'])
  for ri,r in enumerate(c['rooms']):
   if ri:enter(r['id'])
   reach();p=r['puzzle'];pid=p['id']
   for ni in range(2):inspect(pid+'_clue'+str(ni));close()
   if r.get('evidence'):inspect(pid+'_evidence');close()
   inspect(pid);t=p['type']
   if t=='code':page.locator('#campaignCode').fill(p['answer'].lower())
   elif t in ['order','memory']:
    if t=='memory':
     click('[data-pc="play"]');page.wait_for_function('document.querySelector("#memoryStatus").textContent.includes("复现结束")',timeout=10000)
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
   # Every puzzle state is serialized before verification, not just final solutions.
   close();before=page.evaluate('JSON.stringify(Ward.state.puzzleState)');click('#gameScreen [data-action="pause"]');assert page.evaluate('Ward.paused');click('[data-action="title"]');click('[data-action="continue"]');page.wait_for_function('Ward.phase==="playing"');assert page.evaluate('JSON.stringify(Ward.state.puzzleState)')==before
   inspect(pid);click('#campaignPuzzleForm button[type="submit"]');assert page.evaluate('(id)=>!!Ward.state.solved[id]',pid),pid
   assert page.evaluate('Ward.state.stats.wrong')==0;log('Solved '+pid,t)
   close()
   # Render each room in both spatial views as well as investigation.
   snapshot=page.evaluate('JSON.stringify(Ward.state.solved)')
   for view in ['3d','2d','investigate']:
    page.evaluate('(v)=>SW.app.setView(v,false)',view);page.wait_for_timeout(110)
    assert page.evaluate('JSON.stringify(Ward.state.solved)')==snapshot
  inspect(c['rooms'][-1]['puzzle']['id']+'_exit');click('[data-action="escape"]');assert page.evaluate('(id)=>Campaign.profile.records[id].truth',c['id']);log('Chapter complete + 3 evidence '+c['id'])
 assert page.evaluate('Object.values(Campaign.profile.records).filter(x=>x.truth).length')==5
 click('[data-campaign="archive"]');assert '电话最后响了一次' in page.locator('#modalBody').inner_text();log('Five full evidence chains unlock global epilogue')
 close();page.evaluate('Ward.returnTitle()');click('[data-campaign="select"][data-chapter="metro"]');click('[data-mode="challenge"]');click('[data-action="start"]');page.wait_for_function('Ward.phase==="playing"');page.evaluate('SW.app.setView("investigate",false)')
 inspect('cx_metro_1');page.locator('#campaignCode').fill('0000');before=page.evaluate('Ward.state.remaining');click('#campaignPuzzleForm button[type="submit"]');after=page.evaluate('Ward.state.remaining');assert 9.8<before-after<12;log('Extra puzzle incorrect verification penalty -10')
 close();click('[data-action="hint"]');before=page.evaluate('Ward.state.remaining');click('[data-action="reveal-hint"]');assert 19.8<before-page.evaluate('Ward.state.remaining')<22;log('Chapter hints penalty -20')
 close();page.evaluate('Ward.returnTitle()');run=page.evaluate('JSON.stringify(Campaign.profile.runs.metro)');click('[data-campaign="select"][data-chapter="abyss"]');click('[data-mode="explore"]');click('[data-action="start"]');page.wait_for_function('Ward.phase==="playing"');page.evaluate('Ward.returnTitle()');assert page.evaluate('JSON.stringify(Campaign.profile.runs.metro)')==run;assert page.evaluate('!!Campaign.profile.runs.abyss');log('Chapter saves do not overwrite one another')
 click('[data-campaign="select"][data-chapter="metro"]');click('[data-action="continue"]');page.wait_for_function('Ward.phase==="playing"');page.evaluate('Ward.state.remaining=.1');page.wait_for_function('Ward.phase==="ending"');assert 'ENDING C' in page.locator('#endingScreen').inner_text();assert page.evaluate('!!Campaign.profile.runs.abyss');assert page.evaluate('Campaign.profile.records.metro.truth');log('Timeout preserves other chapter save + previously completed evidence')
 log('Page errors',errors);assert not errors
 (OUT/'classic-flow-v4.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));b.close()
