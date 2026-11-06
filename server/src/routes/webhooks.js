const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const config = require('../config');
const storage = require('../storage');

/**
 * Verify Razorpay Webhook Signature
 */
function verifyWebhookSignature(rawBody, signature, secret) {
  if (!secret) return true; // If secret is not set, skip verification for local test
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

// Ingest Razorpay Webhooks
router.post('/razorpay', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (config.razorpay.webhookSecret && signature) {
    const isValid = verifyWebhookSignature(rawBody, signature, config.razorpay.webhookSecret);
    if (!isValid) {
      console.warn('Webhook signature verification failed!');
      return res.status(400).json({ status: 'invalid_signature' });
    }
  }

  const eventData = req.body;
  console.log(`[Webhook Received] Event: ${eventData.event}, Account: ${eventData.account_id}`);

  // Handle authorization revoked
  if (eventData.event === 'account.app.authorization_revoked') {
    const accountId = eventData.account_id;
    if (accountId) {
      storage.updateMerchantStatus(accountId, 'revoked');
      console.log(`Merchant ${accountId} authorization was REVOKED.`);
    }
  }

  // Save to webhook event log
  const logEntry = storage.saveWebhook(eventData);

  res.status(200).json({ status: 'ok', received_id: logEntry.id });
});

// Get webhook logs
router.get('/logs', (req, res) => {
  const logs = storage.getWebhooks();
  res.json(logs);
});

// Clear webhook logs
router.delete('/logs', (req, res) => {
  storage.clearWebhooks();
  res.json({ message: 'Webhook logs cleared' });
});

// Test / Simulate a webhook event locally without requiring ngrok
router.post('/simulate', (req, res) => {
  const { event = 'payment.captured', accountId = 'acc_test123', paymentId = 'pay_test123', amount = 10000 } = req.body;

  const mockWebhook = {
    entity: 'event',
    account_id: accountId,
    event: event,
    contains: ['payment'],
    payload: {
      payment: {
        entity: {
          id: paymentId,
          entity: 'payment',
          amount: amount,
          currency: 'INR',
          status: event.replace('payment.', ''),
          order_id: `order_${Date.now()}`,
          method: 'card',
          created_at: Math.floor(Date.now() / 1000)
        }
      }
    },
    created_at: Math.floor(Date.now() / 1000)
  };

  const saved = storage.saveWebhook(mockWebhook);
  res.json({ message: 'Simulated webhook logged successfully', webhook: saved });
});

module.exports = router;
