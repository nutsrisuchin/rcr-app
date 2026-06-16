const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/RcrForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 3. Add the Remark/Note td after the na checkbox
// Since regex didn't match, let's use string replace
const targetStr = `onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], na: e.target.checked, yes: e.target.checked ? false : prev[item.id].yes } }))} />\n                            </td>`;

const replacementStr = targetStr + `\n                            <td>\n                              <input type="text" className="rcr-input-inline-small" value={checklist[item.id]?.remark || ''} onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], remark: e.target.value } }))} placeholder="Remark" style={{ width: '100%' }} />\n                            </td>`;

content = content.split(targetStr).join(replacementStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added Remark td');
