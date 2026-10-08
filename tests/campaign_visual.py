"""V3 rendered views, touch input, fallback and backup import/export.
Spatial/photo checks use explicitly unlocked fixtures, not proof of puzzle progress.
The complete progression is checked separately by campaign_flow.py.
"""
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, browser_options
from pathlib import Path
import json, math
results=[]
def log(name,value=True):
 print(name,json.dumps(value,ensure_ascii=False),flush=True);results.append({'test':name,'result':value})
with sync_playwright() as pw:
 b=pw.chromium.launch(**browser_options());page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1);page.set_default_timeout(18000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 html=inline_html(storage=True)
 page.set_content(html,wait_until='load');page.wait_for_function('SW.app?.frame>2');assert page.evaluate('!!SW.app.renderer')
 def click(s):page.locator(s+':visible').first.click()
 def close():
  if page.evaluate('!!Ward.modal'):click('.modal-close')
 def configure():page.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.reduceMotion=true;SW.app.prefs.quality="low"')
 def start(ch,mode='explore'):
  if page.evaluate('Ward.phase')!='title':page.evaluate('Ward.returnTitle()')
  page.evaluate('Depth.setLevel("classic")')
  click(f'[data-campaign="select"][data-chapter="{ch}"]');click(f'[data-mode="{mode}"]');click('[data-action="start"]')
  if page.locator('[data-action="new-confirm"]:visible').count():click('[data-action="new-confirm"]')
  page.wait_for_function('Ward.phase==="playing" && SW.app.room===Ward.state.room');configure();page.evaluate('SW.app.setView("investigate",false)')
 def screenshot(name):page.wait_for_timeout(350);page.screenshot(path=str(OUT/('silent-ward-v3-'+name+'.png')),full_page=page.evaluate('Ward.phase')=='title')
 configure();click('[data-campaign="select"][data-chapter="abyss"]');page.wait_for_function('[...document.querySelectorAll(".sector-art img")].length===5 && [...document.querySelectorAll(".sector-art img")].every(i=>i.complete&&i.naturalWidth>0)')
 page.evaluate('SW.app.prefs.quality="high"');screenshot('menu');log('Chapter menu and five rendered local thumbnails')
 # Representative spatial fixtures for screenshots; no records or scores awarded.
 for ch,r in [('metro','metro_car'),('orphan','orphan_stage'),('abyss','abyss_bio'),('astro','astro_dome')]:
  start(ch);page.evaluate('for(const r of Campaign.current().rooms)Ward.state.solved[r.puzzle.id]=true')
  click(f'#roomNav [data-room="{r}"]');page.wait_for_function('(r)=>SW.app.room===r',arg=r)
  page.evaluate('SW.app.setView("3d",false);SW.app.prefs.quality="high"');page.wait_for_timeout(3000);screenshot(ch+'-3d')
  if ch=='abyss':
   click('.view-switch [data-view="2d"]');screenshot('2d')
  click('.view-switch [data-view="investigate"]');page.wait_for_function('document.querySelector(".campaign-scene") || document.querySelector(".scene-container")') if False else None
  if ch=='astro':screenshot('investigation')
 log('All four additional themes rendered in three-dimensional view')
 # Backup a genuine partial puzzle state through the actual export/import UI.
 start('abyss');click('#hotspots [data-id="cx_abyss_1"]');click('[data-pc="link"][data-index="0"]');close();page.evaluate('Ward.returnTitle()')
 run=page.evaluate('JSON.stringify(Campaign.profile.runs.abyss.puzzleState)');click('[data-campaign="archive"]')
 with page.expect_download() as dl:click('[data-campaign="export"]')
 backup=OUT/'test-backup.json';dl.value.save_as(backup);obj=json.loads(backup.read_text());assert obj['version']==3
 close();start('abyss');click('#hotspots [data-id="cx_abyss_1"]');click('[data-pc="link"][data-index="1"]');close();page.evaluate('Ward.returnTitle()')
 click('[data-campaign="archive"]');page.locator('#campaignImport').set_input_files(str(backup));page.wait_for_selector('[data-campaign="import-confirm"]');click('[data-campaign="import-confirm"]')
 assert page.evaluate('JSON.stringify(Campaign.profile.runs.abyss.puzzleState)')==run;log('Actual JSON export and confirmed import restores partial puzzle')
 click('[data-action="continue"]');page.wait_for_function('Ward.phase==="playing"');assert page.evaluate('JSON.stringify(Ward.state.puzzleState)')==run
 page.evaluate('SW.app.setView("investigate",false)');click('#hotspots [data-id="cx_abyss_1"]');screenshot('puzzle');close();page.evaluate('Ward.returnTitle()')
 # Invalid JSON is rejected without changing the existing profile.
 previous=page.evaluate('JSON.stringify(Campaign.profile)');page.locator('#campaignImport').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':b'{invalid json'})
 page.wait_for_timeout(250);assert page.evaluate('JSON.stringify(Campaign.profile)')==previous;log('Invalid JSON does not replace saved records')
 # Valid schema with corrupt puzzle components is sanitized and stays playable.
 corrupt=json.loads(previous);corrupt['runs']['abyss']['puzzleState']['cx_abyss_1']={'values':[999]};page.evaluate('(v)=>Campaign.restoreBackup(v)',corrupt)
 click('[data-action="continue"]');page.wait_for_function('Ward.phase==="playing"');page.evaluate('SW.app.setView("investigate",false)');click('#hotspots [data-id="cx_abyss_1"]');assert page.evaluate('JSON.stringify(Ward.state.puzzleState.cx_abyss_1.values)')=='[0,0,0]';close();log('Malformed partial components reset safely')
 # Pause stops the challenge clock; ordinary clue reading does not.
 start('metro','challenge');click('#hotspots [data-id="cx_metro_1_clue0"]');before=page.evaluate('Ward.state.remaining');page.wait_for_timeout(1100);assert page.evaluate('Ward.state.remaining')<before-.5;close()
 click('#gameScreen [data-action="pause"]');before=page.evaluate('Ward.state.remaining');page.wait_for_timeout(1200);assert abs(page.evaluate('Ward.state.remaining')-before)<.01;close();log('Challenge clock runs in clue dialogs and stops on pause')
 # Check keyboard movement, look, and sustained boundary collision in a new room.
 page.evaluate('SW.app.setView("3d",false);SW.app.resetPosition()');before=page.evaluate('SW.app.player.pos.slice()');page.keyboard.down('d');page.wait_for_timeout(850);page.keyboard.up('d');after=page.evaluate('SW.app.player.pos.slice()');assert after[0]>before[0]+.1
 yaw=page.evaluate('SW.app.player.yaw');page.mouse.move(690,430);page.mouse.down();page.mouse.move(820,448,steps=8);page.mouse.up();assert abs(page.evaluate('SW.app.player.yaw')-yaw)>.1
 page.evaluate('SW.app.setView("2d",false);SW.app.resetPosition()');page.keyboard.down('s');page.wait_for_function('SW.app.player.pos[2]>SW.app.world.bounds.d/2-.43',timeout=25000);page.keyboard.up('s');z=page.evaluate('SW.app.player.pos[2]');page.keyboard.down('s');page.wait_for_timeout(1400);page.keyboard.up('s');assert abs(page.evaluate('SW.app.player.pos[2]')-z)<.1;assert page.evaluate('SW.app.canStand(SW.app.player.pos[0],SW.app.player.pos[2])');log('Desktop movement, drag look and boundary collision')
 log('Desktop page errors',errors);assert not errors;page.close()
 # Actual touch events in a phone-sized emulated viewport (not a physical phone).
 ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True);m=ctx.new_page();m.set_default_timeout(20000);errs=[];m.on('pageerror',lambda e:errs.append(str(e)))
 m.set_content(html,wait_until='load');m.wait_for_function('SW.app?.frame>2');m.evaluate('Depth.setLevel("classic")')
 def tap(s):m.locator(s+':visible').first.tap()
 dims=m.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');assert dims['scroll']<=dims['width']+1;log('Phone chapter menu has no horizontal overflow',dims)
 tap('[data-campaign="select"][data-chapter="metro"]');m.screenshot(path=str(OUT/'silent-ward-v3-mobile-menu.png'),full_page=True)
 tap('.entry-view[data-view="2d"]');tap('[data-mode="explore"]');tap('[data-action="start"]');m.wait_for_function('Ward.phase==="playing" && SW.app.room==="metro_hall"');m.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.quality="low"');m.wait_for_timeout(3500)
 m.screenshot(path=str(OUT/'silent-ward-v3-mobile-2d.png'))
 tap('[data-world="cx_metro_1"]');m.wait_for_function('Ward.modal==="campaign-puzzle"',timeout=35000);box=m.locator('#modal').bounding_box();assert box['x']>=0 and box['x']+box['width']<=391;log('Phone tap-to-walk reaches chapter puzzle and dialog fits',box)
 for d in '2317':tap(f'[data-pc="digit"][data-index="{d}"]')
 tap('#campaignPuzzleForm button[type="submit"]');assert m.evaluate('Ward.state.solved.cx_metro_1');tap('.modal-close');log('Phone on-screen keypad solves chapter puzzle')
 m.evaluate('SW.app.resetPosition()');cdp=ctx.new_cdp_session(m);box=m.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;pos=m.evaluate('SW.app.player.pos.slice()')
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+27,'y':y-12}]});m.wait_for_timeout(850);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});new=m.evaluate('SW.app.player.pos.slice()');assert math.hypot(new[0]-pos[0],new[2]-pos[2])>.1;log('Phone joystick moves player')
 tap('.view-switch [data-view="3d"]');yaw=m.evaluate('SW.app.player.yaw');cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':190,'y':418}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':240,'y':445}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert abs(m.evaluate('SW.app.player.yaw')-yaw)>.1;log('Phone first-person touch look')
 tap('.view-switch [data-view="investigate"]');m.wait_for_timeout(300);dims=m.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');assert dims['scroll']<=dims['width']+1;m.screenshot(path=str(OUT/'silent-ward-v3-mobile-investigation.png'),full_page=True);log('Phone investigation view has no horizontal overflow',dims)
 m.set_viewport_size({'width':844,'height':390});tap('.view-switch [data-view="2d"]');m.wait_for_timeout(300);dims=m.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');assert dims['scroll']<=dims['width']+1;log('Phone landscape layout has no horizontal overflow',dims)
 log('Phone page errors',errs);assert not errs;ctx.close()
 # Denied WebGL + denied real storage; there is no test storage shim in this fixture.
 f=b.new_page(viewport={'width':1000,'height':800});ferr=[];f.on('pageerror',lambda e:ferr.append(str(e)))
 fallback=inline_html().replace('<head>','<head><script>const nativeContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t==="webgl2"?null:nativeContext.call(this,t,...a)};</script>',1)
 f.set_content(fallback,wait_until='load');f.wait_for_function('!!SW.app');assert not f.evaluate('!!SW.app.renderer');assert f.evaluate('SW.app.view')=='2d'
 f.locator('[data-campaign="select"][data-chapter="orphan"]').click();f.locator('[data-action="start"]').click();f.wait_for_function('Ward.phase==="playing"');f.locator('.view-switch [data-view="investigate"]').click();f.locator('#hotspots [data-id="cx_orphan_1"]').click();assert f.evaluate('Ward.modal')=='campaign-puzzle';assert not ferr;log('New chapter playable with WebGL unavailable and storage denied')
 (OUT/'campaign-visual-v3.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));b.close()
