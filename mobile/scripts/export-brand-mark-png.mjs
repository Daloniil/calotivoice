#!/usr/bin/env node
/**
 * Rasterize landing/assets/calorivoice-mark.svg → mobile splash/icon PNGs.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const svgPath = join(root, 'landing/assets/calorivoice-mark.svg');
const svg = readFileSync(svgPath);

let Resvg;
try {
  ({ Resvg } = await import('@resvg/resvg-js'));
} catch {
  console.error('Run: cd mobile && npm install --save-dev @resvg/resvg-js');
  process.exit(1);
}

function render(size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  });
  return resvg.render().asPng();
}

const images = join(root, 'mobile/assets/images');
writeFileSync(join(images, 'splash-icon.png'), render(256));
writeFileSync(join(images, 'favicon.png'), render(64));
writeFileSync(join(images, 'icon.png'), render(1024));
writeFileSync(join(images, 'android-icon-foreground.png'), render(432));
writeFileSync(join(images, 'android-icon-monochrome.png'), render(432));
console.log('Wrote icon, splash, favicon, android foreground/monochrome from calorivoice-mark.svg');
