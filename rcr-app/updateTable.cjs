const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/RcrForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const newTable = `<table className="rcr-table">
                <tbody>
                  <tr>
                    <th style={{ width: '20%' }}>Pipe Material</th>
                    <td style={{ width: '30%' }}>
                      <select
                        className="rcr-select-light"
                        value={selectedMaterial}
                        onChange={handleMaterialChange}
                      >
                        {materialOptions.map(mat => (
                          <option key={mat} value={mat}>{mat}</option>
                        ))}
                        {materialOptions.length === 0 && <option value="">N/A</option>}
                      </select>
                    </td>
                    <th style={{ width: '20%' }}>P-No.</th>
                    <td style={{ width: '30%' }}>
                      <input
                        type="text"
                        className="rcr-input-inline"
                        value={pNo}
                        onChange={(e) => setPNo(e.target.value)}
                        placeholder="Enter P-No. or Comment"
                      />
                    </td>
                  </tr>
                  <tr>
                    <th>Thickness (mm) <span style={{ color: 'red', fontWeight: 'normal', fontSize: '11px' }}>(mandatory)</span></th>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <input type="text" className="rcr-input-inline" value={thickness} onChange={e => setThickness(e.target.value)} placeholder="Enter Thickness (mm)" />
                        {pwhtWarning && (
                          <div className="hide-on-print" style={{ color: 'red', fontSize: '11px', fontWeight: 'bold' }}>
                            ⚠️ {pwhtWarning}
                          </div>
                        )}
                      </div>
                    </td>
                    <th>Rating</th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={ratingOverride} onChange={e => setRatingOverride(e.target.value)} placeholder="Enter Rating or Comment" />
                    </td>
                  </tr>
                  <tr>
                    <th>Product/Fluid</th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={production} onChange={e => setProduction(e.target.value)} placeholder="Enter Production or Comment" />
                    </td>
                    <th>Services</th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={servicesOverride} onChange={e => setServicesOverride(e.target.value)} placeholder="Enter Services or Comment" />
                    </td>
                  </tr>
                  <tr>
                    <th>Design Temp (C) <span style={{ color: 'red', fontWeight: 'normal', fontSize: '11px' }}>(mandatory)</span></th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={tempOverride} onChange={e => setTempOverride(e.target.value)} placeholder="Enter Temp or Comment" />
                    </td>
                    <th>Design Pressure (barg) <span style={{ color: 'red', fontWeight: 'normal', fontSize: '11px' }}>(mandatory)</span></th>
                    <td>
                      <input type="text" className="rcr-input-inline" value={pressureDesignOverride} onChange={e => setPressureDesignOverride(e.target.value)} placeholder="Enter Pressure or Comment" />
                    </td>
                  </tr>
                </tbody>
              </table>`;

const oldTableStart = '<table className="rcr-table">';
const oldTableEnd = '</table>';

const startIndex = content.indexOf(oldTableStart);
// Find the first </table> after the start index
const endIndex = content.indexOf(oldTableEnd, startIndex) + oldTableEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newTable + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated table to 4 rows');
} else {
  console.error('Could not find the table to replace');
}
