"""Test-only helpers. None of this is loaded by the game.

Tests inline the production offline build into about:blank. A deliberately small
storage shim is used only for serialization tests on that synthetic origin.
This does not constitute a real-domain localStorage or live hosting test.
"""
from __future__ import annotations
import os
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
OUT.mkdir(exist_ok=True)
sys.path.insert(0, str(ROOT))
from tools.build_standalone import build


def inline_html(storage: bool = False) -> str:
    html = build().read_text(encoding='utf-8')
    if storage:
        shim = '''<script>
        window.__saveStore = {};
        Object.defineProperty(window, 'localStorage', {value: {
          getItem: k => window.__saveStore[k] ?? null,
          setItem: (k, v) => window.__saveStore[k] = String(v),
          removeItem: k => delete window.__saveStore[k]
        }});
        </script>'''
        html = html.replace('<head>', '<head>' + shim, 1)
    return html


def browser_options() -> dict:
    options = {'headless': True, 'args': ['--enable-webgl']}
    executable = os.environ.get('SW_BROWSER')
    if executable:
        options['executable_path'] = executable
    if os.environ.get('SW_SOFTWARE_GL') == '1':
        options['args'] += ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    return options
