#!/usr/bin/env python3
"""Capture real authored WebGL rooms for investigation view and menu thumbnails.
Optional development dependency: Playwright + Chromium; see tests/README.md.
"""
from pathlib import Path
import sys,json
from io import BytesIO
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
from support import inline_html,browser_options
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
 b=pw.chromium.launch(**browser_options());page=b.new_page(viewport={'width':1200,'height':744},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(inline_html(storage=True),wait_until='load');page.wait_for_function('SW.app?.frame>2')
 assert page.evaluate('!!SW.app.renderer'),page.evaluate('String(SW.app.renderError)')
 page.evaluate('Ward.setPref("sound",false);Ward.setPref("scares",false);SW.app.prefs.reduceMotion=true;SW.app.prefs.quality="high";SW.app.setView("3d",false);SW.app.renderer.brightness=1.08')
 page.add_style_tag(content='#startScreen,#toastRegion,#filmGrain,#weatherVeil,.world-shade{visibility:hidden!important} #worldHost{background:none!important}')
 shots={}
 for c in page.evaluate('CAMPAIGN_DATA'):
  for r in c['rooms']:
   id=r['id'];page.evaluate('(id)=>SW.app.preview(id)',id);page.wait_for_timeout(260)
   points=page.evaluate('Object.fromEntries(SW.app.world.hotspots.map(h=>{const p=SW.M.project(h.pos,SW.app.renderer.lastVP);return [h.id,[Math.round((p.x*.5+.5)*10000)/100,Math.round((-p.y*.5+.5)*10000)/100]]}))')
   image=Image.open(BytesIO(page.locator('#worldCanvas').screenshot()));image.save(ROOT/'assets'/f'{id}.webp',format='WEBP',quality=85,method=5)
   shots[id]={'points':points,'camera':'authored-preview'};print(id,points,flush=True)
 assert not errors,errors
 (ROOT/'src/campaign-shots.js').write_text('/* Coordinates projected from the authored 3D capture camera. */\nwindow.CAMPAIGN_SHOTS = '+json.dumps(shots,ensure_ascii=False,indent=2)+';\n')
 b.close()
