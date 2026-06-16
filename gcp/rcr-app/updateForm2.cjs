const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/RcrForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the table headers
content = content.replace(
  /<th style=\{\{ width: '35%' \}\}>(.*?)<\/th>\s*<th style=\{\{ width: '15%' \}\}>(.*?)<\/th>\s*<th style=\{\{ width: '10%' \}\}>QC Contractor<\/th>\s*<th style=\{\{ width: '10%' \}\}>Inspector<\/th>\s*<th style=\{\{ width: '5%' \}\}>YES<\/th>\s*<th style=\{\{ width: '5%' \}\}>N\/A<\/th>\s*<th style=\{\{ width: '20%' \}\}>Remark\/Note<\/th>/,
  `<th style={{ width: '30%' }}>$1</th>
                      <th style={{ width: '15%' }}>$2</th>
                      <th style={{ width: '7%' }}>QC Contractor</th>
                      <th style={{ width: '7%' }}>Inspector</th>
                      <th style={{ width: '4%' }}>YES</th>
                      <th style={{ width: '4%' }}>N/A</th>
                      <th style={{ width: '33%' }}>Remark/Note</th>`
);

// 2. Change Remark inputs from <input type="text"> to <textarea>
content = content.replace(
  /<input type="text" className="rcr-input-inline-small" value=\{checklist\[item\.id\]\?\.remark \|\| ''\} onChange=\{e => setChecklist\(prev => \(\{ \.\.\.prev, \[item\.id\]: \{ \.\.\.prev\[item\.id\], remark: e\.target\.value \} \}\)\)\} placeholder="Remark" style=\{\{ width: '100%' \}\} \/>/g,
  `<textarea className="rcr-input-inline" value={checklist[item.id]?.remark || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], remark: e.target.value } }))} placeholder="Remark" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1} />`
);

// 3. Change "Comment" inputs in the second column from <input type="text"> to <textarea>
content = content.replace(
  /<input type="text" className="rcr-input-inline"(\s+)value=\{checklist\[item\.id\]\?\.value \|\| ''\}(\s+)onChange=\{e => setChecklist\(prev => \(\{ \.\.\.prev, \[item\.id\]: \{ \.\.\.prev\[item\.id\], value: e\.target\.value \} \}\)\)\}(\s+)placeholder="Comment" style=\{\{ width: '100%' \}\}(\s+)\/>/g,
  `<textarea className="rcr-input-inline"$1value={checklist[item.id]?.value || ''}$2onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], value: e.target.value } }))}$3placeholder="Comment" style={{ width: '100%', resize: 'vertical', minHeight: '34px', padding: '6px' }} rows={1}$4/>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated RcrForm.tsx for widths and textareas');
