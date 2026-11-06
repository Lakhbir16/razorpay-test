const express = require('express');
const router = express.Router();
const storage = require('../storage');

// List connected merchants
router.get('/', (req, res) => {
  const merchants = storage.getMerchants();
  res.json(merchants);
});

// Get single merchant
router.get('/:accountId', (req, res) => {
  const merchant = storage.getMerchant(req.params.accountId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }
  res.json(merchant);
});

// Delete merchant locally
router.delete('/:accountId', (req, res) => {
  const updated = storage.deleteMerchant(req.params.accountId);
  res.json({ message: 'Merchant removed', merchants: updated });
});

// Manual merchant token add (helpful for testing direct access tokens if already generated)
router.post('/manual-add', (req, res) => {
  const { razorpay_account_id, access_token, refresh_token, public_token, expires_in } = req.body;
  
  if (!razorpay_account_id || !access_token) {
    return res.status(400).json({ error: 'razorpay_account_id and access_token are required' });
  }

  const saved = storage.saveMerchant({
    razorpay_account_id,
    access_token,
    refresh_token: refresh_token || '',
    public_token: public_token || '',
    token_type: 'Bearer',
    expires_in: expires_in || 7776000
  });

  res.json({ message: 'Merchant saved manually', merchant: saved });
});

module.exports = router;
