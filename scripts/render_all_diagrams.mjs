import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const diagramsDir = path.join(rootDir, 'docs', 'diagrams');
const imagesDir = path.join(rootDir, 'docs', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const files = fs.readdirSync(diagramsDir).filter(f => f.endsWith('.mmd'));

console.log(`Found ${files.length} diagrams to render:`, files);

for (const file of files) {
  const baseName = path.basename(file, '.mmd');
  const inputPath = path.join(diagramsDir, file);
  const outPngPath = path.join(imagesDir, `${baseName}.png`);
  const outSvgPath = path.join(imagesDir, `${baseName}.svg`);

  console.log(`Rendering ${file} to PNG and SVG...`);
  try {
    // Render PNG
    execSync(`npx -y @mermaid-js/mermaid-cli -i "${inputPath}" -o "${outPngPath}" --size 1600 -b white`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    // Render SVG
    execSync(`npx -y @mermaid-js/mermaid-cli -i "${inputPath}" -o "${outSvgPath}" -b white`, {
      cwd: rootDir,
      stdio: 'inherit'
    });
    console.log(`Rendered ${baseName}.png and ${baseName}.svg successfully.`);
  } catch (err) {
    console.error(`Failed to render ${file}:`, err.message);
  }
}

console.log('All diagrams rendered!');
