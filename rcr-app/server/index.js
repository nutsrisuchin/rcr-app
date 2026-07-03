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
    const rows = await db.getAllRequests();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single request
app.get('/api/requests/:id', async (req, res) => {
  try {
    const row = await db.getRequest(req.params.id);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new request
app.post('/api/requests', async (req, res) => {
  try {
    const result = await db.createRequest(req.body);
    res.status(201).json({ id: result.id, ...req.body, status: 'Pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update request
app.put('/api/requests/:id', async (req, res) => {
  try {
    const result = await db.updateRequest(req.params.id, req.body);
    res.json({ updated: result.updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Request
app.put('/api/requests/:id/approve', async (req, res) => {
  const { approver_name } = req.body;
  const date = new Date().toISOString().split('T')[0];

  try {
    await db.approveRequest(req.params.id, approver_name, date);
    res.json({ approved: true, approver_name, approved_date: date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete request
app.delete('/api/requests/:id', async (req, res) => {
  try {
    const result = await db.deleteRequest(req.params.id);
    res.json({ deleted: result.deleted });
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
