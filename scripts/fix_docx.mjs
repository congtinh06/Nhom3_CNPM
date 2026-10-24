import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const docXmlPath = path.join(rootDir, 'test_extract', 'word', 'document.xml');
let xml = fs.readFileSync(docXmlPath, 'utf8');

console.log('Original XML length:', xml.length);

// Fix the nested <w:p> tags before CHƯƠNG 1
// Search for repeated <w:p>
while (xml.includes('<w:p><w:p>')) {
  xml = xml.replaceAll('<w:p><w:p>', '<w:p>');
}

// Check tag balance
const tagRegex = /<\/?([a-zA-Z0-9_:]+)(?:\s+[^>]*?)?(\/?)>/g;
let match;
const stack = [];
let errorCount = 0;

while ((match = tagRegex.exec(xml)) !== null) {
  const full = match[0];
  const tag = match[1];
  const isSelfClosing = match[2] === '/' || full.endsWith('/>');
  const isClosing = full.startsWith('</');

  if (full.startsWith('<?') || full.startsWith('<!')) continue;

  if (isSelfClosing) {
    continue;
  } else if (isClosing) {
    if (stack.length === 0) {
      console.log('Error: Extra closing tag', tag, 'at pos', match.index);
      errorCount++;
      break;
    }
    const top = stack.pop();
    if (top.tag !== tag) {
      console.log(`Error: Mismatched tag! Expected </${top.tag}> but got </${tag}> at pos ${match.index}`);
      errorCount++;
      if (errorCount > 5) break;
    }
  } else {
    stack.push({ tag, index: match.index });
  }
}

if (stack.length === 0 && errorCount === 0) {
  console.log('XML tag balance check PASSED: 100% valid XML!');
} else {
  console.error('XML tag balance check FAILED! Stack length:', stack.length, 'Errors:', errorCount);
  process.exit(1);
}

// Write fixed XML
fs.writeFileSync(docXmlPath, xml, 'utf8');
console.log('Saved fixed document.xml!');

// Repack into Bao_Cao.docx using PowerShell System.IO.Compression.ZipFile
const targetDocx = path.join(rootDir, 'Bao_Cao.docx');
const targetDocxInDocs = path.join(rootDir, 'docs', 'report', 'BaoCao_CNPM_Echora.docx');

// Zip test_extract back to Bao_Cao.docx
const psZipScript = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$source = '${path.join(rootDir, 'test_extract').replace(/\\/g, '\\\\')}'
$dest = '${targetDocx.replace(/\\/g, '\\\\')}'
$dest2 = '${targetDocxInDocs.replace(/\\/g, '\\\\')}'

if (Test-Path $dest) { Remove-Item -Path $dest -Force }
[System.IO.Compression.ZipFile]::CreateFromDirectory($source, $dest)
Write-Host 'Created: ' $dest

if (Test-Path $dest2) { Remove-Item -Path $dest2 -Force }
Copy-Item -Path $dest -Destination $dest2 -Force
Write-Host 'Copied to: ' $dest2
`;

fs.writeFileSync(path.join(rootDir, 'temp_zip.ps1'), psZipScript, 'utf8');
execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(rootDir, 'temp_zip.ps1')}"`, { stdio: 'inherit' });
fs.unlinkSync(path.join(rootDir, 'temp_zip.ps1'));

console.log('Done repacking!');
