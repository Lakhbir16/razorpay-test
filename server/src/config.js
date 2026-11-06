const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  razorpay: {
    // Standard API Keys (for Partner Accounts API & v2 endpoints)
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',

    // OAuth Partner Application credentials
    clientId: process.env.RAZORPAY_CLIENT_ID || '',
    clientSecret: process.env.RAZORPAY_CLIENT_SECRET || '',
    redirectUri: process.env.RAZORPAY_REDIRECT_URI || 'http://localhost:5000/api/oauth/callback',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    mode: process.env.RAZORPAY_MODE || 'live',
    authBaseUrl: 'https://auth.razorpay.com',
    apiBaseUrl: 'https://api.razorpay.com/v1',
    accountsApiBaseUrl: 'https://api.razorpay.com/v2'
  }
};
