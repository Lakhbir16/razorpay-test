const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const razorpayService = require('../services/razorpay');
const storage = require('../storage');

// Helper to retrieve merchant by accountId
function getMerchantOrThrow(accountId) {
  if (!accountId) {
    throw new Error('accountId query or body param is required');
  }
  const merchant = storage.getMerchant(accountId);
  if (!merchant) {
    throw new Error(`Merchant with account ID ${accountId} not found in connected merchants`);
  }
  if (!merchant.access_token) {
    throw new Error(`Merchant ${accountId} does not have a valid access_token`);
  }
  return merchant;
}

// Create an Order on behalf of connected sub-merchant
router.post('/create-order', async (req, res) => {
  try {
    const { accountId, amount, currency = 'INR', receipt, notes } = req.body;
    const merchant = getMerchantOrThrow(accountId);

    const orderPayload = {
      amount: Math.round(Number(amount) * 100), // convert to paise
      currency: currency.toUpperCase(),
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {
        partner_integration: 'Razorpay Tech Partner OAuth',
        account_id: accountId
      }
    };

    console.log(`Creating order for merchant ${accountId}:`, orderPayload);
    const order = await razorpayService.createOrder(merchant.access_token, orderPayload);

    // Return the created order along with merchant's public_token for client-side checkout
    res.json({
      order,
      public_token: merchant.public_token,
      merchant_account_id: merchant.razorpay_account_id
    });
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error('Create Order Error:', errorData);
    res.status(err.response?.status || 500).json({ error: errorData });
  }
});

// List Sub-Merchant Orders
router.get('/orders', async (req, res) => {
  try {
    const { accountId, count = 10 } = req.query;
    const merchant = getMerchantOrThrow(accountId);

    const orders = await razorpayService.listOrders(merchant.access_token, count);
    res.json(orders);
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error('List Orders Error:', errorData);
    res.status(err.response?.status || 500).json({ error: errorData });
  }
});

// List Sub-Merchant Payments
router.get('/list', async (req, res) => {
  try {
    const { accountId, count = 10 } = req.query;
    const merchant = getMerchantOrThrow(accountId);

    const payments = await razorpayService.listPayments(merchant.access_token, count);
    res.json(payments);
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error('List Payments Error:', errorData);
    res.status(err.response?.status || 500).json({ error: errorData });
  }
});

// Fetch Single Payment (Fallback / Verification API)
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { accountId } = req.query;
    const merchant = getMerchantOrThrow(accountId);

    const payment = await razorpayService.fetchPayment(merchant.access_token, paymentId);
    res.json(payment);
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error('Fetch Payment Error:', errorData);
    res.status(err.response?.status || 500).json({ error: errorData });
  }
});

// Issue Refund for a Payment
router.post('/:paymentId/refund', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { accountId, amount, speed = 'normal', notes } = req.body;
    const merchant = getMerchantOrThrow(accountId);

    const refundPayload = {};
    if (amount) {
      refundPayload.amount = Math.round(Number(amount) * 100);
    }
    if (speed) {
      refundPayload.speed = speed;
    }
    if (notes) {
      refundPayload.notes = notes;
    }

    const refund = await razorpayService.issueRefund(merchant.access_token, paymentId, refundPayload);
    res.json(refund);
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error('Issue Refund Error:', errorData);
    res.status(err.response?.status || 500).json({ error: errorData });
  }
});

// Fetch Refund Details
router.get('/refunds/:refundId', async (req, res) => {
  try {
    const { refundId } = req.params;
    const { accountId } = req.query;
    const merchant = getMerchantOrThrow(accountId);

    const refund = await razorpayService.fetchRefund(merchant.access_token, refundId);
    res.json(refund);
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error('Fetch Refund Error:', errorData);
    res.status(err.response?.status || 500).json({ error: errorData });
  }
});

module.exports = router;
