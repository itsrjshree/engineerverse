import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const evDir = path.join(distDir, 'engineerverse');

console.log('[Postbuild] Mirroring build assets for dual-domain support (standalone & sub-path)...');

if (fs.existsSync(distDir)) {
  if (!fs.existsSync(evDir)) {
    fs.mkdirSync(evDir, { recursive: true });
  }

  const assetsDir = path.join(distDir, 'assets');
  const targetAssetsDir = path.join(evDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.cpSync(assetsDir, targetAssetsDir, { recursive: true });
    console.log('[Postbuild] ✓ Assets copied to dist/engineerverse/assets');
  }

  const indexHtml = path.join(distDir, 'index.html');
  const targetIndexHtml = path.join(evDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, targetIndexHtml);
    console.log('[Postbuild] ✓ index.html copied to dist/engineerverse/index.html');
  }

  console.log('[Postbuild] Complete! Both /assets and /engineerverse/assets are now physically available.');
} else {
  console.warn('[Postbuild] dist directory not found, skipping mirror step.');
}
