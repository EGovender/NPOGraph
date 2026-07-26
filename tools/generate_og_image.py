#!/usr/bin/env python3
"""
Generates site/public/og-image.png (1200x630), the social-preview image used
by BaseLayout.astro's Open Graph / Twitter Card tags.

A static asset, not part of the ontology build pipeline -- run by hand
whenever the brand mark or colors change, then commit the resulting PNG:

    .venv/bin/python tools/generate_og_image.py

Colors match site/src/styles/global.css's :root palette and the graph mark
in site/public/logo.svg (icon geometry duplicated here at a larger scale;
see that file if the mark itself changes).
"""
from pathlib import Path

import cairosvg

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "site" / "public" / "og-image.png"

WIDTH, HEIGHT = 1200, 630

SVG = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="mark" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4EABA5" />
      <stop offset="100%" stop-color="#79B158" />
    </linearGradient>
  </defs>
  <rect width="{WIDTH}" height="{HEIGHT}" fill="#f9f9f7" />

  <g transform="translate(150, 195) scale(2.4)">
    <g fill="none" stroke="url(#mark)" stroke-width="4.5" stroke-linecap="round">
      <line x1="20" y1="22" x2="20" y2="70" />
      <line x1="20" y1="22" x2="88" y2="80" />
      <line x1="20" y1="70" x2="88" y2="22" />
      <line x1="88" y1="22" x2="88" y2="80" />
    </g>
    <circle cx="20" cy="22" r="9" fill="#4EABA5" />
    <circle cx="20" cy="70" r="9" fill="#4EABA5" />
    <circle cx="51" cy="48" r="5.5" fill="#72B163" />
    <circle cx="88" cy="22" r="8" fill="#79B158" />
    <circle cx="88" cy="80" r="12" fill="#4FA98A" />
  </g>

  <text x="430" y="335" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="100" font-weight="800">
    <tspan fill="#565F65">NPO</tspan><tspan fill="#387866">Graph</tspan>
  </text>

  <text x="150" y="470" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="34" fill="#52514e">
    An open ontology for nonprofit operations, starting with grantmaking
  </text>

  <rect x="0" y="{HEIGHT - 8}" width="{WIDTH}" height="8" fill="url(#mark)" />
</svg>
"""

cairosvg.svg2png(bytestring=SVG.encode("utf-8"), write_to=str(OUT_PATH), output_width=WIDTH, output_height=HEIGHT)
print(f"Generated {OUT_PATH}")
