"""Browser regression checks; see README.md for environment and limits."""
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, browser_options
from pathlib import Path
import json,math
results=[]
def log(name,data=True):
 print(name,json.dumps(data,ensure_ascii=False),flush=True);results.append({'test':name,'result':data})
with sync_playwright() as p:
 b=p.chromium.launch(**browser_options())
 page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(inline_html(storage=True),wait_until='load');page.wait_for_function('SW.app?.frame>2');page.wait_for_timeout(200)
 assert page.locator('.sector-art img').count()==5
 log('All five local scene thumbnails loaded')
 page.screenshot(path=str(OUT / 'silent-ward-v2-menu.png'))
 page.locator('[data-mode="explore"]').click();page.locator('[data-action="start"]').click();page.wait_for_function('SW.app.room==="station"');page.wait_for_timeout(1000)
 page.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false)')
 # Preserve initial UI in a real rendered, playable room.
 page.wait_for_timeout(3800);page.screenshot(path=str(OUT / 'silent-ward-v2-3d.png'))
 page.evaluate('SW.app.prefs.quality="low";SW.app.setView("3d",false)')
 before=page.evaluate('SW.app.player.pos.slice()');page.keyboard.down('d');page.wait_for_timeout(1000);page.keyboard.up('d');after=page.evaluate('SW.app.player.pos.slice()');assert after[0]>before[0]+.1;log('3D keyboard locomotion',{'before':before,'after':after})
 y=page.evaluate('SW.app.player.yaw');page.mouse.move(650,430);page.mouse.down();page.mouse.move(800,450,steps=8);page.mouse.up();assert abs(page.evaluate('SW.app.player.yaw')-y)>.1;log('3D drag-to-look')
 page.locator('.view-switch [data-view="2d"]').click();page.evaluate('SW.app.resetPosition()');page.wait_for_timeout(500);page.screenshot(path=str(OUT / 'silent-ward-v2-2d.png'))
 # Reach the wall, then keep walking into it; no teleportation.
 page.keyboard.down('s');page.wait_for_function('SW.app.player.pos[2]>7.0',timeout=15000);page.wait_for_timeout(650);page.keyboard.up('s');pos=page.evaluate('SW.app.player.pos.slice()');assert 7.0<pos[2]<=7.15;assert page.evaluate('SW.app.canStand(SW.app.player.pos[0],SW.app.player.pos[2])');log('Sustained boundary collision',pos)
 page.locator('.view-switch [data-view="investigate"]').click();page.wait_for_timeout(350);page.screenshot(path=str(OUT / 'silent-ward-v2-investigation.png'));log('Desktop errors',errs);assert not errs
 page.close()
 # Phone-sized touchscreen emulation, using actual Chromium touch input.
 context=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
 mobile=context.new_page();merr=[];mobile.on('pageerror',lambda e:merr.append(str(e)))
 mobile.set_content(inline_html(storage=True),wait_until='load');mobile.wait_for_function('SW.app?.frame>1')
 width=mobile.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');assert width['scroll']<=width['width']+1;log('Phone menu has no horizontal overflow',width)
 mobile.screenshot(path=str(OUT / 'silent-ward-v2-mobile-menu.png'),full_page=True)
 mobile.locator('.entry-view[data-view="2d"]').tap();mobile.locator('[data-mode="explore"]').tap();mobile.locator('[data-action="start"]').tap();mobile.wait_for_function('Ward.phase==="playing"');mobile.wait_for_timeout(1000)
 mobile.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.quality="low"')
 mobile.wait_for_timeout(2500);mobile.screenshot(path=str(OUT / 'silent-ward-v2-mobile-2d.png'))
 mobile.locator('[data-world="drawer"]').tap();mobile.wait_for_function('Ward.modal==="keypad"',timeout=18000);log('Phone tap-to-walk and investigate')
 box=mobile.locator('#modal').bounding_box();assert box['x']>=0 and box['x']+box['width']<=391;log('Phone puzzle dialog fits',box)
 for digit in '1103':mobile.locator(f'[data-action="digit"][data-digit="{digit}"]').tap()
 mobile.locator('#codeForm button[type="submit"]').tap();assert mobile.evaluate('Ward.state.solved.drawer');mobile.locator('.modal-close').tap();log('Phone on-screen keypad solves puzzle')
 mobile.evaluate('SW.app.resetPosition()')
 cdp=context.new_cdp_session(mobile);box=mobile.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
 pos=mobile.evaluate('SW.app.player.pos.slice()')
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+28,'y':y-10}]});mobile.wait_for_timeout(1000);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 new=mobile.evaluate('SW.app.player.pos.slice()');assert math.hypot(new[0]-pos[0],new[2]-pos[2])>.2;log('Phone joystick movement',{'before':pos,'after':new})
 mobile.locator('.view-switch [data-view="3d"]').tap();mobile.wait_for_timeout(300);yaw=mobile.evaluate('SW.app.player.yaw')
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':195,'y':420}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':245,'y':445}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert abs(mobile.evaluate('SW.app.player.yaw')-yaw)>.1;log('Phone 3D touch look')
 mobile.screenshot(path=str(OUT / 'silent-ward-v2-mobile-3d.png'))
 mobile.locator('.view-switch [data-view="investigate"]').tap();mobile.wait_for_timeout(300);width=mobile.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');assert width['scroll']<=width['width']+1;mobile.screenshot(path=str(OUT / 'silent-ward-v2-mobile-investigation.png'),full_page=True);log('Phone original investigation fits',width)
 mobile.set_viewport_size({'width':844,'height':390});mobile.locator('.view-switch [data-view="2d"]').tap();mobile.wait_for_timeout(250);width=mobile.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');assert width['scroll']<=width['width']+1;log('Phone landscape no horizontal overflow',width)
 log('Phone errors',merr);assert not merr;context.close()
 fallback=b.new_page(viewport={'width':1000,'height':750});ferr=[];fallback.on('pageerror',lambda e:ferr.append(str(e)))
 html=inline_html().replace('<head>','<head><script>const nativeContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...args){return t==="webgl2"?null:nativeContext.call(this,t,...args)};</script>',1)
 fallback.set_content(html,wait_until='load');fallback.wait_for_function('!!SW.app');assert not fallback.evaluate('!!SW.app.renderer');assert fallback.evaluate('SW.app.view')=='2d';fallback.locator('[data-action="start"]').click();fallback.wait_for_function('Ward.phase==="playing"');fallback.locator('.view-switch [data-view="investigate"]').click();assert fallback.evaluate('SW.app.view')=='investigate';assert not ferr;log('WebGL unavailable and storage denied fallback',{'errors':ferr,'view':fallback.evaluate('SW.app.view')})
 (OUT / 'visual-test-results-v2.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 b.close()
