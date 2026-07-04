const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'gita_data.json');
// Reload the original data from git to start fresh
const { execSync } = require('child_process');
execSync('git restore gita_data.json');

const gitaData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let modifiedCount = 0;

for (let item of gitaData) {
  let original = item.sanskrit;
  
  // 1. Add newline after "उवाच" or "नुवाच", removing any stray | or । after it
  let formatted = original.replace(/(उवाच|नुवाच)\s*[|।]?\s*/g, '$1\n');
  
  // 2. Add newline after single "।" (danda) but NOT double "।।".
  // Remove spaces before/after the match just to be clean, and add \n.
  formatted = formatted.replace(/(?<!।)\s*।\s*(?!।)/g, '।\n');
  
  // Also handle single | if it exists
  formatted = formatted.replace(/(?<!\|)\s*\|\s*(?!\|)/g, ' |\n');
  
  // Trim any trailing/leading whitespaces on each line
  formatted = formatted.split('\n').map(line => line.trim()).join('\n').trim();
  
  if (original !== formatted) {
    item.sanskrit = formatted;
    modifiedCount++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(gitaData, null, 2));

console.log(`Successfully formatted ${modifiedCount} shlokas.`);

const example15 = gitaData.find(d => d.chapter === 15 && d.verse === 1);
console.log(`\nCh 15 V 1:`);
console.log(example15.sanskrit);

const example1 = gitaData.find(d => d.chapter === 1 && d.verse === 1);
console.log(`\nCh 1 V 1:`);
console.log(example1.sanskrit);
