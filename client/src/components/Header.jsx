import React from 'react';
import { ShieldCheck, Server, AlertCircle } from 'lucide-react';

export default function Header({ config, serverStatus, selectedMerchant, merchants, onSelectMerchant }) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="header-logo-badge">Razorpay</span>
          <div>
            <h1 className="header-title">Tech Partner Integration Console</h1>
            <p style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '2px' }}>
              OAuth Bearer Token Flow & Sub-Merchant Gateway Testing
            </p>
          </div>
        </div>

        <div className="header-partner-info">
          {/* Partner MID */}
          <div className="partner-mid-pill" title="Your Official Razorpay Tech Partner MID">
            <ShieldCheck size={16} color="#60a5fa" />
            <span>Partner MID: <code>JZjo2exOZH0VR5</code></span>
          </div>

          {/* Server Status */}
          <div className="partner-mid-pill">
            <Server size={15} color={serverStatus ? '#4ade80' : '#f87171'} />
            <span>Backend: {serverStatus ? 'Online (5000)' : 'Offline'}</span>
          </div>

          {/* Active Merchant Selector */}
          {merchants && merchants.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Active Merchant:</span>
              <select
                className="form-select"
                style={{
                  padding: '0.3rem 0.6rem',
                  fontSize: '0.8rem',
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                  borderRadius: '6px'
                }}
                value={selectedMerchant ? selectedMerchant.razorpay_account_id : ''}
                onChange={(e) => {
                  const m = merchants.find(item => item.razorpay_account_id === e.target.value);
                  onSelectMerchant(m || null);
                }}
              >
                {merchants.map(m => (
                  <option key={m.razorpay_account_id} value={m.razorpay_account_id}>
                    {m.razorpay_account_id} ({m.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
