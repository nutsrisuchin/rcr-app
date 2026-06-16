import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { FilePlus, LayoutList } from 'lucide-react';
import pttgcLogo from '../assets/PTTGC_Logo.png';

const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#a142f4', '#24c1e0'];

const Dashboard = () => {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    api.get('/requests')
      .then(res => setRequests(res.data))
      .catch(err => console.error(err));
  }, []);

  // Compute Plant stats
  const plantDataMap: Record<string, number> = {};
  let pendingCount = 0;

  requests.forEach(r => {
    plantDataMap[r.plant] = (plantDataMap[r.plant] || 0) + 1;
    if (r.status === 'Pending') {
      pendingCount++;
    }
  });

  const plantChartData = Object.keys(plantDataMap).map(k => ({ name: k, count: plantDataMap[k] }));

  return (
    <div className="dashboard-container">
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem', marginTop: '1rem' }}>
        <img src={pttgcLogo} alt="PTTGC Logo" style={{ height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }} />
      </div>

      {/* Massive Action Cards */}
      <div className="dashboard-actions">
        <Link to="/forms/new" className="action-card glass">
          <FilePlus size={48} />
          <span>Create New Request</span>
        </Link>
        <Link to="/forms" className="action-card glass">
          <LayoutList size={48} />
          <span>Manage Requests</span>
        </Link>
      </div>

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2>Dashboard Insights</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div className="stat-card">
            <h3>Total Requests</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>{requests.length}</p>
          </div>
          <div className="stat-card">
            <h3>Plants Active</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>{plantChartData.length}</p>
          </div>
          <div className="stat-card">
            <h3>Pending RCR for approval</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ea4335' }}>{pendingCount}</p>
          </div>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
          <div className="glass" style={{ padding: '2rem', height: '400px' }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Requests by Plant</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={plantChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent ? percent * 100 : 0).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {plantChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
