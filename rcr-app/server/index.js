const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Get all requests
app.get('/api/requests', async (req, res) => {
  try {
    const rows = await db.queryAll('SELECT * FROM requests ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single request
app.get('/api/requests/:id', async (req, res) => {
  try {
    const row = await db.queryGet('SELECT * FROM requests WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new request
app.post('/api/requests', async (req, res) => {
  const data = req.body;
  let query = `
    INSERT INTO requests (
      topic, checklist_data, plant, unit, line_no, piping_class, rcr_standard, drawing_no, material, 
      p_no, thickness, rating, production, services, nde_rt, nde_ut, nde_mpi, nde_dpi, nde_ht, nde_pmi,
      pwht, pwht_comment, design_temp, design_pressure, test_pressure, 
      insulation, coating_method, paint_code, wps_document, 
      repair_method, inspection_engineer, date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
  `;
  
  if (db.isPostgres) {
    query += ' RETURNING id';
  }

  const params = [
    data.topic, data.checklist_data, data.plant, data.unit, data.line_no, data.piping_class, data.rcr_standard, 
    data.drawing_no, data.material, data.p_no, data.thickness, data.rating, 
    data.production, data.services, data.nde_rt, data.nde_ut, data.nde_mpi, data.nde_dpi, data.nde_ht, data.nde_pmi,
    data.pwht, data.pwht_comment, data.design_temp, data.design_pressure, 
    data.test_pressure, data.insulation, data.coating_method, data.paint_code, 
    data.wps_document, data.repair_method, data.inspection_engineer, data.date
  ];

  try {
    const result = await db.queryRun(query, params);
    res.status(201).json({ id: result.lastID, ...data, status: 'Pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update request
app.put('/api/requests/:id', async (req, res) => {
  const data = req.body;
  const query = `
    UPDATE requests SET 
      topic = ?, checklist_data = ?, plant = ?, unit = ?, line_no = ?, piping_class = ?, rcr_standard = ?, drawing_no = ?, 
      material = ?, p_no = ?, thickness = ?, rating = ?, production = ?, services = ?, 
      nde_rt = ?, nde_ut = ?, nde_mpi = ?, nde_dpi = ?, nde_ht = ?, nde_pmi = ?,
      pwht = ?, pwht_comment = ?, design_temp = ?, design_pressure = ?, test_pressure = ?, 
      insulation = ?, coating_method = ?, paint_code = ?, wps_document = ?, 
      repair_method = ?, inspection_engineer = ?, date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  const params = [
    data.topic, data.checklist_data, data.plant, data.unit, data.line_no, data.piping_class, data.rcr_standard, 
    data.drawing_no, data.material, data.p_no, data.thickness, data.rating, 
    data.production, data.services, data.nde_rt, data.nde_ut, data.nde_mpi, data.nde_dpi, data.nde_ht, data.nde_pmi,
    data.pwht, data.pwht_comment, data.design_temp, data.design_pressure, 
    data.test_pressure, data.insulation, data.coating_method, data.paint_code, 
    data.wps_document, data.repair_method, data.inspection_engineer, data.date,
    req.params.id
  ];

  try {
    const result = await db.queryRun(query, params);
    res.json({ updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Request
app.put('/api/requests/:id/approve', async (req, res) => {
  const { approver_name } = req.body;
  const date = new Date().toISOString().split('T')[0];
  
  try {
    await db.queryRun(
      'UPDATE requests SET status = ?, approver_name = ?, approved_date = ? WHERE id = ?',
      ['Approved', approver_name, date, req.params.id]
    );
    res.json({ approved: true, approver_name, approved_date: date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete request
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const result = await db.queryRun('DELETE FROM requests WHERE id = ?', [req.params.id]);
    res.json({ deleted: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files from the React frontend build
const staticPath = path.join(__dirname, '../dist');
app.use(express.static(staticPath));

// Catch-all route to serve index.html for SPA client-side routing
app.use((req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
