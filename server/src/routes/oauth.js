const express = require('express');
const router = express.Router();
const razorpayService = require('../services/razorpay');
const storage = require('../storage');
const config = require('../config');

// Get current OAuth config status
router.get('/config', (req, res) => {
  res.json({
    hasClientId: Boolean(config.razorpay.clientId),
    hasClientSecret: Boolean(config.razorpay.clientSecret),
    redirectUri: config.razorpay.redirectUri,
    mode: config.razorpay.mode,
    hasWebhookSecret: Boolean(config.razorpay.webhookSecret)
  });
});

// Generate authorization URL
router.get('/connect-url', (req, res) => {
  try {
    if (!config.razorpay.clientId) {
      return res.status(400).json({
        error: 'RAZORPAY_CLIENT_ID is missing in server/.env'
      });
    }

    const state = req.query.state || `subm_${Date.now()}`;
    const url = razorpayService.getAuthorizeUrl(state);
    res.json({ url, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OAuth Callback handler (Razorpay redirects here after sub-merchant consents)
router.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    console.error('OAuth Callback Error from Razorpay:', error, error_description);
    return res.redirect(`${config.frontendUrl}/?error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    return res.redirect(`${config.frontendUrl}/?error=Authorization+code+missing`);
  }

  try {
    console.log(`Exchanging authorization code: ${code} (state: ${state})`);
    const tokenData = await razorpayService.getAccessToken(code);
    
    // tokenData typically includes:
    // access_token, refresh_token, public_token, token_type, expires_in, razorpay_account_id
    const saved = storage.saveMerchant(tokenData);
    console.log(`Successfully connected merchant: ${saved.razorpay_account_id}`);

    // Redirect back to frontend with success notice
    res.redirect(`${config.frontendUrl}/?connected=${saved.razorpay_account_id}`);
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error('Failed to exchange token:', errorDetails);
    res.redirect(`${config.frontendUrl}/?error=${encodeURIComponent(JSON.stringify(errorDetails))}`);
  }
});

// Direct code exchange API (useful if code redirected to another domain like Vercel)
router.post('/exchange-code', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'code is required' });
  }

  try {
    const tokenData = await razorpayService.getAccessToken(code.trim());
    const saved = storage.saveMerchant(tokenData);
    res.json({
      message: 'Authorization code exchanged successfully!',
      merchant: saved
    });
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error('Failed to exchange code:', errorDetails);
    res.status(500).json({ error: errorDetails });
  }
});

// Refresh Access Token
router.post('/refresh', async (req, res) => {
  const { accountId } = req.body;
  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  const merchant = storage.getMerchant(accountId);
  if (!merchant) {
    return res.status(404).json({ error: 'Merchant not found' });
  }

  if (!merchant.refresh_token) {
    return res.status(400).json({ error: 'No refresh_token found for this merchant' });
  }

  try {
    const refreshed = await razorpayService.refreshAccessToken(merchant.refresh_token);
    const updated = storage.saveMerchant({
      ...merchant,
      ...refreshed,
      razorpay_account_id: merchant.razorpay_account_id
    });

    res.json({
      message: 'Token refreshed successfully',
      merchant: updated
    });
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error('Failed to refresh token:', errorDetails);
    res.status(500).json({ error: errorDetails });
  }
});

module.exports = router;
