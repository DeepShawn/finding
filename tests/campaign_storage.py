"""Migration and ordinary-ending fixtures, using test-only serialized storage.
Not a test of real-domain browser persistence or authentic puzzle completion.
"""
import json
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, browser_options
results=[]
def log(test,result=True):
 print(test,json.dumps(result,ensure_ascii=False),flush=True);results.append({'test':test,'result':result})
# Logic/migration checks do not need 3D: explicitly suppress WebGL in this test.
html=inline_html(storage=True).replace('<head>','<head><script>const nativeContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return t==="webgl2"?null:nativeContext.call(this,t,...a)};</script>',1)
with sync_playwright() as pw:
 b=pw.chromium.launch(**browser_options());errs=[]
 def openpage(store=None):
  p=b.new_page(viewport={'width':1250,'height':920});p.on('pageerror',lambda e:errs.append(str(e)));p.set_content(html.replace('window.__saveStore = {};','window.__saveStore = '+json.dumps(store or {})+';'),wait_until='load');p.wait_for_function('!!SW.app');p.evaluate('Depth.setLevel("classic")');p.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false)');return p
 p=openpage();p.locator('[data-mode="explore"]').click();p.locator('[data-action="start"]').click();p.wait_for_function('Ward.phase==="playing"');p.evaluate('SW.app.setView("investigate",false)');p.locator('#hotspots [data-id="drawer"]').click();p.locator('#codeInput').fill('1103');p.locator('#codeForm button[type="submit"]').click();assert p.evaluate('Ward.state.solved.drawer')
 legacy=p.evaluate('JSON.parse(JSON.stringify(Ward.state))');legacy.pop('chapter',None);store={'silent-ward-save-v1':json.dumps(legacy)};p.close()
 p=openpage(store);assert p.evaluate('Campaign.profile.runs.hospital.solved.drawer');assert p.evaluate('Campaign.profile.migratedV2');p.locator('[data-action="continue"]').click();p.wait_for_function('Ward.phase==="playing"');assert p.evaluate('Ward.state.solved.drawer');log('Legacy hospital run imported with inventory and solved state')
 p.evaluate('Ward.returnTitle();Campaign.clearRun()');store=p.evaluate('JSON.parse(JSON.stringify(__saveStore))');p.close();p=openpage(store);assert not p.evaluate('!!Campaign.profile.runs.hospital');assert p.evaluate('!!__saveStore["silent-ward-save-v1"]');log('Cleared migrated run is not resurrected from old storage key')
 # Explicit extraction fixture; complete UI flow is covered by campaign_flow.py.
 p.locator('[data-campaign="select"][data-chapter="metro"]').click();p.locator('[data-mode="explore"]').click();p.locator('[data-action="start"]').click();p.wait_for_function('Ward.phase==="playing"');p.evaluate('for(const r of Campaign.current().rooms)Ward.state.solved[r.puzzle.id]=true;Ward.state.solved.exit=true;SW.app.setView("investigate",false);Ward.goRoom("metro_tunnel")');p.wait_for_function('Ward.state.room==="metro_tunnel"');p.locator('#hotspots [data-id="cx_metro_5_exit"]').click();p.locator('[data-action="escape"]:visible').click();assert 'ENDING A' in p.locator('#endingScreen').inner_text();assert p.evaluate('Campaign.profile.records.metro.evidence')==0;assert not p.evaluate('Campaign.profile.records.metro.truth');log('Ordinary extraction records A without awarding full evidence')
 p.evaluate('Ward.returnTitle();Campaign.profile.records.metro.truth=true;Campaign.profile.records.metro.evidence=3');p.locator('[data-action="start"]').click();p.wait_for_function('Ward.phase==="playing"');p.evaluate('for(const r of Campaign.current().rooms)Ward.state.solved[r.puzzle.id]=true;Ward.state.solved.exit=true;Ward.goRoom("metro_tunnel");SW.app.setView("investigate",false)');p.wait_for_function('Ward.state.room==="metro_tunnel"');p.locator('#hotspots [data-id="cx_metro_5_exit"]').click();p.locator('[data-action="escape"]:visible').click();assert p.evaluate('Campaign.profile.records.metro.truth');assert p.evaluate('Campaign.profile.records.metro.evidence')==3;log('Later ordinary extraction does not downgrade earlier full evidence fixture')
 log('Page errors',errs);assert not errs;(OUT/'classic-storage-v4.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));b.close()
