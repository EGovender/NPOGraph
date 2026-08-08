#!/usr/bin/env python3
"""
Generates site/public/og-image.png (1200x630), the social-preview image used
by BaseLayout.astro's Open Graph / Twitter Card tags.

A static asset, not part of the ontology build pipeline -- run by hand
whenever the brand mark or colors change, then commit the resulting PNG:

    .venv/bin/python tools/generate_og_image.py

Colors and mark geometry match site/public/favicon.svg and site/public/logo.svg
(the hub-and-spoke hexagon mark) -- see those files if the mark itself changes.
Tagline matches logo.svg's own "Shared knowledge. Stronger impact." lockup copy.
"""
from pathlib import Path

import cairosvg

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "site" / "public" / "og-image.png"

WIDTH, HEIGHT = 1200, 630

SVG = f"""
<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">
  <rect width="{WIDTH}" height="{HEIGHT}" fill="#f7f7f8" />

  <g transform="translate(190,200) scale(2.1)">
    <path d="M50 4 92 27v46L50 96 8 73V27Z" fill="none" stroke="#FFCE01" stroke-width="5" stroke-linejoin="round"/>
    <g stroke="#2E343E" stroke-width="4" stroke-linecap="round">
      <line x1="50" y1="50" x2="50" y2="26"/>
      <line x1="50" y1="50" x2="71" y2="38"/>
      <line x1="50" y1="50" x2="71" y2="62"/>
      <line x1="50" y1="50" x2="50" y2="74"/>
      <line x1="50" y1="50" x2="29" y2="62"/>
      <line x1="50" y1="50" x2="29" y2="38"/>
    </g>
    <circle cx="50" cy="50" r="9" fill="#2E343E"/>
    <circle cx="50" cy="26" r="6" fill="#FFCE01"/>
    <circle cx="71" cy="38" r="6" fill="#2E343E"/>
    <circle cx="71" cy="62" r="6" fill="#FFCE01"/>
    <circle cx="50" cy="74" r="6" fill="#2E343E"/>
    <circle cx="29" cy="62" r="6" fill="#FFCE01"/>
    <circle cx="29" cy="38" r="6" fill="#2E343E"/>
  </g>

  <text x="450" y="330" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="64" font-weight="700">
    <tspan fill="#2E343E">CommonGood</tspan><tspan dx="16" fill="#8A6508">Atlas</tspan>
  </text>

  <text x="600" y="485" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" fill="#55596a">
    Shared knowledge. Stronger impact.
  </text>

  <rect x="0" y="614" width="{WIDTH}" height="16" fill="#FFCE01" />
</svg>
"""

cairosvg.svg2png(bytestring=SVG.encode("utf-8"), write_to=str(OUT_PATH), output_width=WIDTH, output_height=HEIGHT)
print(f"Generated {OUT_PATH}")
