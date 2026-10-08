"""V4 desktop screenshots and emulated-touch layout checks.
Fixture-only prerequisite flags are used to expose each analytical UI for layout
coverage. These are NOT progression proofs; see depth_flow.py for actual solves.
"""
from playwright.sync_api import sync_playwright
from support import inline_html, OUT, ROOT, browser_options
import json, math
SHOTS=ROOT/'docs'/'screenshots';SHOTS.mkdir(exist_ok=True)
results=[]
def log(name,value=True):
 print(name,json.dumps(value,ensure_ascii=False),flush=True);results.append({'test':name,'result':value})
html=inline_html(storage=True)
with sync_playwright() as pw:
 opts=browser_options();opts.setdefault('executable_path','/usr/bin/chromium');b=pw.chromium.launch(**opts)
 errors=[]
 def setup(p):
  p.set_default_timeout(16000);p.on('pageerror',lambda e:errors.append(str(e)))
  p.set_content(html,wait_until='load');p.wait_for_function('SW.app?.frame>2 && !!Depth')
  p.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.quality="low";SW.app.prefs.reduceMotion=true')
 def press(p,s,touch=False):
  el=p.locator(s+':visible').first
  if touch:el.tap()
  else:el.click()
 def close(p,touch=False):
  if p.evaluate('!!Ward.modal'):press(p,'.modal-close',touch)
 def start(p,ch='hospital',touch=False):
  if p.evaluate('Ward.phase')!='title':p.evaluate('Ward.returnTitle()')
  press(p,f'[data-campaign="select"][data-chapter="{ch}"]',touch)
  press(p,'[data-depth="level"][data-level="nightmare"]',touch)
  p.locator('#depthSeed').fill('NIGHT-0117');press(p,'.entry-view[data-view="investigate"]',touch)
  press(p,'[data-mode="explore"]',touch);press(p,'[data-action="start"]',touch)
  if p.locator('[data-action="new-confirm"]:visible').count():press(p,'[data-action="new-confirm"]',touch)
  p.wait_for_function('Ward.phase==="playing" && SW.app.room===Ward.state.room')
 def fixture(p,ch,i,touch=False):
  start(p,ch,touch)
  p.evaluate('''(i)=>{const d=Ward.state.depth;for(let j=0;j<i;j++){Ward.state.solved[Ward.stages[j].key]=true;d.analysed[j]=true;d.audits[j]=true;}if(Ward.state.chapter==='hospital'){Ward.state.solved.wardDoor=true;Ward.state.solved.archiveDoor=true;}d.read=Array.from({length:5},(_,j)=>['l'+j,'s'+j]).flat();}''',i)
  r=p.evaluate('(i)=>Campaign.current().rooms[i].id',i)
  if p.evaluate('Ward.state.room')!=r:
   press(p,f'#roomNav [data-room="{r}"]',touch)
   if p.locator('[data-action="unlock-room"]:visible').count():press(p,'[data-action="unlock-room"]',touch)
   p.wait_for_function('(r)=>Ward.state.room===r',arg=r)
  p.evaluate('(i)=>Depth.openAnalysis(i)',i)
  assert p.evaluate('Ward.modal')=='depth-puzzle'
 def fit(p,label):
  v=p.evaluate('''()=>{const m=document.querySelector('#modal'),c=document.querySelector('.depth-console');return {width:innerWidth,document:document.documentElement.scrollWidth,modal:m.getBoundingClientRect().toJSON(),modalClient:m.clientWidth,modalScroll:m.scrollWidth,console:c?{client:c.clientWidth,scroll:c.scrollWidth}:null}}''')
  assert v['document']<=v['width']+1,(label,v)
  if p.evaluate('!!Ward.modal'):
   assert v['modal']['x']>=-1 and v['modal']['right']<=v['width']+1,(label,v)
   assert v['modalScroll']<=v['modalClient']+1,(label,v)
   if v['console']:assert v['console']['scroll']<=v['console']['client']+1,(label,v)
  log(label,{'width':v['width'],'noHorizontalOverflow':True})
 def shot(p,name,full=False):
  p.wait_for_timeout(300);p.screenshot(path=str(SHOTS/('v4-'+name+'.png')),full_page=full)
 # Desktop menu and actual normal first-area input; board displays genuine progress.
 p=b.new_page(viewport={'width':1440,'height':1200},device_scale_factor=1);setup(p)
 p.wait_for_timeout(4300);shot(p,'menu',True)
 start(p);press(p,'#hotspots [data-id="shift"]');press(p,'[data-depth="record"][data-key="l0"]');close(p)
 press(p,'#hotspots [data-id="shift"]');press(p,'[data-depth="record"][data-key="s0"]');close(p)
 press(p,'#hotspots [data-id="drawer"]');puz=p.evaluate('Depth.puzzles()[0]')
 for i in puz['answer']:press(p,f'[data-depth="choose"][data-index="{i}"]')
 press(p,'#depthPuzzleForm button[type="submit"]');press(p,'[data-depth="base"][data-index="0"]')
 p.locator('#codeInput').fill('1103');press(p,'#codeForm button[type="submit"]');close(p)
 press(p,'#roomNav [data-room="ward"]')
 if p.locator('[data-action="unlock-room"]:visible').count():press(p,'[data-action="unlock-room"]')
 press(p,'#hotspots [data-id="symbols"]');press(p,'[data-depth="record"][data-key="l1"]');close(p)
 press(p,'[data-depth="board"]');p.locator('#depthScratch').fill('病房的新记录附有护士站回签纸带。\n先回护士站取校准残页，再用第一个分析回执完成复核。')
 p.evaluate('document.querySelector("#modal").scrollTop=0');fit(p,'Desktop investigation matrix');shot(p,'matrix')
 # Challenging controls, exposed using explicitly labelled layout fixtures.
 fixture(p,'astro',2);p.locator('.depth-console').scroll_into_view_if_needed();fit(p,'Desktop 7x7 nonogram');shot(p,'nonogram')
 fixture(p,'orphan',2);p.locator('.depth-console').scroll_into_view_if_needed();fit(p,'Desktop 8-person testimony');shot(p,'testimony')
 p.close()
 # Actual touch events on small phones, two sizes, all nine puzzle families.
 ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True);m=ctx.new_page();setup(m)
 m.wait_for_timeout(4300);fit(m,'390px menu');shot(m,'mobile-menu',True)
 start(m,'orphan',True)
 press(m,'#hotspots [data-id="cx_orphan_1_clue0"]',True);press(m,'[data-depth="record"][data-key="l0"]',True);close(m,True)
 press(m,'#hotspots [data-id="cx_orphan_1_clue0"]',True);press(m,'[data-depth="record"][data-key="s0"]',True);close(m,True)
 press(m,'#hotspots [data-id="cx_orphan_1"]',True);puz=m.evaluate('Depth.puzzles()[0]')
 for key in ['places','badges']:
  for i,v in enumerate(puz['answer'][key]):m.locator(f'[data-depth-select="{key}"][data-index="{i}"]').select_option(str(v))
 press(m,'#depthPuzzleForm button[type="submit"]',True);assert m.evaluate('Ward.state.depth.analysed[0]');log('Touch starts nightmare and completes actual identity analysis')
 close(m,True);press(m,'[data-depth="board"]',True);fit(m,'390px matrix');m.evaluate('document.querySelector("#modal").scrollTop=0');shot(m,'mobile-matrix');close(m,True)
 variants=[('hospital',0,'order'),('hospital',1,'identity'),('hospital',2,'cipher'),('hospital',3,'nonogram'),('hospital',4,'linked'),('metro',0,'route'),('metro',1,'lights'),('abyss',0,'equations'),('orphan',2,'testimony')]
 for width in [390,320]:
  m.set_viewport_size({'width':width,'height':844})
  for ch,i,kind in variants:
   fixture(m,ch,i,True);m.locator('.depth-console').scroll_into_view_if_needed();fit(m,f'{width}px nightmare {kind}')
   # Dispatch touch to at least one interactive control per family (identity done above).
   selectors={'order':'[data-depth="choose"]','cipher':'[data-depth="digit"]','nonogram':'[data-depth="cell"]','linked':'[data-depth="link"]','route':'[data-depth="route"]','lights':'[data-depth="light"]','equations':'[data-depth="plus"]','testimony':'[data-depth="truth"]'}
   sel=selectors.get(kind)
   if sel and m.locator(sel+':visible').count():press(m,sel,True)
   if width==390 and kind=='nonogram':shot(m,'mobile-nonogram')
 # Joystick and keyboard retain movement in top-down fallback; do not claim 3D GPU rendering.
 m.set_viewport_size({'width':390,'height':844});start(m,'metro',True);m.evaluate('SW.app.setView("2d",false);SW.app.resetPosition()');m.wait_for_timeout(1100)
 fit(m,'390px 2D HUD');shot(m,'mobile-2d')
 pos=m.evaluate('SW.app.player.pos.slice()');box=m.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;cdp=ctx.new_cdp_session(m)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+27,'y':y-12}]});m.wait_for_timeout(850);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});end=m.evaluate('SW.app.player.pos.slice()');assert math.hypot(pos[0]-end[0],pos[2]-end[2])>.1;log('Emulated touch joystick moves 2D player')
 m.evaluate('SW.app.resetPosition()');pos=m.evaluate('SW.app.player.pos.slice()');m.keyboard.down('d');m.wait_for_timeout(650);m.keyboard.up('d');end=m.evaluate('SW.app.player.pos.slice()');assert math.hypot(pos[0]-end[0],pos[2]-end[2])>.1;log('Keyboard moves 2D player')
 before=m.evaluate('JSON.stringify(Ward.state.depth)');press(m,'.view-switch [data-view="3d"]',True);assert m.evaluate('SW.app.view')=='2d';assert m.evaluate('JSON.stringify(Ward.state.depth)')==before;log('Unavailable WebGL 2 safely falls back without progress loss')
 press(m,'[data-world="cx_metro_1"]',True);m.wait_for_function('Ward.modal==="depth-puzzle"',timeout=45000);assert m.locator('.depth-prereq').count();log('Touch hotspot walk reaches new analysis gate')
 close(m,True);press(m,'.view-switch [data-view="investigate"]',True);fit(m,'390px investigation');m.set_viewport_size({'width':844,'height':390});fit(m,'844px landscape investigation');press(m,'[data-depth="board"]',True);fit(m,'844px landscape matrix')
 log('No JavaScript page errors',errors);assert not errors
 (OUT/'depth-visual-v4.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));ctx.close();b.close()
