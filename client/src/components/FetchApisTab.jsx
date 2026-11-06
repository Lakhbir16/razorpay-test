import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, RotateCcw, ListFilter, AlertCircle, ArrowRight } from 'lucide-react';

export default function FetchApisTab({ selectedMerchant, initialPaymentId = '' }) {
  const [activeApi, setActiveApi] = useState('fetchPayment'); // fetchPayment, fetchRefund, issueRefund, listOrders, listPayments
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [refundId, setRefundId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundSpeed, setRefundSpeed] = useState('normal');

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialPaymentId) {
      setPaymentId(initialPaymentId);
      setActiveApi('fetchPayment');
    }
  }, [initialPaymentId]);

  if (!selectedMerchant) {
    return (
      <div className="card">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" color="#f59e0b" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Sub-Merchant Selected</h3>
          <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
            Please select a connected sub-merchant in the "OAuth & Sub-Merchants" tab first to query their payment data.
          </p>
        </div>
      </div>
    );
  }

  const handleExecute = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setApiResponse(null);
    setLoading(true);

    try {
      let result;
      const accountId = selectedMerchant.razorpay_account_id;

      if (activeApi === 'fetchPayment') {
        if (!paymentId) throw new Error('Please enter a Payment ID');
        result = await api.fetchPayment(accountId, paymentId.trim());
      } else if (activeApi === 'fetchRefund') {
        if (!refundId) throw new Error('Please enter a Refund ID');
        result = await api.fetchRefund(accountId, refundId.trim());
      } else if (activeApi === 'issueRefund') {
        if (!paymentId) throw new Error('Please enter a Payment ID');
        result = await api.issueRefund(accountId, paymentId.trim(), {
          amount: refundAmount ? Number(refundAmount) : undefined,
          speed: refundSpeed
        });
      } else if (activeApi === 'listOrders') {
        result = await api.listOrders(accountId, 10);
      } else if (activeApi === 'listPayments') {
        result = await api.listPayments(accountId, 10);
      }

      setApiResponse(result);
    } catch (err) {
      setErrorMsg(`API Request Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Fallback Notice */}
      <div className="banner" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <div>
          <strong>Fallback Query APIs:</strong> Razorpay recommends using these direct Fetch APIs whenever webhooks are delayed or disabled.
          All requests are signed with sub-merchant Bearer Token.
        </div>
      </div>

      {errorMsg && (
        <div className="banner danger">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => setErrorMsg('')}>Dismiss</button>
        </div>
      )}

      {/* API Selector */}
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <button
            className={`btn ${activeApi === 'fetchPayment' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveApi('fetchPayment'); setApiResponse(null); }}
          >
            <Search size={15} /> Fetch Payment (by ID)
          </button>
          <button
            className={`btn ${activeApi === 'fetchRefund' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveApi('fetchRefund'); setApiResponse(null); }}
          >
            <Search size={15} /> Fetch Refund (by ID)
          </button>
          <button
            className={`btn ${activeApi === 'issueRefund' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveApi('issueRefund'); setApiResponse(null); }}
          >
            <RotateCcw size={15} /> Issue Refund
          </button>
          <button
            className={`btn ${activeApi === 'listOrders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveApi('listOrders'); setApiResponse(null); }}
          >
            <ListFilter size={15} /> List Recent Orders
          </button>
          <button
            className={`btn ${activeApi === 'listPayments' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveApi('listPayments'); setApiResponse(null); }}
          >
            <ListFilter size={15} /> List Recent Payments
          </button>
        </div>

        {/* Dynamic Form based on selected API */}
        <form onSubmit={handleExecute}>
          {activeApi === 'fetchPayment' && (
            <div className="form-group">
              <label className="form-label">Razorpay Payment ID (e.g. pay_xxxxxxxxxxxxxx) *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="pay_xxxxxxxxxxxxxx"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Endpoint: <code>GET https://api.razorpay.com/v1/payments/:id</code>
              </span>
            </div>
          )}

          {activeApi === 'fetchRefund' && (
            <div className="form-group">
              <label className="form-label">Razorpay Refund ID (e.g. rfd_xxxxxxxxxxxxxx) *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="rfd_xxxxxxxxxxxxxx"
                value={refundId}
                onChange={(e) => setRefundId(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Endpoint: <code>GET https://api.razorpay.com/v1/refunds/:id</code>
              </span>
            </div>
          )}

          {activeApi === 'issueRefund' && (
            <div>
              <div className="form-group">
                <label className="form-label">Payment ID to Refund *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="pay_xxxxxxxxxxxxxx"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Refund Amount in Rupees (Optional, leave blank for full refund)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 50"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Refund Speed</label>
                  <select
                    className="form-select"
                    value={refundSpeed}
                    onChange={(e) => setRefundSpeed(e.target.value)}
                  >
                    <option value="normal">Normal (Instant or Standard)</option>
                    <option value="optimum">Optimum</option>
                  </select>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Endpoint: <code>POST https://api.razorpay.com/v1/payments/:id/refund</code>
              </span>
            </div>
          )}

          {(activeApi === 'listOrders' || activeApi === 'listPayments') && (
            <div style={{ padding: '0.5rem 0', color: '#64748b', fontSize: '0.85rem' }}>
              Fetching last 10 records for sub-merchant <code>{selectedMerchant.razorpay_account_id}</code>.
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Executing API Request...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Response Box */}
      {apiResponse && (
        <div className="card">
          <div className="card-title-row">
            <h3 className="card-title" style={{ fontSize: '1rem' }}>
              API Response Data
            </h3>
            <span className="status-badge success">200 OK</span>
          </div>
          <pre className="json-box">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
