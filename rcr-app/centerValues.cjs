const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/RcrForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<div style=\{\{ display: 'flex', alignItems: 'center', gap: '4px' \}\}>/g,
  `<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully centered percent values');
