const express = require('express');
const router = express.Router();
const razorpayService = require('../services/razorpay');
const storage = require('../storage');
const config = require('../config');

/**
 * Direct Platform Onboarding (Create Sub-Merchant via Accounts API v2)
 */
router.post('/create-submerchant', async (req, res) => {
  try {
    const {
      email,
      phone,
      legal_business_name,
      contact_name,
      business_type = 'proprietorship',
      category = 'ecommerce',
      subcategory = 'fashion_and_apparel',
      description,
      pan,
      gst,
      street1,
      city,
      state,
      postal_code
    } = req.body;

    if (!email || !phone || !legal_business_name) {
      return res.status(400).json({
        error: 'email, phone, and legal_business_name are required'
      });
    }

    // Build payload conforming to Razorpay v2 Accounts API
    const payload = {
      email: email.trim(),
      phone: phone.trim().replace(/\D/g, '').slice(-10),
      legal_business_name: legal_business_name.trim(),
      contact_name: (contact_name || legal_business_name).trim(),
      business_type: business_type.toLowerCase(),
      type: 'route', // Sub-merchant type linked to partner
      reference_id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profile: {
        category: category,
        subcategory: subcategory,
        description: description || `Onboarded via Tech Partner Integration Console`,
        addresses: {
          registered: {
            street1: street1 || '100 Tech Park',
            city: city || 'Bengaluru',
            state: state || 'Karnataka',
            postal_code: postal_code || '560001',
            country: 'IN'
          }
        }
      }
    };

    // Add optional legal identifiers if provided
    if (pan || gst) {
      payload.legal_info = {};
      if (pan) payload.legal_info.pan = pan.toUpperCase().trim();
      if (gst) payload.legal_info.gst = gst.toUpperCase().trim();
    }

    console.log('[Direct Onboarding] Creating Sub-Merchant Account on Razorpay:', payload.email);
    const createdAccount = await razorpayService.createSubMerchant(payload);
    console.log('[Direct Onboarding] Success! Created Account ID:', createdAccount.id);

    // Save into local storage so it immediately appears in Connected Sub-Merchants
    const savedMerchant = storage.saveMerchant({
      razorpay_account_id: createdAccount.id,
      email: createdAccount.email || email,
      phone: createdAccount.phone || phone,
      business_name: createdAccount.legal_business_name || legal_business_name,
      status: createdAccount.status || 'created',
      source: 'platform_onboarded',
      access_token: '', // v2 accounts can be managed via Partner API keys or activated
      public_token: '',
      raw_account: createdAccount
    });

    res.status(201).json({
      message: 'Sub-Merchant created successfully on your platform!',
      account: createdAccount,
      merchant: savedMerchant
    });
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error('[Direct Onboarding] Failed to create sub-merchant:', errorDetails);
    res.status(err.response?.status || 500).json({ error: errorDetails });
  }
});

/**
 * Fetch real-time sub-merchant status & KYC details from Razorpay
 */
router.get('/accounts/:accountId', async (req, res) => {
  try {
    const account = await razorpayService.fetchSubMerchant(req.params.accountId);
    res.json(account);
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error('Failed to fetch sub-merchant details:', errorDetails);
    res.status(err.response?.status || 500).json({ error: errorDetails });
  }
});

/**
 * List all sub-merchants onboarded via platform
 */
router.get('/accounts', (req, res) => {
  const merchants = storage.getMerchants();
  res.json(merchants);
});

module.exports = router;
