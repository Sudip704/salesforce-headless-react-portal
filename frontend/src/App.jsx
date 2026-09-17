import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import './App.css';

const API_BASE = 'https://salesforce-headless-react-portal.onrender.com/api/cases';

export default function App() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '', priority: 'Medium' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(API_BASE);
      setCases(res.data);
    } catch (err) {
      setError('Unable to load cases from Salesforce.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(API_BASE, formData);
      setFormData({ subject: '', description: '', priority: 'Medium' });
      setIsModalOpen(false);
      fetchCases();
    } catch (err) {
      alert('Failed to submit case. Please verify Salesforce permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const isClosed = status?.toLowerCase() === 'closed';
    return (
      <span className={`status-badge ${isClosed ? 'badge-closed' : 'badge-open'}`}>
        {isClosed ? <CheckCircle2 size={14} /> : <Clock size={14} />}
        {status}
      </span>
    );
  };

  return (
    <div className="portal-container">
      <header className="portal-header">
        <div>
          <h1>Customer Support Portal</h1>
          <p className="subtitle">Powered by Salesforce Headless Architecture</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchCases} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusCircle size={16} />
            New Ticket
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <main className="content-card">
        {loading ? (
          <div className="loading-state">Fetching records from Salesforce...</div>
        ) : cases.length === 0 ? (
          <div className="empty-state">No cases found. Create your first support ticket above.</div>
        ) : (
          <table className="case-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.Id}>
                  <td className="case-number">{c.CaseNumber}</td>
                  <td className="case-subject">{c.Subject}</td>
                  <td>{getStatusBadge(c.Status)}</td>
                  <td>{new Date(c.CreatedDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Create Support Ticket</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken hardware"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="4"
                  placeholder="Provide more details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting to Salesforce...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}