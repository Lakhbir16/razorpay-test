import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Radio, RefreshCw, Trash2, ShieldAlert, CheckCircle, Zap, Info } from 'lucide-react';

const REQUIRED_EVENTS = [
  { name: 'payment.authorized', desc: 'Triggered when a payment is authorized by customer bank' },
  { name: 'payment.captured', desc: 'Triggered when payment is successfully captured' },
  { name: 'payment.failed', desc: 'Triggered when customer payment attempt fails' },
  { name: 'refund.processed', desc: 'Triggered when a refund is successfully processed' },
  { name: 'refund.failed', desc: 'Triggered when refund processing fails' },
  { name: 'account.app.authorization_revoked', desc: 'CRITICAL: Triggered when a sub-merchant disconnects your Partner app' }
];

export default function WebhooksTab({ config, selectedMerchant, onRefreshMerchants }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedEventToSimulate, setSelectedEventToSimulate] = useState('payment.captured');
  const [activeLog, setActiveLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getWebhookLogs();
      setLogs(data);
      if (data.length > 0 && !activeLog) {
        setActiveLog(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    await api.clearWebhookLogs();
    setLogs([]);
    setActiveLog(null);
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await api.simulateWebhook({
        event: selectedEventToSimulate,
        accountId: selectedMerchant ? selectedMerchant.razorpay_account_id : 'acc_test_demo123',
        paymentId: `pay_${Date.now().toString().slice(-8)}`,
        amount: 50000 // Rs. 500
      });
      await fetchLogs();
      if (selectedEventToSimulate === 'account.app.authorization_revoked' && onRefreshMerchants) {
        onRefreshMerchants();
      }
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div>
      {/* Webhook Configuration Guide */}
      <div className="card">
        <h2 className="card-title">
          <Radio size={20} color="#0284c7" />
          Webhook Listener & Signature Verification
        </h2>
        <p className="card-desc">
          Configure this URL in your Razorpay Partner Application settings to receive real-time updates.
        </p>

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Webhook Endpoint URL:</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, fontFamily: 'monospace', color: '#0f172a', marginTop: '2px' }}>
                http://localhost:5000/api/webhooks/razorpay
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              For public testing, expose port 5000 via <code>ngrok http 5000</code>
            </div>
          </div>
        </div>

        {/* Required Webhook Events List */}
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Supported Events from Tech Partner Email:
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {REQUIRED_EVENTS.map((ev) => (
            <div
              key={ev.name}
              style={{
                background: ev.name.includes('revoked') ? '#fef2f2' : '#f8fafc',
                border: ev.name.includes('revoked') ? '1px solid #fecaca' : '1px solid #e2e8f0',
                padding: '0.75rem',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <CheckCircle size={15} color={ev.name.includes('revoked') ? '#dc2626' : '#10b981'} />
                <code style={{ fontSize: '0.825rem', fontWeight: 700 }}>{ev.name}</code>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{ev.desc}</p>
            </div>
          ))}
        </div>

        {/* Webhook Simulator */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} /> Webhook Event Simulator (Local Test)
              </strong>
              <p style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '2px' }}>
                Test your backend handling without waiting for a live transaction or ngrok tunnel.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                className="form-select"
                style={{ fontSize: '0.85rem', width: 'auto' }}
                value={selectedEventToSimulate}
                onChange={(e) => setSelectedEventToSimulate(e.target.value)}
              >
                {REQUIRED_EVENTS.map(ev => (
                  <option key={ev.name} value={ev.name}>{ev.name}</option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                style={{ background: '#16a34a' }}
                disabled={simulating}
                onClick={handleSimulate}
              >
                {simulating ? 'Simulating...' : 'Trigger Simulated Webhook'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook History & Inspector */}
      <div className="card">
        <div className="card-title-row">
          <h2 className="card-title">
            Received Webhook Logs ({logs.length})
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-sm btn-secondary" onClick={fetchLogs} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button className="btn btn-sm btn-danger" onClick={handleClearLogs} disabled={logs.length === 0}>
              <Trash2 size={13} /> Clear
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">
            <Radio className="empty-state-icon" />
            <p style={{ fontWeight: 600 }}>No Webhooks Received Yet</p>
            <p style={{ fontSize: '0.85rem' }}>
              Use the simulator above or perform a test payment to see live webhooks appear here.
            </p>
          </div>
        ) : (
          <div className="grid-2">
            {/* List column */}
            <div style={{ maxHeight: '420px', overflowY: 'auto', borderRight: '1px solid #e2e8f0', paddingRight: '1rem' }}>
              {logs.map((log) => {
                const isSelected = activeLog?.id === log.id;
                const isRevoked = log.event === 'account.app.authorization_revoked';

                return (
                  <div
                    key={log.id}
                    onClick={() => setActiveLog(log)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#f0f9ff' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`status-badge ${isRevoked ? 'danger' : 'active'}`}>
                        {log.event}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(log.received_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.785rem', color: '#64748b', marginTop: '0.35rem' }}>
                      Account: <code>{log.accountId || 'N/A'}</code>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payload inspector */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Payload Inspector:
              </div>
              {activeLog ? (
                <pre className="json-box">
                  {JSON.stringify(activeLog.payload, null, 2)}
                </pre>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Select an event on the left to inspect</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
