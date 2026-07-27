// Renders a live <svg> to a PNG data URL, replacing cytoscape's one-line
// `cy.png()`. The tricky part: a cloned SVG serialized on its own has no
// access to the page's stylesheet, so any color expressed via `light-dark()`
// or a CSS class (border on .selected, opacity on .faded, display on
// .category-hidden, ...) would vanish. Rather than re-deriving every color
// by hand, this walks the live tree and copies each element's already
// *resolved* computed style onto its clone as an inline override --
// getComputedStyle() has already done the light/dark and cascade resolution
// for us, whatever the current theme happens to be.
const INLINED_PROPERTIES = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linejoin',
  'paint-order',
  'opacity',
  'display',
  'font-size',
  'font-weight',
  'font-family',
  'text-anchor',
] as const;

function inlineComputedStyles(live: Element, clone: Element) {
  const computed = getComputedStyle(live);
  const style = INLINED_PROPERTIES.map((prop) => `${prop}:${computed.getPropertyValue(prop)}`).join(';');
  clone.setAttribute('style', style);
  const liveChildren = Array.from(live.children);
  const cloneChildren = Array.from(clone.children);
  for (let i = 0; i < liveChildren.length; i++) {
    inlineComputedStyles(liveChildren[i], cloneChildren[i]);
  }
}

export async function exportSvgAsPng(
  svgEl: SVGSVGElement,
  options: { background: string; scale?: number } = { background: '#ffffff' }
): Promise<string> {
  const scale = options.scale ?? 2;
  const { width, height } = svgEl.getBoundingClientRect();

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  inlineComputedStyles(svgEl, clone);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D canvas context');
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
