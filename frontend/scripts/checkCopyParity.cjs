const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, './saigon-culture.html');
const srcDir = path.resolve(__dirname, '../src');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Isolate body without scripts or styles
const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(htmlContent);
if (!bodyMatch) {
  console.error('No body found');
  process.exit(1);
}
let bodyHtml = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

// Extract texts
function extractMatches(content, regex) {
  const matches = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    const text = m[1].replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '').trim();
    if (text && text.length > 1) {
      matches.push(text);
    }
  }
  return matches;
}

const tagsRegex = /<(?:h1|h2|h3|p|span|button|small|b|li|a)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|p|span|button|small|b|li|a)>/gi;
const attrRegex = /(?:placeholder|aria-label)="([^"]+)"/gi;

let extracted = [
  ...extractMatches(bodyHtml, tagsRegex),
  ...extractMatches(bodyHtml, attrRegex)
];

const uniqueStrings = Array.from(new Set(extracted)).filter(s => {
  // Ignore single icon chars or numbers
  return !/^[\d\s\u{2191}\u{1F6D2}\u{2630}\u{2212}+\u{2665}]+$/u.test(s);
});

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const allSrc = getFiles(srcDir).map(f => fs.readFileSync(f, 'utf8')).join('\n');

const missing = [];
const found = [];

for (const str of uniqueStrings) {
  const normStr = str.replace(/\s+/g, ' ');
  if (allSrc.includes(normStr) || allSrc.includes(str)) {
    found.push(str);
  } else {
    missing.push(str);
  }
}

console.log(`Total extracted strings: ${uniqueStrings.length}`);
console.log(`Found in src/: ${found.length}`);
console.log(`Missing in src/: ${missing.length}`);
if (missing.length > 0) {
  console.log('\nMissing items:');
  missing.forEach(m => console.log(' - ' + m));
}
