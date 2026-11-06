import React, { useState } from 'react';
import { api } from '../services/api';
import { Link2, RefreshCw, Trash2, Key, CheckCircle, AlertTriangle, Plus, ExternalLink } from 'lucide-react';

export default function MerchantsTab({
  merchants,
  selectedMerchant,
  onSelectMerchant,
  onRefreshList,
  config
}) {
  const [loadingConnect, setLoadingConnect] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeInputValue, setCodeInputValue] = useState('');
  const [exchangingCode, setExchangingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Manual token form state
  const [manualData, setManualData] = useState({
    razorpay_account_id: '',
    access_token: '',
    public_token: '',
    refresh_token: ''
  });

  const handleConnectOAuth = async () => {
    setErrorMsg('');
    setLoadingConnect(true);
    try {
      const data = await api.getConnectUrl();
      if (data.url) {
        // Redirect to Razorpay OAuth consent screen
        window.location.href = data.url;
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate OAuth URL. Check server .env settings.');
    } finally {
      setLoadingConnect(false);
    }
  };

  const handleRefreshToken = async (accountId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setRefreshingId(accountId);
    try {
      const res = await api.refreshToken(accountId);
      setSuccessMsg(`Token for ${accountId} refreshed successfully!`);
      onRefreshList();
    } catch (err) {
      setErrorMsg(`Failed to refresh token: ${err.message}`);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDeleteMerchant = async (accountId) => {
    if (!window.confirm(`Are you sure you want to disconnect sub-merchant ${accountId}?`)) {
      return;
    }
    try {
      await api.deleteMerchant(accountId);
      onRefreshList();
    } catch (err) {
      setErrorMsg(`Failed to remove merchant: ${err.message}`);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.manualAddMerchant(manualData);
      setSuccessMsg(`Sub-merchant ${manualData.razorpay_account_id} added manually.`);
      setShowManualModal(false);
      setManualData({ razorpay_account_id: '', access_token: '', public_token: '', refresh_token: '' });
      onRefreshList();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleExchangeCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setExchangingCode(true);

    try {
      let codeToUse = codeInputValue.trim();
      // If user pasted full callback URL, extract code query param
      if (codeToUse.includes('code=')) {
        const urlObj = new URL(codeToUse);
        codeToUse = urlObj.searchParams.get('code') || codeToUse;
      }

      const res = await api.exchangeCode(codeToUse);
      setSuccessMsg(`Success! Connected Sub-Merchant: ${res.merchant.razorpay_account_id}`);
      setShowCodeModal(false);
      setCodeInputValue('');
      onRefreshList();
    } catch (err) {
      setErrorMsg(`Code exchange failed: ${err.message}`);
    } finally {
      setExchangingCode(false);
    }
  };

  return (
    <div>
      {/* Alert Banners */}
      {errorMsg && (
        <div className="banner danger">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setErrorMsg('')}>Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="banner success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setSuccessMsg('')}>Dismiss</button>
        </div>
      )}

      {!config?.hasClientId && (
        <div className="banner warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>
              <strong>Action Required:</strong> <code>RAZORPAY_CLIENT_ID</code> and <code>RAZORPAY_CLIENT_SECRET</code> are not configured yet in <code>server/.env</code>.
              Please add your partner OAuth credentials from the Razorpay Dashboard.
            </span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="card">
        <div className="card-title-row">
          <div>
            <h2 className="card-title">
              <Key size={20} color="#0284c7" />
              Sub-Merchant Onboarding (OAuth 2.0 Flow)
            </h2>
            <p className="card-desc" style={{ marginTop: '4px' }}>
              Sub-merchants authenticate via Razorpay's OAuth service to grant your Partner app <code>read_write</code> scope.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowCodeModal(true)}
              title="Paste authorization code or full callback URL to exchange for tokens"
            >
              <ExternalLink size={16} />
              Paste Code / URL
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowManualModal(true)}
            >
              <Plus size={16} />
              Manual Add Token
            </button>
            <button
              className="btn btn-primary"
              disabled={loadingConnect || !config?.hasClientId}
              onClick={handleConnectOAuth}
            >
              <Link2 size={16} />
              {loadingConnect ? 'Generating Link...' : 'Connect Sub-Merchant Account'}
            </button>
          </div>
        </div>

        {/* OAuth Step Summary */}
        <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          <strong>How OAuth works for Tech Partners:</strong>
          <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <li>Click <strong>Connect Sub-Merchant Account</strong> to redirect to Razorpay's OAuth Authorize URL.</li>
            <li>Sub-merchant logs in and grants permission (scope: <code>read_write</code>).</li>
            <li>Razorpay redirects back with an authorization <code>code</code>.</li>
            <li>Our backend exchanges the code for <code>access_token</code> (Bearer token), <code>public_token</code>, and <code>refresh_token</code>.</li>
            <li>Access token is valid for 90 days. A cron or refresh button refreshes it before expiry.</li>
          </ol>
        </div>
      </div>

      {/* Connected Merchants List */}
      <div className="card">
        <div className="card-title-row">
          <h2 className="card-title">
            Connected Sub-Merchants ({merchants.length})
          </h2>
          <button className="btn btn-sm btn-secondary" onClick={onRefreshList}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {merchants.length === 0 ? (
          <div className="empty-state">
            <Key className="empty-state-icon" />
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>No Sub-Merchants Connected Yet</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.35rem' }}>
              Connect your first sub-merchant using the OAuth button above or manually add tokens.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sub-Merchant Account ID</th>
                  <th>Status</th>
                  <th>Public Token</th>
                  <th>Bearer Access Token</th>
                  <th>Token Expiry</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => {
                  const isSelected = selectedMerchant?.razorpay_account_id === m.razorpay_account_id;
                  const isRevoked = m.status === 'revoked';

                  return (
                    <tr
                      key={m.razorpay_account_id}
                      style={{ background: isSelected ? '#f0f9ff' : 'transparent' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {m.razorpay_account_id}
                          </span>
                          {isSelected && (
                            <span className="status-badge success" style={{ fontSize: '0.7rem' }}>
                              Selected
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${isRevoked ? 'danger' : 'active'}`}>
                          {m.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          {m.public_token ? `${m.public_token.slice(0, 10)}...` : 'N/A'}
                        </code>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                          {m.access_token ? `${m.access_token.slice(0, 8)}...${m.access_token.slice(-6)}` : 'N/A'}
                        </code>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {m.expires_at ? new Date(m.expires_at).toLocaleDateString() : '90 Days'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {!isSelected && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => onSelectMerchant(m)}
                              title="Select this merchant for testing APIs & checkout"
                            >
                              Select
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-secondary"
                            disabled={refreshingId === m.razorpay_account_id}
                            onClick={() => handleRefreshToken(m.razorpay_account_id)}
                            title="Refresh Access Token with Refresh Token"
                          >
                            <RefreshCw size={13} className={refreshingId === m.razorpay_account_id ? 'animate-spin' : ''} />
                            Refresh
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteMerchant(m.razorpay_account_id)}
                            title="Delete Sub-Merchant"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showManualModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Manually Add Sub-Merchant Tokens</h3>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowManualModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  If you already obtained tokens via Postman or Razorpay's API, you can paste them here to test immediately without re-running OAuth.
                </p>

                <div className="form-group">
                  <label className="form-label">Sub-Merchant Account ID (e.g. acc_xxxxxxxxxxxxxx) *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="acc_xxxxxxxxxxxxxx"
                    value={manualData.razorpay_account_id}
                    onChange={(e) => setManualData({ ...manualData, razorpay_account_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Access Token (Bearer token for API calls) *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="eyJhbGciOi..."
                    value={manualData.access_token}
                    onChange={(e) => setManualData({ ...manualData, access_token: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Public Token (Used for frontend Checkout)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="rzp_test_oauth_..."
                    value={manualData.public_token}
                    onChange={(e) => setManualData({ ...manualData, public_token: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Refresh Token (Used to refresh expired access tokens)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ref_..."
                    value={manualData.refresh_token}
                    onChange={(e) => setManualData({ ...manualData, refresh_token: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowManualModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Sub-Merchant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exchange Authorization Code Modal */}
      {showCodeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Exchange Authorization Code</h3>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowCodeModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleExchangeCode}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  Paste either the <strong>code</strong> or the <strong>full callback URL</strong> (e.g. <code>https://payzet.vercel.app/api/oauth/callback?code=...</code>).
                  The server will exchange it for tokens immediately.
                </p>

                <div className="form-group">
                  <label className="form-label">Authorization Code or Callback URL *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-textarea"
                    placeholder="Paste code=def502... or full https://payzet.vercel.app/api/oauth/callback?code=... URL"
                    value={codeInputValue}
                    onChange={(e) => setCodeInputValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCodeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={exchangingCode} className="btn btn-primary">
                  {exchangingCode ? 'Exchanging with Razorpay...' : 'Exchange for Tokens'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
