#!/usr/bin/env python3
"""Build an offline HTML file using only the Python standard library.

Run from any directory: python tools/build_standalone.py
The directory-based game remains the source of truth.
"""
from __future__ import annotations
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def data_uri(path: Path, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def build() -> Path:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    images = {
        name: data_uri(ROOT / "assets" / f"{name}.webp", "image/webp")
        for name in ("station", "ward", "archive", "power", "exit")
    }
    html = html.replace("assets/icon.svg", data_uri(ROOT / "assets/icon.svg", "image/svg+xml"))
    html = re.sub(
        r'<link rel="stylesheet" href="([^"]+)">',
        lambda m: "<style>\n" + (ROOT / m[1]).read_text(encoding="utf-8") + "\n</style>",
        html,
    )

    def inline_script(match: re.Match[str]) -> str:
        code = (ROOT / match[1]).read_text(encoding="utf-8")
        if match[1].endswith("app.js"):
            # Works with either compact or formatted source.
            code = re.sub(r'img\.src\s*=\s*`assets/\$\{card\.dataset\.room\}\.webp`',
                          'img.src = INLINE_SCENE_IMAGES[card.dataset.room]', code)
            code = code.replace('url("assets/${id}.webp")', 'url("${INLINE_SCENE_IMAGES[id]}")')
            code = "const INLINE_SCENE_IMAGES = " + json.dumps(images) + ";\n" + code
        return "<script>\n" + code.replace("</script", "<\\/script") + "\n</script>"

    html = re.sub(r'<script src="([^"]+)" defer></script>', inline_script, html)
    output = ROOT / "dist" / "silent-ward-v2-standalone.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")
    return output


if __name__ == "__main__":
    output = build()
    print(f"Built {output} ({output.stat().st_size:,} bytes)")
