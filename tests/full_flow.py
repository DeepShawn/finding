"""Browser regression checks; see README.md for environment and limits."""
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, browser_options
from pathlib import Path
import json,time
results=[]
def log(name,data=True):
 print(name,json.dumps(data,ensure_ascii=False),flush=True);results.append({'test':name,'result':data})
with sync_playwright() as p:
 b=p.chromium.launch(**browser_options())
 page=b.new_page(viewport={'width':1280,'height':900},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_html(storage=True),wait_until='load');page.wait_for_function('SW.app?.frame>1')
 assert page.evaluate('!!SW.app.renderer'),page.evaluate('String(SW.app.renderError)')
 page.evaluate('Ward.setPref("scares",false);Ward.setPref("sound",false);SW.app.prefs.reduceMotion=true;SW.app.prefs.quality="low";SW.app.setView("3d",false)')
 log('WebGL2 compiled and rendered',page.evaluate('SW.app.renderer.stats'))
 def click(sel):page.locator(sel).first.click(timeout=30000)
 def close():
  if page.evaluate('!!Ward.modal'):click('.modal-close')
 def act(action,extra=''):click(f'[data-action="{action}"]{extra}')
 def inspect(id):click(f'#hotspots [data-id="{id}"]')
 def code(value):page.locator('#codeInput').fill(value);click('#codeForm button[type="submit"]')
 def enter(id):
  close();click(f'#roomNav [data-room="{id}"]');
  if page.locator('[data-action="unlock-room"]').count():act('unlock-room')
  page.wait_for_function('(id)=>Ward.state.room===id && SW.app.room===id',arg=id)
  page.wait_for_timeout(280)
 def reach():
  data=page.evaluate('SW.app.world.hotspots.map(h=>({id:h.id,length:SW.app.pathTo(h.pos[0],h.pos[2],true).length}))')
  assert all(x['length']>0 for x in data),data
  log('Reachable hotspots: '+page.evaluate('Ward.state.room'),data)
 # Actual menu controls.
 click('[data-action="mode"][data-mode="explore"]');act('start');page.wait_for_function('Ward.phase==="playing" && SW.app.room==="station"');page.wait_for_timeout(350)
 log('New-game pose and shared state',page.evaluate('({room:SW.app.room,positions:Ward.state.worldPositions,mode:Ward.state.mode})'))
 assert page.evaluate('!Ward.state.worldPositions.exit')
 click('.view-switch [data-view="2d"]');page.wait_for_timeout(180)
 reach()
 # Actual 2D automatic navigation, not teleportation. Walk from spawn to drawer.
 click('[data-world="drawer"]');page.wait_for_function('Ward.modal==="keypad"',timeout=18000)
 log('2D click-to-walk and investigate drawer',page.evaluate('SW.app.player.pos'))
 close();click('.view-switch [data-view="investigate"]')
 # Locked gate checks
 click('#roomNav [data-room="ward"]');assert page.evaluate('Ward.state.room')=='station';assert not page.locator('[data-action="unlock-room"]').count();close();log('Locked ward is enforced')
 inspect('shift');close();inspect('calendar');close();inspect('phone');close();inspect('drawer');code('1103')
 assert page.evaluate('Ward.state.solved.drawer && Ward.state.inventory.includes("wardKey")')
 enter('ward');reach();inspect('symbols');close();inspect('chart');close();inspect('mirror');close();inspect('locker');code('2479')
 assert page.evaluate('Ward.state.solved.locker')
 enter('archive');reach();inspect('rules');close();inspect('photo');close();inspect('safe')
 for id in ['medicine','blood','rounds','lights']:click(f'[data-action="add-file"][data-id="{id}"]')
 act('check-archive');assert page.evaluate('Ward.state.solved.safe && Ward.state.inventory.includes("fuse")')
 enter('power');reach();inspect('warning');close();inspect('fuse');act('install-fuse');close();inspect('circuit');act('reset-circuit')
 for i,n in enumerate([1,1,2,1,1,2,1,1,1]):
  for _ in range(n):click(f'[data-action="rotate"][data-index="{i}"]')
 act('check-circuit');assert page.evaluate('Ward.state.solved.power')
 enter('exit');reach();inspect('map');close();inspect('gate');code('4297');assert page.evaluate('Ward.state.solved.exit')
 log('Five-puzzle full UI progression',page.evaluate('({solved:Ward.state.solved,evidence:Ward.state.evidence,notes:Ward.state.notes.length})'))
 close();snapshot=page.evaluate('JSON.stringify(Ward.state.solved)')
 for view in ['3d','2d','investigate']:click(f'.view-switch [data-view="{view}"]');page.wait_for_timeout(220);assert page.evaluate('JSON.stringify(Ward.state.solved)')==snapshot
 log('Three views preserve solved state')
 # save-and-continue through normal buttons; localStorage is test shim (about:blank).
 act('pause');assert page.evaluate('Ward.paused');frozen=page.evaluate('Ward.state.elapsed');page.wait_for_timeout(350);assert page.evaluate('Ward.state.elapsed')==frozen
 act('title');page.wait_for_function('Ward.phase==="title"');act('continue');page.wait_for_function('Ward.phase==="playing"');assert page.evaluate('Ward.state.evidence.length')==3;assert page.evaluate('Ward.state.solved.exit');log('Pause and serialized save/continue')
 page.wait_for_timeout(300);inspect('door');act('escape');page.wait_for_function('Ward.phase==="ending"');assert 'ENDING S' in page.locator('#endingScreen').inner_text();log('True ending S')
 # Missing-evidence ending branch; harness removes evidence from an otherwise normally solved run.
 page.evaluate('Ward.startGame("explore");Ward.state.solved.exit=true;Ward.state.evidence=[];Ward.inspect("door")');act('escape');assert 'ENDING A' in page.locator('#endingScreen').inner_text();log('Ending A branch (fixture setup)')
 # Real time and penalties with a challenge fixture.
 page.evaluate('Ward.startGame("challenge");SW.app.setView("investigate",false)');page.wait_for_timeout(300)
 inspect('drawer');before=page.evaluate('Ward.state.remaining');code('0000');after=page.evaluate('Ward.state.remaining');assert 9.9<before-after<12;assert page.evaluate('Ward.state.stats.wrong')==1;close()
 act('hint');before=page.evaluate('Ward.state.remaining');act('reveal-hint');after=page.evaluate('Ward.state.remaining');assert 19.9<before-after<22;close()
 log('Challenge incorrect answer -10 and new hint -20')
 click('#gameScreen [data-shell="settings"]');assert page.evaluate('Ward.paused');frozen=page.evaluate('Ward.state.remaining');page.wait_for_timeout(500);assert page.evaluate('Ward.state.remaining')==frozen
 page.locator('[data-setting="quality"]').select_option('low');page.locator('[data-setting="reduceMotion"]').check();act('resume');assert not page.evaluate('Ward.paused');log('Settings pause and apply')
 # Collision via actual keyboard, including wall limits.
 click('.view-switch [data-view="2d"]');page.evaluate('SW.app.resetPosition()');page.keyboard.down('s');page.wait_for_timeout(1800);page.keyboard.up('s');pos=page.evaluate('SW.app.player.pos');assert pos[2]<=7.15;assert page.evaluate('SW.app.canStand(SW.app.player.pos[0],SW.app.player.pos[2])');log('Movement and boundary collision',pos)
 page.evaluate('Ward.state.remaining=.12');page.wait_for_function('Ward.phase==="ending"');assert 'ENDING C' in page.locator('#endingScreen').inner_text();log('Ending C timeout')
 log('Page errors',errors);assert not errors
 (OUT / 'test-results-v2.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 b.close()
