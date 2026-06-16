const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/RcrForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The auto resize helper
const autoResizeHandler = `onInput={(e) => {
                    const target = e.currentTarget;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}`;

// Add autoResize handler to the Topic of Repair textarea
content = content.replace(
  /onChange=\{e => setTopic\(e\.target\.value\)\} placeholder="Fill in Topic of Repair"/g,
  `onChange={e => setTopic(e.target.value)}\n                  ${autoResizeHandler}\n                  placeholder="Fill in Topic of Repair"`
);

// Add autoResize handler to the checklist value textarea
content = content.replace(
  /onChange=\{e => setChecklist\(prev => \(\{ \.\.\.prev, \[item\.id\]: \{ \.\.\.prev\[item\.id\], value: e\.target\.value \} \}\)\)\}\s+placeholder="Comment"/g,
  `onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], value: e.target.value } }))}
                                  onInput={(e) => {
                                    const target = e.currentTarget;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                  placeholder="Comment"`
);

// Add autoResize handler to the checklist remark textarea
content = content.replace(
  /onChange=\{e => setChecklist\(prev => \(\{ \.\.\.prev, \[item\.id\]: \{ \.\.\.prev\[item\.id\], remark: e\.target\.value \} \}\)\)\}\s+placeholder="Remark"/g,
  `onChange={e => setChecklist(prev => ({ ...prev, [item.id]: { ...prev[item.id], remark: e.target.value } }))}
                              onInput={(e) => {
                                const target = e.currentTarget;
                                target.style.height = 'auto';
                                target.style.height = target.scrollHeight + 'px';
                              }}
                              placeholder="Remark"`
);

// Also add a resize before print in the useEffect
content = content.replace(
  /setTimeout\(\(\) => \{\s+window\.print\(\);\s+\}, 500\);/g,
  `setTimeout(() => {
              document.querySelectorAll('textarea').forEach(ta => {
                ta.style.height = 'auto';
                ta.style.height = ta.scrollHeight + 'px';
              });
              window.print();
            }, 500);`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated textareas');
