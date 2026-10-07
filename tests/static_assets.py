#!/usr/bin/env python3
"""Check source paths and real local HTTP responses, including a project subpath."""
from __future__ import annotations
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import quote, urljoin
from urllib.request import urlopen
import json

ROOT = Path(__file__).resolve().parents[1]

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        key = 'src' if tag == 'script' else 'href' if tag == 'link' else None
        if key and key in props:
            self.paths.append(props[key])

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

def main():
    refs = References()
    refs.feed((ROOT / 'index.html').read_text(encoding='utf-8'))
    refs.paths += [f'assets/{x}.webp' for x in ['station', 'ward', 'archive', 'power', 'exit']]
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT.parent)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        base = f'http://127.0.0.1:{server.server_port}/{quote(ROOT.name)}/'
        results = []
        for relative in ['index.html'] + refs.paths:
            assert not relative.startswith(('/', 'http:', 'https:')), relative
            local = ROOT / relative
            assert local.is_file(), local
            with urlopen(urljoin(base, relative), timeout=5) as response:
                payload = response.read()
                assert response.status == 200
                assert payload == local.read_bytes()
                results.append({'path': relative, 'bytes': len(payload), 'status': 200})
        print(json.dumps(results, ensure_ascii=False, indent=2))
        print('PASS: all static references work below a repository-like URL prefix.')
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

if __name__ == '__main__':
    main()
