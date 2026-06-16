import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Edit, Trash2, CheckCircle, Printer } from 'lucide-react';

const ManageRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchRequests = () => {
    api.get('/requests')
      .then(res => setRequests(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await api.delete(`/requests/${id}`);
        fetchRequests();
      } catch (err) {
        console.error('Error deleting request', err);
        alert('Failed to delete request.');
      }
    }
  };

  const handleApprove = async (id: number) => {
    const approverName = window.prompt("Enter Approver Name (Supervisor):");
    if (!approverName || approverName.trim() === '') {
      alert('Approval cancelled. A name is required.');
      return;
    }
    
    try {
      await api.put(`/requests/${id}/approve`, { approver_name: approverName.trim() });
      fetchRequests();
      alert('Request Approved Successfully!');
    } catch (err) {
      console.error('Error approving request', err);
      alert('Failed to approve request.');
    }
  };

  return (
    <div className="manage-container">
      <div className="glass" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Manage Saved Requests</h2>
          <button className="btn-primary" onClick={() => navigate('/forms/new')}>Create New</button>
        </div>

        {requests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No requests found. Create one to get started!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="rcr-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Topic</th>
                  <th>Plant / Unit</th>
                  <th>Piping Class</th>
                  <th>Engineer</th>
                  <th>Status</th>
                  <th>Approver</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.date || new Date(req.created_at).toISOString().split('T')[0]}</td>
                    <td style={{ fontWeight: '500' }}>{req.topic || '-'}</td>
                    <td>{req.plant} / {req.unit || '-'}</td>
                    <td>{req.piping_class}</td>
                    <td>{req.inspection_engineer || '-'}</td>
                    <td>
                      <span className={`status-badge ${req.status === 'Approved' ? 'status-approved' : 'status-pending'}`}>
                        {req.status || 'Pending'}
                      </span>
                    </td>
                    <td>{req.approver_name || '-'}</td>
                    <td style={{ display: 'flex', gap: '10px' }}>
                      {req.status === 'Approved' && (
                        <button 
                          onClick={() => window.open(`/forms/edit/${req.id}?print=true`, '_blank')} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a73e8' }}
                          title="Print / Download PDF"
                        >
                          <Printer size={18} />
                        </button>
                      )}
                      {req.status !== 'Approved' && (
                        <button 
                          onClick={() => handleApprove(req.id)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a' }}
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/forms/edit/${req.id}`)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(req.id)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea4335' }}
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRequests;
