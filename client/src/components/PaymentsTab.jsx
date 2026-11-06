import React, { useState } from 'react';
import { api } from '../services/api';
import { CreditCard, ShoppingCart, CheckCircle2, AlertCircle, ArrowRight, CornerDownRight } from 'lucide-react';

export default function PaymentsTab({ selectedMerchant, onNavigateToFetch }) {
  const [amount, setAmount] = useState('100'); // in INR (100 rupees)
  const [currency, setCurrency] = useState('INR');
  const [receipt, setReceipt] = useState(`order_rcpt_${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('Payment via Tech Partner OAuth');

  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!selectedMerchant) {
    return (
      <div className="card">
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" color="#f59e0b" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Sub-Merchant Selected</h3>
          <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
            Please select or connect a sub-merchant in the "OAuth & Sub-Merchants" tab first to test payments on their behalf.
          </p>
        </div>
      </div>
    );
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setPaymentResult(null);
    setLoadingOrder(true);

    try {
      const res = await api.createOrder({
        accountId: selectedMerchant.razorpay_account_id,
        amount: Number(amount),
        currency,
        receipt,
        notes: { note: notes, merchant_id: selectedMerchant.razorpay_account_id }
      });
      setOrderResult(res);
    } catch (err) {
      setErrorMsg(`Failed to create order: ${err.message}`);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleLaunchCheckout = () => {
    if (!orderResult || !orderResult.order) {
      setErrorMsg('Please create an order first');
      return;
    }

    if (!window.Razorpay) {
      setErrorMsg('Razorpay Checkout SDK is not loaded. Check internet connection.');
      return;
    }

    const { order, public_token } = orderResult;
    const checkoutKey = public_token || selectedMerchant.public_token;

    if (!checkoutKey) {
      setErrorMsg('No public_token found for this merchant. public_token is required for client Checkout.');
      return;
    }

    const options = {
      key: checkoutKey, // Sub-merchant public token received during OAuth exchange!
      amount: order.amount,
      currency: order.currency,
      name: 'Tech Partner Test Store',
      description: `Test Order on behalf of ${selectedMerchant.razorpay_account_id}`,
      order_id: order.id,
      handler: function (response) {
        console.log('Payment Success:', response);
        setPaymentResult({
          status: 'success',
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          amount: order.amount / 100,
          currency: order.currency
        });
      },
      prefill: {
        name: 'Test Customer',
        email: 'customer@example.com',
        contact: '9999999999'
      },
      notes: {
        merchant_account_id: selectedMerchant.razorpay_account_id
      },
      theme: {
        color: '#0284c7'
      },
      modal: {
        ondismiss: function () {
          console.log('Checkout modal closed without completing payment');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment Failed:', response.error);
        setPaymentResult({
          status: 'failed',
          error: response.error
        });
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(`Failed to open Razorpay Checkout: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Merchant Notice */}
      <div className="banner" style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0369a1' }}>
        <div>
          <strong>Active Sub-Merchant Context:</strong> <code>{selectedMerchant.razorpay_account_id}</code>
          <span style={{ marginLeft: '1rem', fontSize: '0.825rem' }}>
            Authorization Mode: <strong>Bearer Token</strong> (Tech Partner OAuth)
          </span>
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

      <div className="grid-2">
        {/* Step 1: Create Order */}
        <div className="card">
          <h2 className="card-title">
            <ShoppingCart size={20} color="#0284c7" />
            1. Create Order (Bearer Token)
          </h2>
          <p className="card-desc">
            Calls <code>POST /v1/orders</code> with header <code>Authorization: Bearer &lt;access_token&gt;</code>
          </p>

          <form onSubmit={handleCreateOrder}>
            <div className="form-group">
              <label className="form-label">Amount (in Rupees)</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Receipt Identifier</label>
              <input
                type="text"
                className="form-input"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Order Notes</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loadingOrder}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loadingOrder ? 'Creating Order on Razorpay...' : 'Create Order on Sub-Merchant'}
            </button>
          </form>

          {orderResult && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <strong style={{ fontSize: '0.9rem', color: '#065f46' }}>Order Created Successfully</strong>
              </div>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                <div><strong>Order ID:</strong> <code>{orderResult.order.id}</code></div>
                <div><strong>Amount:</strong> ₹{orderResult.order.amount / 100} {orderResult.order.currency}</div>
                <div><strong>Status:</strong> {orderResult.order.status}</div>
                <div><strong>Public Token:</strong> <code>{orderResult.public_token}</code></div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Pay with Razorpay Checkout */}
        <div className="card">
          <h2 className="card-title">
            <CreditCard size={20} color="#0284c7" />
            2. Customer Checkout Experience
          </h2>
          <p className="card-desc">
            Uses the sub-merchant's <code>public_token</code> to open the standard Razorpay payment modal.
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
              {orderResult
                ? `Ready to test payment for Order ${orderResult.order.id} (₹${amount})`
                : 'Create an order on the left first to activate checkout'}
            </p>

            <button
              className="btn btn-primary"
              disabled={!orderResult}
              onClick={handleLaunchCheckout}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#2563eb' }}
            >
              <CreditCard size={18} />
              Open Razorpay Checkout Modal
            </button>

            {/* Test Credentials Helper */}
            <div style={{ marginTop: '1rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.75rem', textAlign: 'left', fontSize: '0.785rem' }}>
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>💡 Razorpay Test Sandbox Credentials:</div>
              <ul style={{ paddingLeft: '1.1rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <li><strong>Test Card:</strong> <code>4111 1111 1111 1111</code> | Exp: Any future (e.g. <code>12/28</code>) | CVV: <code>123</code> | OTP: <code>123456</code></li>
                <li><strong>Netbanking:</strong> Select any bank (SBI, HDFC, ICICI) ➔ Click Success.</li>
                <li><strong>UPI (when active on merchant):</strong> VPA <code>success@razorpay</code> or <code>failure@razorpay</code></li>
              </ul>
            </div>
          </div>

          {/* Payment Success Card */}
          {paymentResult && paymentResult.status === 'success' && (
            <div style={{ marginTop: '1.5rem', background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={20} />
                <h4 style={{ fontWeight: 700 }}>Payment Captured Successfully!</h4>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#064e3b', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Payment ID:</strong> <code>{paymentResult.razorpay_payment_id}</code></div>
                <div><strong>Order ID:</strong> <code>{paymentResult.razorpay_order_id}</code></div>
                <div><strong>Signature:</strong> <code>{paymentResult.razorpay_signature}</code></div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onNavigateToFetch && onNavigateToFetch(paymentResult.razorpay_payment_id)}
                >
                  <ArrowRight size={14} />
                  Fetch Payment Details (API Fallback)
                </button>
              </div>
            </div>
          )}

          {/* Payment Failed Card */}
          {paymentResult && paymentResult.status === 'failed' && (
            <div style={{ marginTop: '1.5rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem' }}>
              <h4 style={{ color: '#991b1b', fontWeight: 700, marginBottom: '0.5rem' }}>Payment Failed</h4>
              <pre className="json-box" style={{ maxHeight: '150px' }}>
                {JSON.stringify(paymentResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Raw Order Payload Viewer */}
      {orderResult && (
        <div className="card">
          <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
            <CornerDownRight size={16} /> Raw Order API Response from Razorpay:
          </h3>
          <pre className="json-box" style={{ marginTop: '0.5rem' }}>
            {JSON.stringify(orderResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
